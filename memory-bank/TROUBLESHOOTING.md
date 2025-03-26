# Troubleshooting Guide

## Navigation Issues

### Port 3000 in URLs
If you notice port 3000 appearing in URLs when navigating between pages:

1. **Browser Caching**
   - This is often due to browser caching
   - Try viewing in a private/incognito window
   - Clear browser cache if issue persists

2. **URL Handling**
   - The Navbar and Footer components have been updated to handle URLs consistently
   - URLs are now formatted with a single leading slash
   - BASE_URL dependency has been removed to prevent conflicts

### Navigation Not Working
If navigation between pages is not working:

1. **Check Browser Console**
   - Look for any JavaScript errors
   - Verify all required scripts are loading

2. **Client-Side Routing**
   - Ensure Astro's client-side routing is properly configured
   - Check for any conflicting route definitions

3. **Component Links**
   - Verify all links use the correct format: `href="/path"`
   - Avoid using relative paths without leading slashes

## Image Loading

### S3 Images Not Loading
If images from S3 are not displaying:

1. **Check S3 Configuration**
   - Verify AWS credentials are correct
   - Ensure bucket permissions allow public access
   - Check S3 region configuration

2. **Image Component**
   - The Image component now properly handles S3 URLs
   - S3 URLs are passed through directly without processing
   - Local images still use Astro's image optimization

### Image Optimization Issues
If images are not being optimized correctly:

1. **Build Process**
   - Run `npm run sync:images` to force image sync
   - Check build logs for any optimization errors

2. **Cache Issues**
   - Clear the `.astro` cache directory
   - Rebuild with `npm run build`

## Development Tips

1. **Local Development**
   - Use `npm run dev` for local development
   - Changes to navigation components require a restart

2. **Production Testing**
   - Build with `npm run build`
   - Test with `npm run preview`
   - Use private browsing for cache-free testing

3. **Deployment**
   - Always test in a production environment
   - Verify all environment variables are set
   - Check S3 configuration in production
