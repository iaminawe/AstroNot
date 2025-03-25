import path from "path";
import imageType from "image-type";
import crypto from "crypto";
import fs from "fs";

const IMAGE_PATHS = {
  posts: 'src/images/posts',
  projects: 'src/images/projects'
};

const DEFAULT_IMAGE_PATH = IMAGE_PATHS.posts;

// IMPORTANT: This bit is required to allow dynamic importing of images via Astro & Vite
// postImageImport allows dynamically import images from local filesystem via Vite with variable names
export async function postImageImport(imageFileName) {
  if (!imageFileName) {
    console.warn("No image filename provided");
    return null;
  }

  // Check if the image is an S3 URL
  if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
    // Check if it's an S3 URL and ensure it has the correct prefix
    if (imageFileName.includes('.s3.') || imageFileName.includes('s3.amazonaws.com')) {
      // Determine if this is likely a project or post image based on filename or URL
      const isProjectImage = imageFileName.includes('/project-') || imageFileName.includes('/projects/');
      const isPostImage = imageFileName.includes('-cover') || imageFileName.includes('/posts/');
      
      // Add the correct prefix if missing
      if (isProjectImage && !imageFileName.includes('/projects/')) {
        const urlParts = imageFileName.split('/');
        const filename = urlParts[urlParts.length - 1];
        const bucketName = process.env.S3_BUCKET_NAME || 'greggcoppen';
        const region = process.env.S3_REGION || 'ca-central-1';
        imageFileName = `https://${bucketName}.s3.${region}.amazonaws.com/projects/${filename}`;
        console.log(`Added projects prefix to S3 URL: ${imageFileName}`);
      } else if (isPostImage && !imageFileName.includes('/posts/')) {
        const urlParts = imageFileName.split('/');
        const filename = urlParts[urlParts.length - 1];
        const bucketName = process.env.S3_BUCKET_NAME || 'greggcoppen';
        const region = process.env.S3_REGION || 'ca-central-1';
        imageFileName = `https://${bucketName}.s3.${region}.amazonaws.com/posts/${filename}`;
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

    return {
      default: {
        src: imageFileName,
        width,
        height,
        format,
        isS3: true
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
  const postPath = `../images/posts/${name}${ext}`;
  if (postImages[postPath]) {
    return normalizeLocalImage(postImages[postPath]);
  }

  // Try projects directory
  const projectPath = `../images/projects/${name}${ext}`;
  if (projectImages[projectPath]) {
    return normalizeLocalImage(projectImages[projectPath]);
  }

  // Try to find the image in any directory
  const allImages = { ...postImages, ...projectImages };
  const imagePath = `../images/${name}${ext}`;
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
    
    return {
      default: {
        src: s3Url,
        width: 1920,
        height: 1080,
        format: ext.slice(1) || 'jpg',
        isS3: true
      }
    };
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
