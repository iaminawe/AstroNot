import path from "path";
import { fileURLToPath } from 'url';
import imageType from "image-type";
import crypto from "crypto";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGE_PATHS = {
  posts: 'src/images/posts',
  projects: 'src/images/projects'
};

const DEFAULT_IMAGE_PATH = IMAGE_PATHS.posts;

// IMPORTANT: This bit is required to allow dynamic importing of images via Astro & Vite
// postImageImport allows dynamically import images from local filesystem via Vite with variable names
export async function postImageImport(imageFileName) {
  console.log(`postImageImport called for: ${imageFileName}`);
  if (!imageFileName) {
    console.warn("No image filename provided");
    return null;
  }

  console.log('Starting postImageImport process');

  // Helper function to check if URL is an S3 URL
  function isS3Url(url) {
    return typeof url === 'string' && (url.includes('.s3.') || url.includes('s3.amazonaws.com'));
  }

  // Helper function to get public URL for an image
  function getPublicUrl(filename, type = 'posts') {
    const bucketName = process.env.S3_BUCKET_NAME || 'greggcoppen';
    const region = process.env.S3_REGION || 'ca-central-1';
    const prefix = type === 'projects' ? 'projects' : 'posts';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${prefix}/${filename}`;
  }

  // Helper function to get S3 URL with correct prefix
  function getS3Url(filename, type = 'posts') {
    const bucketName = process.env.S3_BUCKET_NAME || 'greggcoppen';
    const region = process.env.S3_REGION || 'ca-central-1';
    const prefix = type === 'projects' ? 'projects' : 'posts';
    return `https://${bucketName}.s3.${region}.amazonaws.com/${prefix}/${filename}`;
  }

  // Helper function to extract filename from URL
  function getFilenameFromUrl(url) {
    try {
      const urlParts = url.split('/');
      return urlParts[urlParts.length - 1];
    } catch (e) {
      console.error(`Error extracting filename from URL ${url}: ${e.message}`);
      return url;
    }
  }

  // Handle build mode and S3 URLs
  if (process.env.DISABLE_NOTION_CONNECTIONS === 'true') {
    // If it's already an S3 URL, use it as is
    if (isS3Url(imageFileName)) {
      return imageFileName;
    }
    // For non-URL paths during build, construct the S3 URL
    const filename = path.basename(imageFileName);
    // Check for project images in multiple ways:
    // 1. File starts with 'project-'
    // 2. File is in a projects directory
    // 3. URL contains /projects/
    const isProject = (
      filename.startsWith('project-') ||
      imageFileName.includes('/projects/') ||
      imageFileName.includes('\\projects\\') // Windows path support
    );
    return getPublicUrl(filename, isProject ? 'projects' : 'posts');
  }

  if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
    // Handle S3 URLs
    if (isS3Url(imageFileName)) {
      // Determine if this is likely a project or post image based on filename or URL
      const isProjectImage = imageFileName.includes('/project-') || imageFileName.includes('/projects/');
      const filename = getFilenameFromUrl(imageFileName);
      
      // Ensure URL has correct prefix
      if (isProjectImage && !imageFileName.includes('/projects/')) {
        imageFileName = getS3Url(filename, 'projects');
        console.log(`Added projects prefix to S3 URL: ${imageFileName}`);
      } else if (!imageFileName.includes('/posts/')) {
        imageFileName = getS3Url(filename, 'posts');
        console.log(`Added posts prefix to S3 URL: ${imageFileName}`);
      }
    }
    
    // Extract format from URL or use default
    const format = path.extname(imageFileName).slice(1) || 'jpg';
    
    // Check if it's an S3 URL with size info
    const sizeMatch = imageFileName.match(/-(\d+)x(\d+)\.[^.]+$/);
    let width = 1920;
    let height = 1080;

    if (sizeMatch) {
      width = parseInt(sizeMatch[1], 10);
      height = parseInt(sizeMatch[2], 10);
    }

    // For build mode or S3 URLs, return the full URL
    if (process.env.DISABLE_NOTION_CONNECTIONS === 'true' || isS3Url(imageFileName)) {
      console.log(`Returning S3/remote URL: ${imageFileName}`);
      return {
        default: {
          src: imageFileName,
          width,
          height,
          format: format.toLowerCase(),
          isS3: isS3Url(imageFileName),
          isRemote: true
        }
      };
    }

    // For local development with non-S3 URLs
    return {
      default: {
        src: imageFileName,
        width,
        height,
        format: format.toLowerCase(),
        isRemote: true
      }
    };
  }

  // For local images
  const filename = path.parse(imageFileName);
  const name = filename.name;
  const ext = filename.ext;

  if (!name) {
    console.warn("No image name found in", imageFileName);
    return null;
  }

  // Special handling for GIF files
  if (ext.toLowerCase() === '.gif') {
    console.log(`Processing GIF file: ${imageFileName}`);
    
    // Extract just the filename from the path
    const filenameOnly = path.basename(imageFileName);
    console.log(`GIF filename only: ${filenameOnly}`);
    
    // In build mode or if the file is already an S3 URL, return the S3 URL
    if (process.env.DISABLE_NOTION_CONNECTIONS === 'true' || isS3Url(imageFileName)) {
      const s3Url = isS3Url(imageFileName) ? imageFileName : getS3Url(filenameOnly);
      console.log(`Using S3 URL for GIF: ${s3Url}`);
      
      return {
        default: {
          src: s3Url,
          width: 800,
          height: 600,
          format: 'gif',
          isS3: true
        }
      };
    }
    
    // For non-build mode, find and upload the GIF
    // Try multiple potential locations
    const possiblePaths = [
      path.join(__dirname, '..', 'images', 'posts', filenameOnly),
      path.join(process.cwd(), 'src', 'images', 'posts', filenameOnly),
      imageFileName // Original path as fallback
    ];
    
    let foundPath = null;
    
    for (const pathToCheck of possiblePaths) {
      console.log(`Checking if GIF exists at: ${pathToCheck}`);
      if (fs.existsSync(pathToCheck)) {
        console.log(`GIF found at: ${pathToCheck}`);
        foundPath = pathToCheck;
        break;
      }
    }
    
    if (foundPath) {
      try {
        // Get the file buffer
        const fileBuffer = fs.readFileSync(foundPath);
        
        // Direct S3 upload
        try {
          const { uploadImageToS3 } = await import('../helpers/s3.js');
          const contentType = 'image/gif';
          const uploadedUrl = await uploadImageToS3(fileBuffer, filenameOnly, contentType, 'posts');
          console.log(`Successfully uploaded GIF directly to S3: ${uploadedUrl}`);
          
          return {
            default: {
              src: uploadedUrl,
              width: 800,
              height: 600,
              format: 'gif',
              isS3: true
            }
          };
        } catch (error) {
          console.error(`Error uploading GIF to S3: ${error.message}`);
          
          // Fallback to pre-constructed URL
          const s3Url = getS3Url(filenameOnly);
          console.log(`Fallback to pre-constructed S3 URL: ${s3Url}`);
          
          return {
            default: {
              src: s3Url,
              width: 800,
              height: 600,
              format: 'gif',
              isS3: true
            }
          };
        }
      } catch (error) {
        console.error(`Error processing GIF: ${error.message}`);
      }
    } else {
      console.warn(`GIF not found in any checked paths. Filename: ${filenameOnly}`);
    }
  }

  // Create a map of supported image formats for all image directories
  const postImages = import.meta.glob('../images/posts/*.(webp|jpg|png|svg|gif|avif|jpeg|bmp)', { eager: true });
  const projectImages = import.meta.glob('../images/projects/*.(webp|jpg|png|svg|gif|avif|jpeg|bmp)', { eager: true });
  
  // Helper function to normalize local image data
  const normalizeLocalImage = (imgData) => {
    if (!imgData?.default) return null;
    const { src, width, height, format } = imgData.default;
    return {
      default: {
        src: String(src),
        width: Number(width) || 1920,
        height: Number(height) || 1080,
        format: String(format || path.extname(src).slice(1) || 'jpg')
      }
    };
  };

  // Try posts directory first
  const absolutePostsImagesDir = path.join(__dirname, '..', 'images', 'posts');
  const postPath = path.join(absolutePostsImagesDir, `${name}${ext}`);
  console.log(`Checking if image exists in posts directory: ${postPath}`);
  if (fs.existsSync(postPath) && postImages[postPath]) {
    console.log(`Image found in posts directory: ${postPath}`);
    return normalizeLocalImage(postImages[postPath]);
  }

  // Try projects directory
  const absoluteProjectsImagesDir = path.join(__dirname, '..', 'images', 'projects');
  const projectPath = path.join(absoluteProjectsImagesDir, `${name}${ext}`);
  if (fs.existsSync(projectPath) && projectImages[projectPath]) {
    return normalizeLocalImage(projectImages[projectPath]);
  }

  // Try to find the image in any directory
  const allImages = { ...postImages, ...projectImages };
  const imagePath = path.join(__dirname, '..', 'images', 'posts', `${name}${ext}`);
  if (allImages[imagePath]) {
    return normalizeLocalImage(allImages[imagePath]);
  }

  // Try with .jpg extension as fallback in both directories
  const postJpgPath = `../images/posts/${name}.jpg`;
  if (postImages[postJpgPath]) {
    return normalizeLocalImage(postImages[postJpgPath]);
  }

  const projectJpgPath = `../images/projects/${name}.jpg`;
  if (projectImages[projectJpgPath]) {
    return normalizeLocalImage(projectImages[projectJpgPath]);
  }

  // If we couldn't find the image and we're in a build environment with DISABLE_NOTION_CONNECTIONS set,
  // provide a fallback S3 URL so the build can continue
  if (process.env.DISABLE_NOTION_CONNECTIONS === 'true') {
    console.warn(`Image not found, providing fallback for build: ${name}${ext}`);
    
    // Check if this is a cover image from the filename
    const isCoverImage = name.includes('-cover');
    
    // Determine if this is likely a project or post image
    const isProjectImage = name.includes('project-');
    const type = isProjectImage ? 'projects' : 'posts';
    
    // Create a fallback S3 URL with the correct prefix
    const bucketName = process.env.S3_BUCKET_NAME || 'greggcoppen';
    const region = process.env.S3_REGION || 'ca-central-1';
    const prefix = isProjectImage ? 
      (process.env.S3_PROJECTS_PREFIX || 'projects') : 
      (process.env.S3_POSTS_PREFIX || 'posts');
    
    const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${prefix}/${name}${ext}`;
    
    console.log(`Generated fallback S3 URL: ${s3Url}`);
    
    // Construct the local image path
    const localImagePath = path.join(absolutePostsImagesDir, `${name}${ext}`);

    if (fs.existsSync(localImagePath)) {
      console.log(`Image exists locally. Uploading to S3: ${localImagePath}`);
      // Call processImageUrl to upload the local image to S3
      const uploadedS3Url = await processImageUrl(s3Url, type);
      
      return {
        default: {
          src: uploadedS3Url,
          width: 1920,
          height: 1080,
          format: ext.slice(1) || 'jpg',
          isS3: true
        }
      };
    } else {
      console.warn(`Image does not exist locally: ${localImagePath}`);
    }
  }
  throw new Error(`Image not found in any directory: ${name}${ext}`);
}

export function hashString(data) {
  const hash = crypto.createHash("sha256");
  hash.update(data);
  return hash.digest("hex");
}

export async function downloadImage(
  imageUrl,
  {
    isCover = false, // Cover image for posts or projects
    isProject = false, // Whether this is a project image
  },
) {
  const response = await fetch(imageUrl);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const { ext, mime } = await imageType(buffer);

  const fileHash = hashString(imageUrl);
  // Determine the appropriate image path
  const imagePath = IMAGE_PATHS[isProject ? 'projects' : 'posts'] || DEFAULT_IMAGE_PATH;
  const fileName = `${process.cwd()}/${imagePath}/${fileHash}${isCover ? "-cover" : ""}.${ext}`;
  console.info("Hashed Filename:", fileName);

  fs.writeFileSync(fileName, buffer);
  console.info(`Image downloaded to ${fileName}`, mime);

  return fileName;
}
