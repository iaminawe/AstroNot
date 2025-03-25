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

async function processImageUrl(url) {
  try {
    // Download the image first to get its content hash
    const imageBuffer = await downloadImage(url);
    const contentType = getContentTypeFromUrl(url);
    const extension = mime.extension(contentType) || 'jpg';

    // Generate filename based on content hash
    const filename = generateImageFilename(imageBuffer, extension);

    // Check if we've already processed this content hash
    const existingEntry = Object.entries(imageManifest).find(([_, data]) => 
      data.filename === filename
    );

    if (existingEntry) {
      console.log(`Using existing image for ${url} -> ${filename}`);
      // Update manifest to map this URL to the existing file
      imageManifest[url] = {
        filename,
        contentType,
        lastUsed: Date.now(),
        path: existingEntry[1].path
      };
      return existingEntry[1].path;
    }

    // Optimize the image
    const optimizedBuffer = await optimizeImage(imageBuffer, contentType);

    if (storageMode === 's3') {
      // Upload to S3 if not exists
      if (!await imageExistsInS3(filename)) {
        await uploadImageToS3(optimizedBuffer, filename, contentType);
        console.log(`Uploaded new optimized image to S3: ${filename}`);
      }
      const s3Url = getS3ImageUrl(filename);
      imageManifest[url] = {
        filename,
        contentType,
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
        contentType,
        lastUsed: Date.now(),
        path: publicPath
      };
      return publicPath;
    }
  } catch (error) {
    console.error(`Error processing image from ${url}:`, error);
    return url; // Return the original URL if processing fails
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

    const imageBuffer = fs.readFileSync(localPath);
    const contentType = mime.lookup(filename) || 'image/jpeg';

    // Upload to S3
    if (!await imageExistsInS3(filename)) {
      const optimizedBuffer = await optimizeImage(imageBuffer, contentType);
      await uploadImageToS3(optimizedBuffer, filename, contentType);
      console.log(`Migrated image to S3: ${filename}`);
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

    // Process Notion URLs
    for (const url of urls) {
      const newUrl = await processImageUrl(url);
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
    
    // Read the file
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find all Notion image URLs and local paths
    const urls = content.match(NOTION_URL_REGEX) || [];
    const localPaths = Array.from(content.matchAll(LOCAL_NOTION_PATH_REGEX) || []);
    
    console.log(`Found ${urls.length} Notion URLs and ${localPaths.length} local paths in ${filePath}`);
    
    let updatedContent = content;

    // Process Notion URLs
    for (const url of urls) {
      const newUrl = await processImageUrl(url);
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
