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

// Image prefix in S3 bucket
const imagePrefix = process.env.S3_IMAGE_PREFIX || 'notion-images';

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
if (isS3Configured()) {
  try {
    s3Client = new S3Client(s3Config);
    console.log('S3 client initialized successfully');
  } catch (error) {
    console.error('Error initializing S3 client:', error);
  }
}

/**
 * Generate a unique filename for an image based on its URL
 * @param {string} url - The URL of the image
 * @param {string} extension - The file extension (default: jpg)
 * @returns {string} - The generated filename
 */
export const generateImageFilename = (url, extension = 'jpg') => {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const fileExtension = extension || url.split('.').pop().split('?')[0] || 'jpg';
  return `notion-${hash}.${fileExtension}`;
};

/**
 * Upload an image to S3
 * @param {Buffer} imageBuffer - The image data as a buffer
 * @param {string} filename - The filename to use in S3
 * @param {string} contentType - The content type of the image
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export const uploadImageToS3 = async (imageBuffer, filename, contentType = 'image/jpeg') => {
  if (!isS3Configured() || !s3Client) {
    throw new Error('S3 is not configured');
  }

  const key = `${imagePrefix}/${filename}`;

  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: imageBuffer,
      ContentType: contentType,
      CacheControl: 'max-age=31536000', // Cache for 1 year
      ACL: 'public-read'
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

  const key = `${imagePrefix}/${filename}`;

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
 * @returns {string} - The public URL
 */
export const getS3ImageUrl = (filename) => {
  return `https://${bucketName}.s3.${s3Config.region}.amazonaws.com/${imagePrefix}/${filename}`;
};
