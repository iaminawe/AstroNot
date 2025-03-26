/**
 * Converts a full S3 URL to a path-based format for local references
 * @param url The full S3 URL to convert
 * @returns A path-based URL without protocol/domain
 */
export const convertS3UrlToPath = (url: string): string => {
  if (!url) return '';
  
  try {
    // Handle S3 URLs
    if (url.includes('s3.') && url.includes('amazonaws.com')) {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // Remove empty parts and bucket name from path
      const filteredParts = pathParts.filter(part => part && !part.includes('greggcoppen'));
      return '/' + filteredParts.join('/');
    }
    
    // Handle external URLs (like Giphy)
    if (url.startsWith('http')) {
      // Store external URLs with a special prefix to handle differently during build
      return `/external/${Buffer.from(url).toString('base64')}`;
    }
    
    // Return as-is if it's already a path
    return url.startsWith('/') ? url : `/${url}`;
  } catch (e) {
    console.error('Error converting URL:', e);
    return url;
  }
};

/**
 * Ensures a URL has the correct base path prefix
 * @param path The path to prefix
 * @returns Path with base URL prefix
 */
export const getBaseUrl = (path: string): string => {
  const baseUrl = import.meta.env.BASE_URL || '/';
  return `${baseUrl}${path}`.replace(/\/+/g, '/');
};
