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
  projects: process.env.S3_PROJECTS_PREFIX || 'projects',
  author: process.env.S3_AUTHOR_PREFIX || 'author',
  about: process.env.S3_ABOUT_PREFIX || 'about'
};

// Check if S3 credentials are configured
export const isS3Configured = () => {
  return (
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
};

// Initialize S3 client if credentials are available
let s3Client = null;

// Create folders in S3 if they don't exist
async function ensureS3Folders() {
  if (!isS3Configured() || !s3Client) {
    return;
  }

  for (const [type, prefix] of Object.entries(S3_PREFIXES)) {
    try {
      const folderKey = `${prefix}/.keep`;
      const folderCommand = new PutObjectCommand({
        Bucket: bucketName,
        Key: folderKey,
        Body: '',
      });
      await s3Client.send(folderCommand);
      console.log(`Created/verified S3 folder: ${prefix}/`);
    } catch (error) {
      console.error(`Error creating/verifying S3 folder ${prefix}/: ${error.message}`);
    }
  }
}

// Default image prefix (for backward compatibility)
const imagePrefix = process.env.S3_IMAGE_PREFIX || '';

// Initialize S3 client and ensure folders exist
if (isS3Configured()) {
  try {
    s3Client = new S3Client(s3Config);
    console.log('S3 client initialized successfully');
    ensureS3Folders().catch(console.error);
  } catch (error) {
    console.error('Error initializing S3 client:', error);
  }
}

/**
 * Generate a unique filename for an image based on its content
 * @param {Buffer} imageBuffer - The image data as a buffer
 * @param {string} extension - The file extension (default: jpg)
 * @returns {string} - The generated filename
 */
export const generateImageFilename = (imageBuffer, { extension = 'jpg', type = 'posts', isCover = false, contentType = null } = {}) => {
  const hash = crypto.createHash('sha256').update(imageBuffer).digest('hex');
  let prefix;
  switch (type) {
    case 'projects':
      prefix = 'project';
      break;
    case 'author':
      prefix = 'author';
      break;
    case 'about':
      prefix = 'about';
      break;
    default:
      prefix = 'notion';
  }
  
  // If contentType is provided, use its extension
  if (contentType) {
    const ext = contentType.split('/')[1];
    if (ext === 'gif') {
      // For GIFs, just use the hash without prefix
      return `${hash}${isCover ? '-cover' : ''}.${ext}`;
    }
  }
  
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

  // Determine the correct prefix based on the type and filename
  let prefix;
  if (type === 'author' || filename.startsWith('author-')) {
    prefix = S3_PREFIXES.author;
  } else if (type === 'about' || filename.startsWith('about-')) {
    prefix = S3_PREFIXES.about;
  } else if (type === 'projects' || filename.startsWith('project-')) {
    prefix = S3_PREFIXES.projects;
  } else {
    prefix = S3_PREFIXES.posts;
  }

  // Create an empty object in the folder to ensure it exists
  try {
    const folderKey = `${prefix}/.keep`;
    const folderCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: folderKey,
      Body: '',
    });
    await s3Client.send(folderCommand);
    console.log(`Created/verified folder: ${prefix}/`);
  } catch (error) {
    console.error(`Error creating folder ${prefix}/: ${error.message}`);
  }

  const key = prefix ? `${prefix}/${filename}` : filename;
  console.log(`Uploading image to S3 with key: ${key} (type: ${type})`);

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
      CacheControl: 'max-age=31536000' // Cache for 1 year
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
export const imageExistsInS3 = async (filename, type = 'posts') => {
  if (!isS3Configured() || !s3Client) {
    return false;
  }

  // Determine the correct prefix based on the type and filename
  let prefix;
  if (type === 'author' || filename.startsWith('author-')) {
    prefix = S3_PREFIXES.author;
  } else if (type === 'about' || filename.startsWith('about-')) {
    prefix = S3_PREFIXES.about;
  } else if (type === 'projects' || filename.startsWith('project-')) {
    prefix = S3_PREFIXES.projects;
  } else {
    prefix = S3_PREFIXES.posts;
  }

  const key = prefix ? `${prefix}/${filename}` : filename;
  console.log(`Checking if image exists in S3: ${key} (type: ${type})`);

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === 'NoSuchKey') {
      // If not found in the determined prefix, try the default prefix as fallback
      if (prefix !== imagePrefix && imagePrefix) {
        const fallbackKey = `${imagePrefix}/${filename}`;
        try {
          const fallbackCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: fallbackKey
          });
          await s3Client.send(fallbackCommand);
          return true;
        } catch (fallbackError) {
          if (fallbackError.name !== 'NoSuchKey') {
            console.error(`Error checking fallback location in S3: ${filename}`, fallbackError);
          }
          return false;
        }
      }
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
