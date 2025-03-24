#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import crypto from 'crypto';
import mime from 'mime-types';
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

// Regular expression to match Notion image URLs
const NOTION_URL_REGEX = /https:\/\/(?:prod-files-secure\.s3\.us-west-2\.amazonaws\.com|s3\.us-west-2\.amazonaws\.com)\/[^"'\s)]+/g;

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
async function processImageUrl(url) {
  try {
    // Generate a unique filename based on the URL
    const extension = url.split('.').pop().split('?')[0] || 'jpg';
    const filename = generateImageFilename(url, extension);
    const contentType = getContentTypeFromUrl(url);
    
    // Check if we've already processed this URL
    if (imageManifest[url]) {
      console.log(`Image already processed: ${url}`);
      return imageManifest[url];
    }
    
    // S3 storage mode
    if (storageMode === 's3') {
      // Check if the image already exists in S3
      const exists = await imageExistsInS3(filename);
      
      if (exists) {
        console.log(`Image already exists in S3: ${filename}`);
        const s3Url = getS3ImageUrl(filename);
        imageManifest[url] = s3Url;
        return s3Url;
      }
      
      // Download the image
      const imageBuffer = await downloadImage(url);
      
      // Upload to S3
      const s3Url = await uploadImageToS3(imageBuffer, filename, contentType);
      console.log(`Uploaded image to S3: ${filename}`);
      
      // Store in manifest
      imageManifest[url] = s3Url;
      return s3Url;
    } 
    // Local storage mode
    else {
      const localPath = path.join(IMAGES_DIR, filename);
      
      // Check if the file already exists locally
      if (fs.existsSync(localPath)) {
        console.log(`Image already exists locally: ${localPath}`);
        const publicPath = `/images/notion/${filename}`;
        imageManifest[url] = publicPath;
        return publicPath;
      }
      
      // Download the image
      const imageBuffer = await downloadImage(url);
      
      // Save locally
      fs.writeFileSync(localPath, imageBuffer);
      console.log(`Downloaded image to: ${localPath}`);
      
      // Store in manifest
      const publicPath = `/images/notion/${filename}`;
      imageManifest[url] = publicPath;
      return publicPath;
    }
  } catch (error) {
    console.error(`Error processing image from ${url}:`, error);
    return url; // Return the original URL if processing fails
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
    
    // Find all Notion image URLs
    const urls = content.match(NOTION_URL_REGEX) || [];
    console.log(`Found ${urls.length} Notion image URLs in ${filePath}`);
    
    if (urls.length === 0) {
      return;
    }
    
    // Process images and get new URLs
    let updatedContent = content;
    for (const url of urls) {
      const newUrl = await processImageUrl(url);
      updatedContent = updatedContent.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated ${filePath} with new image paths`);
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
    
    // Find all Notion image URLs
    const urls = content.match(NOTION_URL_REGEX) || [];
    console.log(`Found ${urls.length} Notion image URLs in ${filePath}`);
    
    if (urls.length === 0) {
      return;
    }
    
    // Process images and get new URLs
    let updatedContent = content;
    for (const url of urls) {
      const newUrl = await processImageUrl(url);
      updatedContent = updatedContent.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated ${filePath} with new image paths`);
  } catch (error) {
    console.error(`Error processing MDX file ${filePath}:`, error);
  }
}

/**
 * Main function to sync Notion images
 */
async function syncNotionImages() {
  console.log(`Starting to sync Notion images (${storageMode.toUpperCase()} mode)...`);
  
  // Get the last sync time for images
  const lastSyncTime = getCollectionLastSync('images');
  console.log("Last images sync time:", lastSyncTime || "Never synced");
  
  // Check if we need to sync based on the last sync time
  // For images, we always sync since we need to check all files for new Notion URLs
  // But we can use this for logging purposes
  
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
