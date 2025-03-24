# Build Instructions for Static Site Deployment

## Pre-Build Checklist

1. **Social Links Component**
   - Ensure only supported icons from flowbite-svelte-icons v2.0.3 are used
   - Currently supported social icons: GitHub, Twitter/X, LinkedIn
   - Remove any unsupported icons (e.g., TikTok, Medium) to prevent build failures

2. **Notion Integration**
   - Run `npm run sync:notion` or `npm run sync:all` before building to ensure all Notion content is up-to-date
   - The system uses timestamp tracking to only sync content that has been updated since the last sync
   - This syncs:
     - Published posts
     - Projects
     - Testimonials
     - Hero content
     - Services
     - Categories
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
- Notion content is fetched using an efficient timestamp tracking system that only syncs updated content
- The timestamp tracking system maintains timestamps for both collections and individual items
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

1. Ensure build-time environment variables are set on your hosting platform:
   - Required Notion API variables:
     - NOTION_KEY and VITE_NOTION_KEY: Your Notion API key (same value for both)
     - DATABASE_ID: Main posts database ID
   - Optional enhanced integration variables:
     - AUTHOR_DB_ID and VITE_AUTHOR_DB_ID: Author database ID
     - VITE_PROJECTS_DB_ID: Projects database ID
     - VITE_SERVICES_DB_ID: Services database ID
     - VITE_TESTIMONIALS_DB_ID: Testimonials database ID
     - VITE_WORK_EXPERIENCE_DB_ID: Work experience database ID
     - VITE_ABOUT_DB_ID: About page content database ID
     - VITE_SOCIAL_LINKS_DB_ID: Social links database ID
     - VITE_HOME_HERO_DB_ID: Home hero content database ID
     - VITE_SITE_SETTINGS_DB_ID: Site settings database ID

   All these variables are marked as BUILD_TIME in nixpacks.toml, meaning they are only needed during the build phase and not during runtime.

2. Push your code to trigger the deployment:
   - Nixpacks will automatically handle the build process using the build-time variables
   - The site will be served from the dist folder as a static site
   - No environment variables are needed at runtime since all content is pre-rendered

### Common Issues

- Missing environment variables will cause build failures
- Large Notion databases may require increased build timeout settings
- Image processing may require additional memory allocation

### Environment Variables Reference

#### Required Build-Time Variables
These variables are essential for the basic functionality of AstroNot:
```
NOTION_KEY=secret_xxx         # Notion API key
VITE_NOTION_KEY=secret_xxx   # Same as NOTION_KEY, needed for client components
DATABASE_ID=xxx              # Main posts database ID
```

#### Optional Build-Time Variables
These variables enable enhanced Notion integration features:
```
# Author Information
AUTHOR_DB_ID=xxx            # Author database ID
VITE_AUTHOR_DB_ID=xxx      # Same as AUTHOR_DB_ID, for client components

# Content Databases
VITE_PROJECTS_DB_ID=xxx    # Projects showcase
VITE_SERVICES_DB_ID=xxx    # Services offered
VITE_TESTIMONIALS_DB_ID=xxx # Client testimonials
VITE_WORK_EXPERIENCE_DB_ID=xxx # Work history
VITE_ABOUT_DB_ID=xxx       # About page content
VITE_SOCIAL_LINKS_DB_ID=xxx # Social media links
VITE_HOME_HERO_DB_ID=xxx   # Homepage hero section
VITE_SITE_SETTINGS_DB_ID=xxx # Global site settings
```

All these variables are marked as BUILD_TIME in nixpacks.toml because:
1. They are only needed during the build process to fetch content
2. The resulting build is completely static
3. No Notion API calls are made during runtime
4. The site can be served without any environment variables

If any optional variables are missing, the system will fall back to using the corresponding static configuration files in src/config/.
