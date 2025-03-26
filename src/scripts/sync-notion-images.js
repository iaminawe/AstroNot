#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import crypto from 'crypto';
import mime from 'mime-types';
import sharp from 'sharp';
import { 
  isS3Configured, 
  generateImageFilename, 
  uploadImageToS3, 
  imageExistsInS3, 
  getS3ImageUrl
} from '../helpers/s3.js';
import { needsSync, updateTimestamp, getCollectionLastSync, updateCollectionTimestamp } from './notion-timestamp-tracker.js';

// Load environment variables from .env file
config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define directories
const DATA_DIR = path.join(__dirname, '..', 'data');
const IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'notion');
const PROJECTS_DIR = path.join(__dirname, '..', 'pages', 'projects');
const MANIFEST_FILE = path.join(DATA_DIR, 'image-manifest.json');

// Parse command line arguments
const args = process.argv.slice(2);
const forceLocal = args.includes('--local');
const forceS3 = args.includes('--s3');

// Determine storage mode
let storageMode = 'local';
if (forceS3) {
  storageMode = 's3';
} else if (!forceLocal && isS3Configured()) {
  storageMode = 's3';
}

console.log(`Storage mode: ${storageMode.toUpperCase()}`);

// Ensure the images directory exists for local storage
if (storageMode === 'local' && !fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log(`Created directory: ${IMAGES_DIR}`);
}

// Ensure the data directory exists for the manifest
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created directory: ${DATA_DIR}`);
}

// Load or initialize the image manifest
let imageManifest = {};
if (fs.existsSync(MANIFEST_FILE)) {
  try {
    imageManifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, 'utf8'));
    console.log(`Loaded image manifest with ${Object.keys(imageManifest).length} entries`);
  } catch (error) {
    console.error(`Error loading image manifest: ${error.message}`);
    imageManifest = {};
  }
} else {
  console.log('Image manifest not found, creating a new one');
}

// Regular expressions to match Notion image URLs and local Notion paths
const NOTION_URL_REGEX = /https:\/\/(?:prod-files-secure\.s3\.us-west-2\.amazonaws\.com|s3\.us-west-2\.amazonaws\.com|greggcoppen\.s3\.ca-central-1\.amazonaws\.com)\/[^"'\s)]+/g;
const LOCAL_NOTION_PATH_REGEX = /[\"\']*\/images\/notion\/([^"'\s)]+)[\"\']*/g;

/**
 * Download an image from a URL
 * @param {string} url - The URL of the image to download
 * @returns {Promise<Buffer>} - The image data as a buffer
 */
async function downloadImage(url) {
  console.log(`Downloading image: ${url}`);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  
  return await response.buffer();
}

/**
 * Get the content type of an image from its URL
 * @param {string} url - The URL of the image
 * @returns {string} - The content type
 */
function getContentTypeFromUrl(url) {
  const extension = url.split('.').pop().split('?')[0] || 'jpg';
  return mime.lookup(extension) || 'image/jpeg';
}

/**
 * Process an image URL and return a local or S3 URL
 * @param {string} url - The URL of the image
 * @returns {Promise<string>} - The local or S3 URL
 */
/**
 * Optimize an image buffer using Sharp
 * @param {Buffer} imageBuffer - The original image buffer
 * @param {string} contentType - The content type of the image
 * @returns {Promise<Buffer>} - The optimized image buffer
 */
async function optimizeImage(imageBuffer, contentType) {
  try {
    let sharpInstance = sharp(imageBuffer);
    
    // Get image metadata
    const metadata = await sharpInstance.metadata();
    
    // Determine format-specific optimization options
    const format = contentType.split('/')[1];
    switch (format) {
      case 'jpeg':
      case 'jpg':
        sharpInstance = sharpInstance
          .jpeg({ quality: 80, progressive: true })
          .withMetadata();
        break;
      case 'png':
        sharpInstance = sharpInstance
          .png({ quality: 80, progressive: true })
          .withMetadata();
        break;
      case 'webp':
        sharpInstance = sharpInstance
          .webp({ quality: 80 })
          .withMetadata();
        break;
      case 'gif':
        // Do not optimize GIFs
        return imageBuffer;
      default:
        // For other formats, just resize if needed
        break;
    }
    
    // Resize if image is too large
    if (metadata.width > 2000 || metadata.height > 2000) {
      sharpInstance = sharpInstance.resize(2000, 2000, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    return await sharpInstance.toBuffer();
  } catch (error) {
    console.error('Error optimizing image:', error);
    return imageBuffer; // Return original buffer if optimization fails
  }
}

export async function processImageUrl(url, type = 'posts') {
  console.log(`processImageUrl called for: ${url} (type: ${type})`);
  if (!url) {
    console.warn("No URL provided");
    return null;
  }

  try {
    // Check if the URL is already an S3 URL from our own bucket
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Get our bucket name from environment
      const ourBucketName = process.env.S3_BUCKET_NAME;
      const ourRegion = process.env.S3_REGION || 'ca-central-1';
      
      // Only consider it "already processed" if it's from our own S3 bucket
      const ownBucketUrl = `${ourBucketName}.s3.${ourRegion}.amazonaws.com`;
      if (url.includes(ownBucketUrl)) {
        // Extract the current path parts
        const urlParts = url.split(ownBucketUrl + '/')[1].split('/');
        const currentPrefix = urlParts[0];
        const currentFilename = urlParts[urlParts.length - 1];
        
        // Check if we need to move the file to a different prefix
        if (type !== currentPrefix) {
          console.log(`Moving file from ${currentPrefix} to ${type} prefix`);
          // Download the file from current location
          const imageBuffer = await downloadImage(url);
          if (imageBuffer) {
            const contentType = getContentTypeFromUrl(url);
            // Upload to new location with correct prefix
            const newUrl = await uploadImageToS3(imageBuffer, currentFilename, contentType, type);
            return newUrl;
          }
        } else {
          console.log(`URL is already in correct S3 location: ${url}`);
          return url;
        }
      }
    }
    
    // Notion's temporary S3 URLs need to be processed
    if ((url.includes('.s3.') || url.includes('s3.amazonaws.com')) && 
        (url.includes('X-Amz-Expires') || url.includes('prod-files-secure'))) {
      console.log(`Processing temporary Notion S3 URL: ${url}`);
      // Continue processing to download and upload to our bucket
    }
    console.log(`Downloading image: ${url}`);
    const imageBuffer = await downloadImage(url);
    console.log(`Image downloaded successfully: ${url}`);

    if (!imageBuffer) {
      console.warn(`Failed to download image: ${url}`);
      return null;
    }

    const filename = generateImageFilename(imageBuffer, { type });
    const extension = mime.extension(getContentTypeFromUrl(url)) || 'jpg';
    const s3Key = `${type}/${filename}.${extension}`;
    console.log(`Generated S3 key: ${s3Key}`);

    // Check if the image already exists in the manifest
    const existingEntry = Object.entries(imageManifest).find(([_, data]) => 
      data.filename === filename
    );

    if (existingEntry) {
      console.log(`Image already exists in manifest: ${s3Key}`);
      // Update manifest to map this URL to the existing file
      imageManifest[url] = {
        filename,
        contentType: getContentTypeFromUrl(url),
        lastUsed: Date.now(),
        path: existingEntry[1].path
      };
      return existingEntry[1].path;
    }

    // Optimize the image
    console.log(`Optimizing image: ${url}`);
    const optimizedBuffer = await optimizeImage(imageBuffer, getContentTypeFromUrl(url));
    console.log(`Image optimized successfully: ${url}`);

    if (!optimizedBuffer) {
      console.warn(`Failed to optimize image: ${url}`);
      return null;
    }

    if (storageMode === 's3') {
      // Upload to S3 if not exists
      if (!await imageExistsInS3(filename)) {
        await uploadImageToS3(optimizedBuffer, filename, getContentTypeFromUrl(url), type);
        console.log(`Uploaded new optimized image to S3: ${filename} (${type})`);
      }
      // Pass the type to getS3ImageUrl to ensure correct prefix is used
      const s3Url = getS3ImageUrl(filename, type);
      imageManifest[url] = {
        filename,
        contentType: getContentTypeFromUrl(url),
        lastUsed: Date.now(),
        path: s3Url
      };
      return s3Url;
    } else {
      // Local storage mode
      const localPath = path.join(IMAGES_DIR, filename);
      if (!fs.existsSync(localPath)) {
        fs.writeFileSync(localPath, optimizedBuffer);
        console.log(`Downloaded new optimized image to: ${localPath}`);
      }
      const publicPath = `/images/notion/${filename}`;
      imageManifest[url] = {
        filename,
        contentType: getContentTypeFromUrl(url),
        lastUsed: Date.now(),
        path: publicPath
      };
      return publicPath;
    }
  } catch (error) {
    console.error(`Error processing image from ${url}: ${error}`);
    return null;
  }
}

/**
 * Migrate a local image to S3
 * @param {string} filename - The filename of the local image
 * @returns {Promise<string|null>} - The S3 URL if successful, null if failed
 */
async function migrateLocalImage(filename) {
  try {
    // Extract just the filename from the path
    const basename = filename.split('/').pop();
    const localPath = path.join(IMAGES_DIR, basename);
    
    if (!fs.existsSync(localPath)) {
      console.log(`Local image not found: ${localPath}`);
      return null;
    }

    // Determine the image type based on the filename and path
    let type = 'posts';
    if (filename.startsWith('author-') || filename.includes('/author/')) {
      type = 'author';
    } else if (filename.startsWith('about-') || filename.includes('/about/')) {
      type = 'about';
    } else if (filename.includes('/projects/') || filename.startsWith('project-')) {
      type = 'projects';
    }
    console.log(`Determined image type: ${type} for file: ${filename}`);

    const imageBuffer = fs.readFileSync(localPath);
    const contentType = mime.lookup(filename) || 'image/jpeg';
    const extension = mime.extension(contentType) || 'jpg';

    // Upload to S3
    if (!await imageExistsInS3(filename)) {
      const optimizedBuffer = await optimizeImage(imageBuffer, contentType);
      await uploadImageToS3(optimizedBuffer, filename, contentType, type);
      console.log(`Migrated image to S3: ${filename} (${type})`);
    } else {
      console.log(`Image already exists in S3: ${filename}`);
    }

    return getS3ImageUrl(filename);
  } catch (error) {
    console.error(`Error migrating local image ${filename}:`, error);
    return null;
  }
}

/**
 * Process a JSON file to download images and update URLs
 * @param {string} filePath - The path to the JSON file
 */
async function processJsonFile(filePath) {
  try {
    console.log(`Processing JSON file: ${filePath}`);
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all Notion image URLs and local paths
    const urls = content.match(NOTION_URL_REGEX) || [];
    const localPaths = Array.from(content.matchAll(LOCAL_NOTION_PATH_REGEX) || []);
    
    console.log(`Found ${urls.length} Notion URLs and ${localPaths.length} local paths in ${filePath}`);
    
    let updatedContent = content;

    // Determine the type based on the file being processed
    let type = 'posts';
    const filename = path.basename(filePath);
    if (filename === 'author.json') {
      type = 'author';
      console.log('Processing author images');
    } else if (filename === 'about.json') {
      type = 'about';
      console.log('Processing about page images');
    }

    // Process Notion URLs
    for (const url of urls) {
      // Skip URLs that are already in our S3 bucket with the correct prefix
      if (url.includes(`${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}`)) {
        const hasCorrectPrefix = (type === 'author' && url.includes('/author/')) ||
                               (type === 'about' && url.includes('/about/'));
        if (hasCorrectPrefix) {
          console.log(`URL is already in correct S3 location: ${url}`);
          continue;
        }
      }

      // Look for original Notion URL in manifest
      const manifestEntry = Object.entries(imageManifest).find(([notionUrl, data]) => 
        data.path === url || url === notionUrl
      );

      if (manifestEntry) {
        const [notionUrl, data] = manifestEntry;
        console.log(`Found original Notion URL in manifest: ${notionUrl}`);
        try {
          console.log(`Downloading from original Notion URL: ${notionUrl}`);
          const imageBuffer = await downloadImage(notionUrl);
          
          if (imageBuffer) {
            const contentType = getContentTypeFromUrl(notionUrl);
            const filename = generateImageFilename(imageBuffer, { type });
            console.log(`Uploading image to S3 with type ${type}: ${filename}`);
            const newUrl = await uploadImageToS3(imageBuffer, filename, contentType, type);
            
            if (newUrl) {
              updatedContent = updatedContent.replace(
                new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
                newUrl
              );
              console.log(`Successfully processed image: ${newUrl}`);
            }
          }
        } catch (error) {
          console.error(`Error processing image from manifest: ${error}`);
        }
      } else {
        console.log(`No manifest entry found for URL: ${url}`);
        // Try to process the URL directly through processImageUrl
        const newUrl = await processImageUrl(url, type);
        if (newUrl) {
          updatedContent = updatedContent.replace(
            new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
            newUrl
          );
        }
      }
    }

    // Process local paths
    if (storageMode === 's3') {
      for (const match of localPaths) {
        const [fullMatch, filename] = match;
        const fullPath = path.join(IMAGES_DIR, filename);
        const s3Url = await migrateLocalImage(fullPath);
        if (s3Url) {
          updatedContent = updatedContent.replace(new RegExp(fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), s3Url);
        }
      }
    }
    
    // Write the updated content back to the file if changed
    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Updated ${filePath} with new image paths`);
    }
  } catch (error) {
    console.error(`Error processing JSON file ${filePath}:`, error);
  }
}

/**
 * Process an MDX file to download images and update URLs
 * @param {string} filePath - The path to the MDX file
 */
async function processMdxFile(filePath) {
  try {
    console.log(`Processing MDX file: ${filePath}`);
    
    // Determine if this is a project file
    const isProjectFile = filePath.includes('/projects/');
    console.log(`File type: ${isProjectFile ? 'Project' : 'Post'}`);
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all Notion image URLs and local paths
    const urls = content.match(NOTION_URL_REGEX) || [];
    const localPaths = Array.from(content.matchAll(LOCAL_NOTION_PATH_REGEX) || []);
    
    console.log(`Found ${urls.length} Notion URLs and ${localPaths.length} local paths in ${filePath}`);
    
    let updatedContent = content;

    // Process Notion URLs
    for (const url of urls) {
      const newUrl = await processImageUrl(url, isProjectFile ? 'projects' : 'posts');
      updatedContent = updatedContent.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
    }

    // Process local paths
    if (storageMode === 's3') {
      for (const match of localPaths) {
        const [fullMatch, filename] = match;
        const fullPath = path.join(IMAGES_DIR, filename);
        const s3Url = await migrateLocalImage(fullPath);
        if (s3Url) {
          updatedContent = updatedContent.replace(new RegExp(fullMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), s3Url);
        }
      }
    }
    
    // Write the updated content back to the file if changed
    if (updatedContent !== content) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`Updated ${filePath} with new image paths`);
    }
  } catch (error) {
    console.error(`Error processing MDX file ${filePath}:`, error);
  }
}

/**
 * Clean up unused images
 */
async function cleanupUnusedImages() {
  console.log('Cleaning up unused images...');
  const currentTime = Date.now();
  const unusedThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days
  const usedFilenames = new Set();

  // First, collect all currently used filenames
  Object.values(imageManifest).forEach(data => {
    if ((currentTime - data.lastUsed) <= unusedThreshold) {
      usedFilenames.add(data.filename);
    }
  });

  // If in S3 mode, remove all local files after confirming they're in S3
  if (storageMode === 's3' && fs.existsSync(IMAGES_DIR)) {
    const files = fs.readdirSync(IMAGES_DIR);
    for (const file of files) {
      const filePath = path.join(IMAGES_DIR, file);
      try {
        const s3Url = await migrateLocalImage(filePath);
        if (s3Url) {
          fs.unlinkSync(filePath);
          console.log(`Removed local image (migrated to S3): ${file}`);
        } else {
          console.log(`Keeping local image (not in S3): ${file}`);
        }
      } catch (error) {
        console.error(`Error checking/removing file ${file}:`, error);
      }
    }
  }
  // Clean up local files in local mode
  else if (storageMode === 'local' && fs.existsSync(IMAGES_DIR)) {
    const files = fs.readdirSync(IMAGES_DIR);
    for (const file of files) {
      if (!usedFilenames.has(file)) {
        const filePath = path.join(IMAGES_DIR, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`Removed unused image: ${file}`);
        } catch (error) {
          console.error(`Error removing file ${file}:`, error);
        }
      }
    }
  }

  // Clean up manifest
  const urlsToRemove = [];
  for (const [url, data] of Object.entries(imageManifest)) {
    if (!usedFilenames.has(data.filename)) {
      urlsToRemove.push(url);
    }
  }

  urlsToRemove.forEach(url => delete imageManifest[url]);
  console.log(`Cleaned up ${urlsToRemove.length} unused entries from manifest`);
}

/**
 * Main function to sync Notion images
 */
async function syncNotionImages() {
  console.log(`Starting to sync Notion images (${storageMode.toUpperCase()} mode)...`);
  
  // Get the last sync time for images
  const lastSyncTime = getCollectionLastSync('images');
  console.log("Last images sync time:", lastSyncTime || "Never synced");
  
  try {
    let processedFiles = 0;
    
    // Process JSON files in the data directory
    const jsonFiles = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json') && file !== 'image-manifest.json');
    for (const file of jsonFiles) {
      await processJsonFile(path.join(DATA_DIR, file));
      processedFiles++;
    }
    
    // Process MDX files in the projects directory
    if (fs.existsSync(PROJECTS_DIR)) {
      const mdxFiles = fs.readdirSync(PROJECTS_DIR).filter(file => file.endsWith('.mdx'));
      for (const file of mdxFiles) {
        await processMdxFile(path.join(PROJECTS_DIR, file));
        processedFiles++;
      }
    }
    
    // Clean up unused images
    await cleanupUnusedImages();
    
    // Save the updated manifest
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(imageManifest, null, 2));
    console.log(`Saved image manifest with ${Object.keys(imageManifest).length} entries`);
    
    // Update the collection timestamp after processing all images
    updateCollectionTimestamp('images');
    
    console.log(`Finished syncing Notion images. Processed ${processedFiles} files.`);
  } catch (error) {
    console.error('Error syncing Notion images:', error);
  }
}

// Execute the function
syncNotionImages().catch(console.error);
