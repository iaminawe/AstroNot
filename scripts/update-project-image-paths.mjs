#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const projectsDir = path.join(process.cwd(), 'src/pages/projects');

// Get all MDX files in the projects directory
const projectFiles = fs.readdirSync(projectsDir).filter(f => f.endsWith('.mdx'));

console.log(`Found ${projectFiles.length} project files to process`);

for (const file of projectFiles) {
  const filePath = path.join(projectsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find all S3 image URLs
  const regex = /(https:\/\/greggcoppen\.s3\.ca-central-1\.amazonaws\.com\/)(posts\/[^"\s]+)/g;
  const matches = content.matchAll(regex);
  let modified = false;
  
  for (const match of matches) {
    const [fullUrl, baseUrl, imagePath] = match;
    const newPath = imagePath.replace('posts/', 'projects/');
    const newUrl = baseUrl + newPath;
    
    if (fullUrl !== newUrl) {
      content = content.replace(fullUrl, newUrl);
      modified = true;
      console.log(`✅ Updated in ${file}:`);
      console.log(`   ${imagePath} -> ${newPath}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
  }
}

console.log('\nFinished updating project image paths');
