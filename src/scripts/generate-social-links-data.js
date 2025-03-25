#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { Client } from "@notionhq/client";
import { needsSync, updateTimestamp, getCollectionLastSync, updateCollectionTimestamp } from './notion-timestamp-tracker.js';

// Load environment variables from .env file
config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the output directory and file for social links data
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'social-links.json');

// Initialize Notion client
const NOTION_KEY = process.env.VITE_NOTION_KEY;
console.log("VITE_NOTION_KEY:", NOTION_KEY ? "Present (length: " + NOTION_KEY.length + ")" : "Missing");

let notion = null;
try {
  if (NOTION_KEY) {
    console.log("Initializing Notion client...");
    notion = new Client({
      auth: NOTION_KEY
    });
    console.log("Notion client initialized successfully");
  } else {
    console.error("Cannot initialize Notion client: Missing API key");
  }
} catch (error) {
  console.error("Error initializing Notion client:", error);
  notion = null;
}

/**
 * Fetch social links from Notion database
 * @returns {Promise<Array>} Array of social link objects
 */
async function fetchSocialLinksFromNotion() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch social links.");
    return [];
  }
  
  const socialLinksDbId = process.env.VITE_SOCIAL_LINKS_DB_ID;
  if (!socialLinksDbId) {
    console.warn("VITE_SOCIAL_LINKS_DB_ID not found in .env file");
    return [];
  }

  try {
    // Get the last sync time for social links
    const lastSyncTime = getCollectionLastSync('social-links');
    console.log("Last social links sync time:", lastSyncTime || "Never synced");
    
    console.log("Querying social links database:", socialLinksDbId);
    
    // Check if we have any existing social links
    const forceSync = !fs.existsSync(OUTPUT_FILE);
    
    let queryFilter = {};
    
    // If we have a last sync time and we're not forcing sync, add a filter for last_edited_time
    if (lastSyncTime && !forceSync) {
      queryFilter = {
        timestamp: "last_edited_time",
        last_edited_time: {
          on_or_after: lastSyncTime
        }
      };
      console.log("Filtering for social links updated since:", lastSyncTime);
    } else {
      console.log("Fetching all social links (force sync)");
    }
    
    const { results } = await notion.databases.query({
      database_id: socialLinksDbId,
      filter: Object.keys(queryFilter).length > 0 ? queryFilter : undefined,
      sorts: [
        {
          property: "order",
          direction: "ascending"
        }
      ]
    });

    console.log("Social links query results count:", results.length);

    if (results.length === 0) {
      console.warn("No social links found in Notion database");
      return [];
    }

    const socialLinks = results.map(link => {
      // Update the timestamp for this social link
      updateTimestamp('social-link', link.id, link.last_edited_time);
      
      return {
        id: link.id,
        name: link.properties.name?.title[0]?.plain_text || "Untitled Link",
        url: link.properties.url?.url || "#",
        icon: link.properties.icon?.rich_text[0]?.plain_text || "",
        iconType: link.properties.iconType?.select?.name || "custom", // 'custom' or 'component'
        order: link.properties.order?.number || 0,
        active: link.properties.active?.checkbox || true
      };
    });

    console.log("Social links processed:", socialLinks.length);
    
    // Update the collection timestamp after processing all social links
    updateCollectionTimestamp('social-links');

    return socialLinks.filter(link => link.active).sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching social links from Notion:", error);
    return [];
  }
}

/**
 * Generate static JSON file for social links
 */
async function generateSocialLinksData() {
  console.log('Generating social links data file...');
  
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Fetch social links from Notion
    const socialLinks = await fetchSocialLinksFromNotion();
    
    if (!socialLinks || socialLinks.length === 0) {
      console.warn('No social links found in Notion database');
      return;
    }
    
    console.log(`Found ${socialLinks.length} social links in Notion database`);
    
    // Write the social links data to a JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(socialLinks, null, 2));
    
    console.log(`Social links data file generated successfully at ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating social links data file:', error);
  }
}

// Execute the function
generateSocialLinksData().catch(console.error);
