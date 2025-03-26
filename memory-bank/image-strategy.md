# Image Management Strategy

## Storage Configuration

- AWS S3 bucket 'greggcoppen' in ca-central-1 region
- Images organized in prefixes:
  - posts/ - For blog post images
  - projects/ - For project-related images
- Public access configured via bucket policy (ACLs disabled)
- Images cached for 1 year (max-age=31536000)

## Image Processing

### Download
- Handles Notion's temporary S3 URLs
- Downloads images to process locally
- Validates successful downloads

### Optimization (using Sharp)
- JPEG/PNG: 
  - Quality: 80%
  - Progressive enabled
  - Metadata preserved
- WebP:
  - Quality: 80%
  - Metadata preserved
- GIFs: No optimization (preserved as-is)
- Size limits:
  - Max dimensions: 2000x2000
  - Maintains aspect ratio
  - No upscaling

### File Naming
- Content-based hash using SHA-256
- Prefix based on type (notion- or project-)
- Optional -cover suffix for cover images
- Extension preserved from source

## Synchronization Process

### File Scanning
- Processes JSON files in data directory
- Processes MDX files in projects directory
- Detects:
  - Notion S3 URLs
  - Local image paths

### Image Handling
- Checks for existing images in S3
- Downloads and processes new images
- Updates file content with new S3 URLs
- Maintains manifest of image usage

### Manifest Tracking
- Maps original URLs to processed files
- Tracks:
  - Filename
  - Content type
  - Last used timestamp
  - Public path

## Migration Support

### Local to S3
- Detects local image references
- Migrates to S3 if not present
- Updates content with new S3 URLs
- Removes local files after successful migration

### Cleanup
- 7-day retention for unused images
- Removes from manifest if unused
- Cleans up local files in S3 mode

## Error Handling

### Robust Recovery
- Graceful handling of download failures
- Skips existing images
- Continues processing on errors
- Detailed error logging

### Validation
- Checks S3 configuration
- Validates image downloads
- Verifies successful uploads
- Confirms file existence

## Environment Configuration

### Required Variables
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- S3_BUCKET_NAME
- S3_REGION (defaults to us-west-2)

### Optional Variables
- S3_POSTS_PREFIX (defaults to 'posts')
- S3_PROJECTS_PREFIX (defaults to 'projects')
- S3_IMAGE_PREFIX (for backward compatibility)

## Usage

### Standard Sync
```bash
npm run sync:images:s3
```

### Force Local Mode
```bash
npm run sync:images:local
```

### Force S3 Mode
```bash
npm run sync:images:s3 --s3
```
