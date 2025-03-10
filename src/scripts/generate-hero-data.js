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

// Define the output directory and file for hero data
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'hero.json');

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
 * Fetch home hero content from Notion database
 * @returns {Promise<Object|null>} Home hero content object or null if not available
 */
async function fetchHomeHeroFromNotion() {
  console.log("fetchHomeHero called");
  
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch home hero content.");
    return null;
  }
  
  const homeHeroDbId = process.env.VITE_HOME_HERO_DB_ID;
  console.log("Home Hero DB ID:", homeHeroDbId);
  
  if (!homeHeroDbId) {
    console.warn("VITE_HOME_HERO_DB_ID not found in .env file");
    return null;
  }

  try {
    console.log("Querying Notion database:", homeHeroDbId);
    
    const { results } = await notion.databases.query({
      database_id: homeHeroDbId,
      filter: {
        property: "active",
        checkbox: {
          equals: true
        }
      },
      page_size: 1
    });

    console.log("Query results:", results);

    if (results.length === 0) {
      console.warn("No active home hero content found in Notion database");
      return null;
    }

    const heroPage = results[0];
    console.log("Hero page properties:", heroPage.properties);
    
    const heroContent = {
      title: heroPage.properties.title?.title[0]?.plain_text || "",
      subtitle: heroPage.properties.subtitle?.rich_text[0]?.plain_text || "",
      description: heroPage.properties.introParagraph?.rich_text[0]?.plain_text || "",
      ctaButton: {
        text: heroPage.properties.ctaTitle?.rich_text[0]?.plain_text || "Learn More",
        url: heroPage.properties.ctaLink?.url || "#",
        target: "_blank"
      },
      secondaryCtaButton: {
        text: heroPage.properties["CTA Secondary Title"]?.rich_text[0]?.plain_text || "",
        url: heroPage.properties.secondaryCtaLink?.rich_text[0]?.plain_text || "#",
        target: "_blank"
      },
      profileImage: {
        src: heroPage.properties.imageUrl?.url || heroPage.properties.imageUrl?.rich_text[0]?.plain_text || "",
        alt: heroPage.properties.imageAlt?.rich_text[0]?.plain_text || "Hero Image"
      }
    };
    
    console.log("Hero content:", heroContent);
    return heroContent;
  } catch (error) {
    console.error("Error fetching home hero content from Notion:", error);
    return null;
  }
}

/**
 * Generate static JSON file for home hero content
 */
async function generateHeroData() {
  console.log('Generating home hero data file...');
  
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Fetch home hero content from Notion
    const heroContent = await fetchHomeHeroFromNotion();
    
    if (!heroContent) {
      console.warn('No home hero content found in Notion database');
      return;
    }
    
    console.log(`Found home hero content in Notion database`);
    
    // Write the home hero content to a JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(heroContent, null, 2));
    
    console.log(`Home hero data file generated successfully at ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating home hero data file:', error);
  }
}

// Execute the function
generateHeroData().catch(console.error);
