#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { Client } from "@notionhq/client";

// Load environment variables from .env file
config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the output directory and file for author data
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'author.json');

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
 * Fetch author data from Notion database
 * @returns {Promise<Object|null>} Author data object or null if not available
 */
async function fetchAuthorFromNotion() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch author data.");
    return null;
  }
  
  const authorDbId = process.env.VITE_AUTHOR_DB_ID;
  if (!authorDbId || authorDbId === 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
    console.warn("Valid VITE_AUTHOR_DB_ID not found in .env file");
    return null;
  }

  try {
    console.log("Querying author database:", authorDbId);
    
    const { results } = await notion.databases.query({
      database_id: authorDbId,
      filter: {
        property: "active",
        checkbox: {
          equals: true
        }
      },
      page_size: 1
    });

    console.log("Author query results count:", results.length);

    if (results.length === 0) {
      console.warn("No active author found in Notion database");
      return null;
    }

    const authorPage = results[0];
    
    const authorData = {
      name: authorPage.properties.name?.title[0]?.plain_text || "",
      bio: authorPage.properties.bio?.rich_text[0]?.plain_text || "",
      avatar: authorPage.properties.avatar?.files[0]?.file?.url || authorPage.properties.avatar?.files[0]?.external?.url || ""
    };
    
    console.log("Author data:", authorData);
    
    return authorData;
  } catch (error) {
    console.error("Error fetching author data from Notion:", error);
    return null;
  }
}

/**
 * Generate static JSON file for author data
 */
async function generateAuthorData() {
  console.log('Generating author data file...');
  
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Fetch author data from Notion
    const authorData = await fetchAuthorFromNotion();
    
    if (!authorData) {
      console.warn('No author data found in Notion database');
      return;
    }
    
    console.log(`Found author data in Notion database`);
    
    // Write the author data to a JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(authorData, null, 2));
    
    console.log(`Author data file generated successfully at ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating author data file:', error);
  }
}

// Execute the function
generateAuthorData().catch(console.error);
