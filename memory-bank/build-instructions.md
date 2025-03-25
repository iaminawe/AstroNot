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

3. **Image Storage and Processing**
   - Images can be stored in S3 (recommended) or locally
   - S3 Configuration:
     - Set up an S3 bucket and IAM user
     - Configure bucket permissions (public or private)
     - Set required environment variables
   - Image Processing:
     - Automatic optimization using Sharp
     - WebP conversion for modern browsers
     - Multiple responsive sizes
     - Efficient caching with configurable headers
     - Automatic retry for failed uploads
   - Local Cleanup:
     - Images are removed after successful S3 upload
     - Reduces Git repository size

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

- The build process includes content synchronization, image processing, and static site generation
- Notion content is fetched using an efficient timestamp tracking system that only syncs updated content
- The timestamp tracking system maintains timestamps for:
  - Collections (services, testimonials, etc.)
  - Individual items (posts, projects, etc.)
  - Images (sync time, S3 status, optimization status)
- Image processing includes:
  - Automatic S3 upload with configurable settings
  - WebP conversion and optimization
  - Multiple responsive sizes
  - Local cleanup after S3 upload
- Social media icons must be available in flowbite-svelte-icons v2.0.3
- Consider updating Astro.glob usage to import.meta.glob in future updates

## Deployment

AstroNot is designed to be deployed as a static site. The recommended deployment workflow uses GitHub Actions:

### GitHub Actions Automated Deployment

1. **Environment Setup**:
   Go to your GitHub repository settings and configure:

   a. Under "Settings > Environments":
      - Create a new environment named "production"

   b. Under "Settings > Secrets and variables > Actions", add:

      **Notion Configuration:**
      - `NOTION_KEY`: Your Notion API key
      - `DATABASE_ID`: Main database ID
      - `AUTHOR_DB_ID`: Author database ID
      - `VITE_PROJECTS_DB_ID`: Projects database ID
      - `VITE_SERVICES_DB_ID`: Services database ID
      - `VITE_TESTIMONIALS_DB_ID`: Testimonials database ID
      - `VITE_WORK_EXPERIENCE_DB_ID`: Work experience database ID
      - `VITE_ABOUT_DB_ID`: About database ID
      - `VITE_SOCIAL_LINKS_DB_ID`: Social links database ID
      - `VITE_HOME_HERO_DB_ID`: Home hero database ID
      - `VITE_SITE_SETTINGS_DB_ID`: Site settings database ID
      - `VITE_CATEGORIES_DB_ID`: Categories database ID

      **AWS S3 Configuration:**
      - `AWS_ACCESS_KEY_ID`: AWS access key
      - `AWS_SECRET_ACCESS_KEY`: AWS secret key
      - `S3_BUCKET_NAME`: S3 bucket name
      - `S3_REGION`: S3 region
      - `S3_IMAGE_PREFIX`: S3 image prefix (optional)

2. **Automatic Deployment**:
   The workflow in `.github/workflows/deploy.yml` will:
   - Trigger on push to main branch
   - Set up Node.js environment
   - Install dependencies
   - Configure environment variables
   - Sync Notion content
   - Build the site
   - Deploy to a deployment branch

3. **Manual Deployment**:
   To trigger deployment manually:
   - Go to your repository's Actions tab
   - Select the "Deploy to Production" workflow
   - Click "Run workflow"

4. **Alternative Local Build Process**:
   If needed, you can still build locally:
   ```bash
   # Ensure all environment variables are set in .env
   npm run sync:all    # Sync all content from Notion
   npm run build       # Build the static site
   ```

### Coolify Webhook Deployment

1. **Configure Coolify**:
   - Log into your Coolify dashboard
   - Navigate to your project settings
   - Under "Webhooks", click "Add Webhook"
   - Copy the generated webhook URL

2. **Add Webhook to GitHub**:
   a. Go to your GitHub repository settings
   b. Navigate to "Settings > Webhooks"
   c. Click "Add webhook"
   d. Configure the webhook:
      - Payload URL: Your Coolify webhook URL
      - Content type: `application/json`
      - Secret: Leave empty (Coolify handles authentication)
      - Events: Select "Just the push event"
      - Active: Check this box

3. **Configure Coolify Environment**:
   Add the same environment variables as GitHub Actions:

   **Notion Configuration:**
   ```env
   NOTION_KEY=your_notion_api_key
   DATABASE_ID=your_database_id
   AUTHOR_DB_ID=your_author_db_id
   VITE_PROJECTS_DB_ID=your_projects_db_id
   VITE_SERVICES_DB_ID=your_services_db_id
   VITE_TESTIMONIALS_DB_ID=your_testimonials_db_id
   VITE_WORK_EXPERIENCE_DB_ID=your_work_experience_db_id
   VITE_ABOUT_DB_ID=your_about_db_id
   VITE_SOCIAL_LINKS_DB_ID=your_social_links_db_id
   VITE_HOME_HERO_DB_ID=your_home_hero_db_id
   VITE_SITE_SETTINGS_DB_ID=your_site_settings_db_id
   VITE_CATEGORIES_DB_ID=your_categories_db_id
   ```

   **AWS S3 Configuration:**
   ```env
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   S3_BUCKET_NAME=your_bucket_name
   S3_REGION=your_bucket_region
   S3_IMAGE_PREFIX=your_image_prefix
   ```

4. **Deployment Process**:
   - Push to your main branch will trigger the webhook
   - Coolify will:
     1. Pull the latest code
     2. Install dependencies
     3. Run the build command
     4. Deploy the static files

5. **Monitoring Deployments**:
   - View deployment status in Coolify dashboard
   - Check deployment logs for any issues
   - Monitor build time and performance
   ```bash
   git checkout -b deployment
   git add dist/
   git commit -m "Update static build"
   git push origin deployment
   ```

### Coolify Deployment

1. **Configure Coolify**:
   - Create a new Static Site service
   - Point to the `deployment` branch
   - Set the publish directory to `dist`
   - No build command needed (files are pre-built)

2. **Nixpacks Configuration**:
   ```toml
   [phases.setup]
   nixPkgs = ["nodejs"]

   [start]
   cmd = "npx serve dist"

   [variables]
   NIXPACKS_METADATA = "node"
   NIXPACKS_SPA_OUTPUT_DIR = "dist"
   NODE_ENV = "production"
   ```

### Automated Deployment with GitHub Actions

The repository includes a GitHub Actions workflow that automates the deployment process:

1. **Workflow Trigger**:
   - Automatically runs on push to main branch
   - Can be manually triggered from GitHub Actions tab

2. **Workflow Steps**:
   ```yaml
   - Checkout repository
   - Setup Node.js environment
   - Install dependencies
   - Configure environment variables from GitHub Secrets
   - Sync Notion content
   - Build static site
   - Deploy to deployment branch
   ```

3. **Required GitHub Secrets**:
   - `NOTION_KEY`: Your Notion API key
   - `DATABASE_ID`: Main database ID
   - `AUTHOR_DB_ID`: Author database ID
   - `VITE_*_DB_ID`: Various Notion database IDs
   - `AWS_ACCESS_KEY_ID`: AWS access key
   - `AWS_SECRET_ACCESS_KEY`: AWS secret key
   - `S3_*`: S3 configuration variables

4. **Manual Deployment**:
   If needed, you can still deploy manually using:
   ```bash
   npm run sync:all
   npm run build
   git checkout -b deployment
   git add dist/ -f
   git commit -m "Manual deployment"
   git push origin deployment --force
   ```

### Benefits of This Approach

1. **Automated Workflow**:
   - Consistent build process
   - No manual intervention needed
   - Automated error detection
   - Build logs in GitHub Actions

2. **Better Security**:
   - Secrets managed by GitHub
   - No sensitive data in repository
   - No credentials on production server
   - Reduced attack surface

3. **Reliable Deployments**:
   - Consistent environment
   - Pre-verified static content
   - No runtime dependencies
   - Easy rollback capability

4. **Cost Effective**:
   - Minimal server resources
   - GitHub Actions free tier
   - Static hosting efficiency
   - CDN-ready deployment

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

#### Required Environment Variables

```bash
# Notion Configuration
VITE_NOTION_KEY=xxx          # Notion API key
VITE_DATABASE_ID=xxx         # Main database ID

# AWS S3 Configuration (Required for S3 image storage)
AWS_ACCESS_KEY_ID=xxx        # AWS access key ID
AWS_SECRET_ACCESS_KEY=xxx    # AWS secret access key
S3_BUCKET_NAME=xxx           # S3 bucket name
S3_REGION=xxx                # S3 bucket region
S3_IMAGE_PREFIX=xxx          # Optional: prefix for image keys

# Optional Notion Integration
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
