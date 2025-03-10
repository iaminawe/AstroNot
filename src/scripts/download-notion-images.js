#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import fetch from 'node-fetch';
import crypto from 'crypto';

// Load environment variables from .env file
config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define directories
const DATA_DIR = path.join(__dirname, '..', 'data');
const IMAGES_DIR = path.join(__dirname, '..', '..', 'public', 'images', 'notion');
const PROJECTS_DIR = path.join(__dirname, '..', 'pages', 'projects');

// Ensure the images directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  console.log(`Created directory: ${IMAGES_DIR}`);
}

// Regular expression to match Notion image URLs
const NOTION_URL_REGEX = /https:\/\/(?:prod-files-secure\.s3\.us-west-2\.amazonaws\.com|s3\.us-west-2\.amazonaws\.com)\/[^"'\s)]+/g;

/**
 * Download an image from a URL and save it locally
 * @param {string} url - The URL of the image to download
 * @returns {Promise<string>} - The local path to the downloaded image
 */
async function downloadImage(url) {
  try {
    // Generate a unique filename based on the URL
    const hash = crypto.createHash('md5').update(url).digest('hex');
    const extension = url.split('.').pop().split('?')[0] || 'jpg';
    const filename = `notion-${hash}.${extension}`;
    const localPath = path.join(IMAGES_DIR, filename);
    
    // Check if the file already exists
    if (fs.existsSync(localPath)) {
      console.log(`Image already exists: ${localPath}`);
      return `/images/notion/${filename}`;
    }
    
    // Download the image
    console.log(`Downloading image: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    fs.writeFileSync(localPath, buffer);
    
    console.log(`Downloaded image to: ${localPath}`);
    return `/images/notion/${filename}`;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    return url; // Return the original URL if download fails
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
    
    // Download images and get local paths
    let updatedContent = content;
    for (const url of urls) {
      const localPath = await downloadImage(url);
      updatedContent = updatedContent.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated ${filePath} with local image paths`);
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
    
    // Download images and get local paths
    let updatedContent = content;
    for (const url of urls) {
      const localPath = await downloadImage(url);
      updatedContent = updatedContent.replace(new RegExp(url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), localPath);
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated ${filePath} with local image paths`);
  } catch (error) {
    console.error(`Error processing MDX file ${filePath}:`, error);
  }
}

/**
 * Main function to download Notion images and update URLs
 */
async function downloadNotionImages() {
  console.log('Starting to download Notion images...');
  
  try {
    // Process JSON files in the data directory
    const jsonFiles = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
    for (const file of jsonFiles) {
      await processJsonFile(path.join(DATA_DIR, file));
    }
    
    // Process MDX files in the projects directory
    if (fs.existsSync(PROJECTS_DIR)) {
      const mdxFiles = fs.readdirSync(PROJECTS_DIR).filter(file => file.endsWith('.mdx'));
      for (const file of mdxFiles) {
        await processMdxFile(path.join(PROJECTS_DIR, file));
      }
    }
    
    console.log('Finished downloading Notion images');
  } catch (error) {
    console.error('Error downloading Notion images:', error);
  }
}

// Execute the function
downloadNotionImages().catch(console.error);
