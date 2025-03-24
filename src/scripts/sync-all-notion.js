#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log("Starting full Notion sync...");

// Define the sync commands
const syncCommands = [
  "npm run sync:services",
  "npm run sync:testimonials",
  "npm run sync:hero",
  "npm run sync:categories",
  "npm run sync:social-links",
  "npm run sync:projects",
  "npm run sync:published",
  "npm run sync:author",
  "npm run sync:about",
  "npm run sync:work-experience",
  "npm run sync:images"
];

// Track timing and results
const results = {
  startTime: new Date(),
  endTime: null,
  syncResults: []
};

// Run each sync command
for (const command of syncCommands) {
  console.log(`\n\n=== Running: ${command} ===\n`);
  
  try {
    const startTime = new Date();
    const output = execSync(command, { encoding: 'utf8' });
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    console.log(output);
    
    results.syncResults.push({
      command,
      success: true,
      duration,
      timestamp: new Date().toISOString()
    });
    
    console.log(`\n=== Completed: ${command} (${duration.toFixed(2)}s) ===\n`);
  } catch (error) {
    console.error(`Error running ${command}:`, error.message);
    
    results.syncResults.push({
      command,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Record end time
results.endTime = new Date();
results.totalDuration = (results.endTime - results.startTime) / 1000;

// Log summary
console.log("\n\n=== Sync Summary ===");
console.log(`Total duration: ${results.totalDuration.toFixed(2)} seconds`);
console.log("Results:");
results.syncResults.forEach(result => {
  const status = result.success ? "✅ Success" : "❌ Failed";
  console.log(`- ${result.command}: ${status} (${result.duration ? result.duration.toFixed(2) + 's' : 'N/A'})`);
});

console.log("\nFull Notion sync completed!");
