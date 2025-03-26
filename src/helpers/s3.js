import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from 'dotenv';

// Load environment variables
config();

// S3 configuration
const s3Config = {
  region: process.env.S3_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// S3 bucket name
const bucketName = process.env.S3_BUCKET_NAME;

// Image prefixes in S3 bucket
const S3_PREFIXES = {
  posts: process.env.S3_POSTS_PREFIX || 'posts',
  projects: process.env.S3_PROJECTS_PREFIX || 'projects'
};

// Default image prefix (for backward compatibility)
const imagePrefix = process.env.S3_IMAGE_PREFIX || '';

// Check if S3 credentials are configured and if Notion connections are allowed
export const isS3Configured = () => {
  // If DISABLE_NOTION_CONNECTIONS is set to true, return false to prevent S3 connections during build
  if (process.env.DISABLE_NOTION_CONNECTIONS === 'true') {
    return false;
  }
  
  return (
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
};

// Initialize S3 client if credentials are available and Notion connections are allowed
let s3Client = null;
if (isS3Configured()) {
  try {
    s3Client = new S3Client(s3Config);
    console.log('S3 client initialized successfully');
  } catch (error) {
    console.error('Error initializing S3 client:', error);
  }
} else if (process.env.DISABLE_NOTION_CONNECTIONS === 'true') {
  console.log('S3 client initialization skipped due to DISABLE_NOTION_CONNECTIONS=true');
}

/**
 * Generate a unique filename for an image based on its content
 * @param {Buffer} imageBuffer - The image data as a buffer
 * @param {string} extension - The file extension (default: jpg)
 * @returns {string} - The generated filename
 */
export const generateImageFilename = (imageBuffer, { extension = 'jpg', type = 'posts', isCover = false } = {}) => {
  const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
  const prefix = type === 'projects' ? 'project' : 'notion';
  return `${prefix}-${hash}${isCover ? '-cover' : ''}.${extension}`;
};

/**
 * Upload an image to S3
 * @param {Buffer} imageBuffer - The image data as a buffer
 * @param {string} filename - The filename to use in S3
 * @param {string} contentType - The content type of the image
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export const uploadImageToS3 = async (imageBuffer, filename, contentType = 'image/jpeg', type = 'posts') => {
  if (!isS3Configured() || !s3Client) {
    throw new Error('S3 is not configured');
  }

  // Use type-specific prefix if available, fallback to default prefix
  const prefix = S3_PREFIXES[type] || imagePrefix;
  const key = prefix ? `${prefix}/${filename}` : filename;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
      CacheControl: 'max-age=31536000', // Cache for 1 year
      ACL: 'public-read' // Ensure public read access
    });

    await s3Client.send(command);
    
    // Return the public URL
    return `https://${bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
  } catch (error) {
    console.error(`Error uploading image to S3: ${filename}`, error);
    throw error;
  }
};

/**
 * Generate a signed URL for an S3 object
 * @param {string} key - The key of the S3 object
 * @param {number} expiresIn - The number of seconds until the URL expires
 * @returns {Promise<string>} - The signed URL
 */
export const getSignedS3Url = async (key, expiresIn = 3600) => {
  if (!isS3Configured() || !s3Client) {
    throw new Error('S3 is not configured');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error(`Error generating signed URL for S3 object: ${key}`, error);
    throw error;
  }
};

/**
 * Check if an image exists in S3
 * @param {string} filename - The filename to check
 * @returns {Promise<boolean>} - Whether the image exists in S3
 */
export const imageExistsInS3 = async (filename) => {
  if (!isS3Configured() || !s3Client) {
    return false;
  }

  const key = imagePrefix ? `${imagePrefix}/${filename}` : filename;

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      return false;
    }
    console.error(`Error checking if image exists in S3: ${filename}`, error);
    return false;
  }
};

/**
 * Get the public URL for an image in S3
 * @param {string} filename - The filename in S3
 * @param {string} type - The type of image (posts, projects, etc.)
 * @returns {string} - The public URL
 */
export const getS3ImageUrl = (filename, type = 'posts') => {
  // Use type-specific prefix if available, fallback to default prefix
  const prefix = S3_PREFIXES[type] || imagePrefix;
  
  // If the filename already contains the prefix, don't add it again
  if (filename && filename.includes(`/${prefix}/`)) {
    return filename;
  }
  
  const key = prefix ? `${prefix}/${filename}` : filename;
  return `https://${bucketName}.s3.${s3Config.region}.amazonaws.com/${key}`;
};
