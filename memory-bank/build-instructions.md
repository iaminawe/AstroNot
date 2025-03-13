# Build Instructions for Static Site Deployment

## Pre-Build Checklist

1. **Social Links Component**
   - Ensure only supported icons from flowbite-svelte-icons v2.0.3 are used
   - Currently supported social icons: GitHub, Twitter/X, LinkedIn
   - Remove any unsupported icons (e.g., TikTok, Medium) to prevent build failures

2. **Notion Integration**
   - Run `npm run sync:all` before building to ensure all Notion content is up-to-date
   - This syncs:
     - Published posts
     - Projects
     - Testimonials
     - Hero content
     - Services
     - Social links
     - Work experience
     - Author data
     - About page content
     - Images

3. **Image Processing**
   - Images from Notion are automatically downloaded and processed during build
   - Check for any 403 Forbidden errors in image downloads
   - Images are optimized and converted to WebP format
   - Multiple sizes are generated for responsive images

## Build Process

1. **Run the build command**:
   ```bash
   pnpm build
   ```

2. **Build Steps**:
   - Syncs all Notion content
   - Compiles TypeScript files
   - Bundles JavaScript with Vite
   - Generates static HTML pages
   - Optimizes images
   - Creates the `dist` directory with the final build

3. **Common Build Issues**:
   - Missing or unsupported social media icons
   - Failed Notion image downloads (403 errors)
   - Dynamic image import errors in MDX files
   - Deprecated Astro.glob usage warnings (should be updated to import.meta.glob)

## Post-Build Verification

1. Check for any build errors in the console output
2. Verify all pages were generated successfully
3. Ensure all images were processed and optimized
4. Test all social media links and icons
5. Review any deprecation warnings for future updates

## Important Notes

- The build process includes both content synchronization and static site generation
- All Notion content is fetched and processed during build time
- Images are optimized and converted to WebP format automatically
- Social media icons must be available in flowbite-svelte-icons v2.0.3
- Consider updating Astro.glob usage to import.meta.glob in future updates

## Deployment with Nixpacks

AstroNot includes a `nixpacks.toml` configuration file for deployment on platforms that support Nixpacks (like Railway).

### Configuration Details

```toml
[phases.setup]
nixPkgs = ["nodejs", "pnpm"]

[phases.install]
cmds = ["pnpm install"]

[phases.build]
cmds = [
  "pnpm run generate"
]

[start]
cmd = "npx serve dist"
```

### What This Does

1. **Setup Phase**: Installs Node.js and pnpm in the build environment
2. **Install Phase**: Installs project dependencies using pnpm
3. **Build Phase**: Runs the generate command which:
   - Syncs Notion content
   - Processes images
   - Builds the static site
4. **Start Phase**: Serves the static files from the dist folder

### Deployment Steps

1. Ensure environment variables are set on your hosting platform:
   - NOTION_KEY
   - DATABASE_ID

2. Push your code to trigger the deployment:
   - Nixpacks will automatically handle the build process
   - The site will be served from the dist folder
   - Static files are served efficiently

### Common Issues

- Missing environment variables will cause build failures
- Large Notion databases may require increased build timeout settings
- Image processing may require additional memory allocation
