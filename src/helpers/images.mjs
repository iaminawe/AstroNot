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
  
  // Try posts directory first
  const postPath = `../images/posts/${name}${ext}`;
  if (postImages[postPath]) {
    return postImages[postPath];
  }

  // Try projects directory
  const projectPath = `../images/projects/${name}${ext}`;
  if (projectImages[projectPath]) {
    return projectImages[projectPath];
  }

  // Try to find the image in any directory
  const allImages = { ...postImages, ...projectImages };
  const imagePath = `../images/${name}${ext}`;
  if (allImages[imagePath]) {
    return allImages[imagePath];
  }

  // Try with .jpg extension as fallback in both directories
  const postJpgPath = `../images/posts/${name}.jpg`;
  if (postImages[postJpgPath]) {
    return postImages[postJpgPath];
  }

  const projectJpgPath = `../images/projects/${name}.jpg`;
  if (projectImages[projectJpgPath]) {
    return projectImages[projectJpgPath];
  }

  console.warn(`Image not found in any directory: ${name}${ext}`);
  return null;

  /*
  The returned imported image results are in this format:

  {
    default: {
      src: '/@fs/Users/json/Projects/astronot/src/images/posts/4f9edb242363447c8ed31c88e86fcb1766a93d2b938bf25c2528d52da4dc478b-cover.jpg?origWidth=1500&origHeight=1397&origFormat=jpg',
      width: 1500,
      height: 1397,
      format: 'jpg',
      orientation: 1
    },
    [Symbol(Symbol.toStringTag)]: 'Module'
  }
  */
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
