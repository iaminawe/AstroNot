import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
config();

// S3 configuration
const s3Config = {
  region: process.env.S3_REGION || 'us-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

const bucketName = process.env.S3_BUCKET_NAME;
const oldPrefix = process.env.S3_IMAGE_PREFIX || '';
const postsPrefix = process.env.S3_POSTS_PREFIX || 'posts';
const projectsPrefix = process.env.S3_PROJECTS_PREFIX || 'projects';

// Initialize S3 client
const s3Client = new S3Client(s3Config);

// Migration log
const migrationLog = {
  moved: [],
  errors: [],
  skipped: []
};

async function listAllObjects(prefix = '') {
  const objects = [];
  let continuationToken;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
      ContinuationToken: continuationToken
    });

    const response = await s3Client.send(command);
    if (response.Contents) {
      objects.push(...response.Contents);
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return objects;
}

async function moveObject(sourceKey, destKey) {
  try {
    // Copy to new location
    await s3Client.send(new CopyObjectCommand({
      Bucket: bucketName,
      CopySource: `${bucketName}/${sourceKey}`,
      Key: destKey
    }));

    // Delete from old location
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: sourceKey
    }));

    migrationLog.moved.push({ from: sourceKey, to: destKey });
    console.log(`✅ Moved: ${sourceKey} -> ${destKey}`);
  } catch (error) {
    migrationLog.errors.push({ key: sourceKey, error: error.message });
    console.error(`❌ Error moving ${sourceKey}:`, error.message);
  }
}

async function migrateImages() {
  console.log('Starting S3 image migration...');
  const startTime = Date.now();

  try {
    // Get list of project files
    const projectsDir = path.join(process.cwd(), 'src/pages/projects');
    const projectFiles = fs.readdirSync(projectsDir).filter(f => f.endsWith('.mdx'));
    
    // Cache of image references in project files
    const projectImageRefs = new Set();
    
    // Find all image references in project files
    for (const file of projectFiles) {
      const content = fs.readFileSync(path.join(projectsDir, file), 'utf8');
      const matches = content.match(/https:\/\/[^"\s]+\.(?:jpg|jpeg|png|webp|gif)/g) || [];
      matches.forEach(url => {
        const filename = path.basename(url);
        projectImageRefs.add(filename);
      });
    }

    // List all objects in the posts directory
    const objects = await listAllObjects(postsPrefix);
    console.log(`Found ${objects.length} objects to process`);

    for (const object of objects) {
      const key = object.Key;
      const filename = path.basename(key);

      // Check if this is a project image that needs to be moved
      const isProjectImage = projectImageRefs.has(filename);
      
      if (isProjectImage) {
        // Move from posts/ to projects/
        const newKey = `${projectsPrefix}/${filename}`;
        
        if (key !== newKey) {
          await moveObject(key, newKey);
          migrationLog.moved.push({
            from: key,
            to: newKey,
            type: 'project'
          });
        } else {
          migrationLog.skipped.push({
            key,
            reason: 'Already in correct location'
          });
        }
      } else {
        migrationLog.skipped.push({
          key,
          reason: 'Not a project image'
        });
      }
    }

    // Write migration log
    const logPath = './migration-log.json';
    fs.writeFileSync(logPath, JSON.stringify(migrationLog, null, 2));

    const duration = (Date.now() - startTime) / 1000;
    console.log('\nMigration completed!');
    console.log(`Duration: ${duration.toFixed(2)} seconds`);
    console.log(`Moved: ${migrationLog.moved.length}`);
    console.log(`Skipped: ${migrationLog.skipped.length}`);
    console.log(`Errors: ${migrationLog.errors.length}`);
    console.log(`\nMigration log written to: ${logPath}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateImages().catch(console.error);
