import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// IMPORTANT: This bit is required to allow dynamic importing of images via Astro & Vite
// postImageImport allows dynamically import images from local filesystem via Vite with variable names
export async function postImageImport(imageFileName, imageType = 'posts') {
  console.log(`postImageImport called for: ${imageFileName} (type: ${imageType})`);
  if (!imageFileName) {
    console.warn("No image filename provided");
    return null;
  }

  console.log('Starting postImageImport process');

  // Helper function to check if URL is an S3 URL
  function isS3Url(url) {
    return typeof url === 'string' && (url.includes('.s3.') || url.includes('s3.amazonaws.com'));
  }

  // Helper function to get path for an image
  function getImagePath(filename, type = 'posts') {
    const prefix = type === 'projects' ? 'projects' : 'posts';
    return `/${prefix}/${filename}`;
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


  if (imageFileName.startsWith('http://') || imageFileName.startsWith('https://')) {
    // Extract format and dimensions
    const format = path.extname(imageFileName).slice(1) || 'jpg';
    const sizeMatch = imageFileName.match(/-(\d+)x(\d+)\.[^.]+$/);
    let width = 1920;
    let height = 1080;

    if (sizeMatch) {
      width = parseInt(sizeMatch[1], 10);
      height = parseInt(sizeMatch[2], 10);
    }

    // For external URLs (like giphy), return as-is
    if (imageFileName.includes('giphy.com')) {
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

    // For S3 URLs, ensure we have the file locally for optimization
    if (isS3Url(imageFileName)) {
      try {
        const response = await fetch(imageFileName);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);
        
        const buffer = await response.arrayBuffer();
        const filename = path.basename(imageFileName);
        const type = filename.startsWith('project-') ? 'projects' : 'posts';
        
        // Ensure dist/type directory exists
        const outputDir = path.join(process.cwd(), 'dist', type);
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Save file locally for Astro's image optimization
        const localPath = path.join(outputDir, filename);
        fs.writeFileSync(localPath, Buffer.from(buffer));
        
        return {
          default: {
            src: `/${type}/${filename}`,
            width,
            height,
            format: format.toLowerCase(),
            isLocal: true
          }
        };
      } catch (error) {
        console.error('Error downloading image:', error);
        return null;
      }
    }
  }

  // For local images
  const filename = path.parse(imageFileName);
  const name = filename.name;
  const ext = filename.ext;

  if (!name) {
    console.warn("No image name found in", imageFileName);
    return null;
  }


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

  throw new Error(`Image not found in any directory: ${name}${ext}`);
}
