#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { delay } from '../helpers/delay.mjs';
import { processImageUrl } from './sync-notion-images.js';

// Load environment variables from .env file
config();

// Force S3 storage mode
process.argv.push('--s3');

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the output directory and file for about data
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'about.json');

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

// Initialize NotionToMarkdown
const n2m = new NotionToMarkdown({ notionClient: notion });

// Rate limiting helper
const THROTTLE_DURATION = 334; // ms - Notion API has a rate limit of 3 requests per second

/**
 * Fetch about page content from Notion database
 * @returns {Promise<Object>} About page content object
 */
async function fetchAboutContentFromNotion() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch about content.");
    return null;
  }
  
  const aboutDbId = process.env.VITE_ABOUT_DB_ID;
  if (!aboutDbId || aboutDbId === 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
    console.warn("Valid VITE_ABOUT_DB_ID not found in .env file");
    return null;
  }

  try {
    console.log("Querying about database:", aboutDbId);
    
    const { results } = await notion.databases.query({
      database_id: aboutDbId,
      filter: {
        property: "active",
        checkbox: {
          equals: true,
        },
      },
    });

    console.log("About query results count:", results.length);

    if (results.length === 0) {
      console.warn("No active about page content found in Notion database");
      return null;
    }

    const aboutPage = results[0];
    
    // Fetch content blocks
    console.log("Fetching content blocks for about page:", aboutPage.id);
    const contentBlocks = await n2m.pageToMarkdown(aboutPage.id);
    await delay(THROTTLE_DURATION); // Throttle to avoid rate limiting
    
    // Convert content blocks to array of paragraphs
    const paragraphs = [];
    for (const block of contentBlocks) {
      if (block.type === 'paragraph' && block.parent.trim() !== '') {
        paragraphs.push(block.parent);
      }
    }
    
    console.log(`Extracted ${paragraphs.length} paragraphs from about page`);
    
    // Get and process profile image
    let profileImageSrc = "";
    let profileImageAlt = "Profile Image";
    
    if (aboutPage.properties.profileImage?.files?.length > 0) {
      const imageFile = aboutPage.properties.profileImage.files[0];
      const notionUrl = imageFile.file?.url || imageFile.external?.url || "";
      if (notionUrl) {
        profileImageSrc = await processImageUrl(notionUrl, 'about');
        console.log("Processed profile image URL:", profileImageSrc);
      }
    }
    
    if (aboutPage.properties.profileImageAlt?.rich_text?.length > 0) {
      profileImageAlt = aboutPage.properties.profileImageAlt.rich_text[0].plain_text;
    }
    
    console.log("Profile image:", profileImageSrc ? "Present" : "Missing");
    
    // Get email information
    const emailAddress = aboutPage.properties.email?.email || "";
    const emailLabel = aboutPage.properties.emailLabel?.rich_text?.[0]?.plain_text || emailAddress;
    
    console.log("Email:", emailAddress);
    
    // Get title
    const title = aboutPage.properties.title?.title?.[0]?.plain_text || "About me";
    
    console.log("Title:", title);
    
    // Read social links from the static data file
    let socialLinks = [];
    try {
      const socialLinksPath = path.join(__dirname, '..', 'data', 'social-links.json');
      if (fs.existsSync(socialLinksPath)) {
        socialLinks = JSON.parse(fs.readFileSync(socialLinksPath, 'utf8'));
        console.log(`Loaded ${socialLinks.length} social links from static data`);
      } else {
        console.warn('Social links data file not found, will be empty in about content');
      }
    } catch (error) {
      console.error('Error loading social links data:', error);
    }
    
    return {
      title,
      paragraphs,
      profileImage: {
        src: profileImageSrc,
        alt: profileImageAlt,
      },
      socialLinks,
      email: {
        address: emailAddress,
        label: emailLabel,
      },
    };
  } catch (error) {
    console.error("Error fetching about page content from Notion:", error);
    return null;
  }
}

/**
 * Generate static JSON file for about content
 */
async function generateAboutData() {
  console.log('Generating about data file...');
  
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Fetch about content from Notion
    const aboutContent = await fetchAboutContentFromNotion();
    
    if (!aboutContent) {
      console.warn('No about content found in Notion database');
      return;
    }
    
    console.log(`Found about content in Notion database`);
    
    // Write the about content to a JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(aboutContent, null, 2));
    
    console.log(`About data file generated successfully at ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating about data file:', error);
  }
}

// Execute the function
generateAboutData().catch(console.error);
