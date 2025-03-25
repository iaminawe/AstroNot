#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import mime from 'mime-types';
import { 
  isS3Configured, 
  uploadImageToS3,
  getS3ImageUrl 
} from '../helpers/s3.js';

// Load environment variables from .env file
config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define directories
const POSTS_IMAGES_DIR = path.join(__dirname, '..', 'images', 'posts');
const PROJECTS_IMAGES_DIR = path.join(__dirname, '..', 'images', 'projects');

// Check if S3 is configured
if (!isS3Configured()) {
  console.error('S3 is not configured. Please set the required environment variables.');
  process.exit(1);
}

async function uploadCoverImages() {
  console.log('Starting to upload cover images to S3...');
  
  // Upload post cover images
  const postFiles = fs.readdirSync(POSTS_IMAGES_DIR).filter(file => file.includes('-cover'));
  console.log(`Found ${postFiles.length} post cover images to upload`);
  
  for (const file of postFiles) {
    const filePath = path.join(POSTS_IMAGES_DIR, file);
    const contentType = mime.lookup(filePath) || 'image/jpeg';
    const fileBuffer = fs.readFileSync(filePath);
    
    try {
      // Extract the filename without path
      const filename = path.basename(file);
      
      // Upload to S3 with 'posts' type
      const s3Url = await uploadImageToS3(fileBuffer, filename, contentType, 'posts');
      console.log(`Uploaded ${filename} to S3: ${s3Url}`);
    } catch (error) {
      console.error(`Error uploading ${file} to S3:`, error);
    }
  }
  
  // Upload project cover images
  const projectFiles = fs.readdirSync(PROJECTS_IMAGES_DIR).filter(file => file.includes('-cover'));
  console.log(`Found ${projectFiles.length} project cover images to upload`);
  
  for (const file of projectFiles) {
    const filePath = path.join(PROJECTS_IMAGES_DIR, file);
    const contentType = mime.lookup(filePath) || 'image/jpeg';
    const fileBuffer = fs.readFileSync(filePath);
    
    try {
      // Extract the filename without path
      const filename = path.basename(file);
      
      // Upload to S3 with 'projects' type
      const s3Url = await uploadImageToS3(fileBuffer, filename, contentType, 'projects');
      console.log(`Uploaded ${filename} to S3: ${s3Url}`);
    } catch (error) {
      console.error(`Error uploading ${file} to S3:`, error);
    }
  }
  
  console.log('Finished uploading cover images to S3');
}

// Execute the function
uploadCoverImages().catch(console.error);
