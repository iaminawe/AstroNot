#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the data directory
const DATA_DIR = path.join(__dirname, '..', 'data');

console.log('Testing imports from data directory...');

// Test if the data directory exists
if (!fs.existsSync(DATA_DIR)) {
  console.error(`Data directory does not exist: ${DATA_DIR}`);
  process.exit(1);
}

// List all files in the data directory
const files = fs.readdirSync(DATA_DIR);
console.log(`Files in data directory: ${files.join(', ')}`);

// Test importing each JSON file
for (const file of files) {
  if (file.endsWith('.json')) {
    try {
      const filePath = path.join(DATA_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      console.log(`Successfully read ${file}`);
      
      try {
        const jsonData = JSON.parse(fileContent);
        console.log(`Successfully parsed ${file} as JSON`);
        console.log(`${file} content:`, jsonData);
      } catch (parseError) {
        console.error(`Error parsing ${file} as JSON:`, parseError.message);
      }
    } catch (readError) {
      console.error(`Error reading ${file}:`, readError.message);
    }
  }
}

console.log('Import test completed.');
