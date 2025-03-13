#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

// Load environment variables from .env file
config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the output directory and file for hero data
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'hero.json');

// Initialize Notion client and NotionToMarkdown
const NOTION_KEY = process.env.VITE_NOTION_KEY;
console.log("VITE_NOTION_KEY:", NOTION_KEY ? "Present (length: " + NOTION_KEY.length + ")" : "Missing");

let notion = null;
let n2m = null;
try {
  if (NOTION_KEY) {
    console.log("Initializing Notion client...");
    notion = new Client({
      auth: NOTION_KEY
    });
    
    // Initialize NotionToMarkdown with column support
    n2m = new NotionToMarkdown({ 
      notionClient: notion,
      customBlocks: {
        column_list: (block) => {
          return { 
            type: "column_list",
            open: '<div class="notion-columns">',
            close: '</div>'
          };
        },
        column: (block) => {
          // Get the column ratio if available
          const ratio = block.column?.width || 1;
          return {
            type: "column",
            open: `<div class="notion-column" style="flex: ${ratio}">`,
            close: '</div>'
          };
        },
        image: (block) => {
          // Special handling for images
          const { type } = block;
          const value = block[type];
          
          // Get image URL based on type
          let imageUrl = '';
          if (value.type === 'external') {
            imageUrl = value.external.url;
          } else if (value.type === 'file') {
            imageUrl = value.file.url;
          }
          
          // Get caption if available
          const caption = value.caption && value.caption.length > 0 
            ? value.caption[0].plain_text 
            : '';
          
          // Return image tag with proper component import
          return {
            type: 'image',
            parent: `<Image src="${imageUrl}" alt="${caption}" />`,
          };
        }
      }
    });
    console.log("Notion client initialized successfully");
  } else {
    console.error("Cannot initialize Notion client: Missing API key");
  }
} catch (error) {
  console.error("Error initializing Notion client:", error);
  notion = null;
  n2m = null;
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
      id: heroPage.id,
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
    const heroData = await fetchHomeHeroFromNotion();
    
    if (!heroData) {
      console.warn('No home hero content found in Notion database');
      return;
    }
    
    // Fetch page content blocks
    const { results: blocks } = await notion.blocks.children.list({
      block_id: heroData.id
    });
    
    // Add support for heading blocks
    n2m.setCustomTransformer("heading_1", async (block) => {
      const text = block.heading_1.rich_text.map(t => t.plain_text).join('');
      return `<h1>${text}</h1>`;
    });
    
    n2m.setCustomTransformer("heading_2", async (block) => {
      const text = block.heading_2.rich_text.map(t => t.plain_text).join('');
      return `<h2>${text}</h2>`;
    });
    
    n2m.setCustomTransformer("heading_3", async (block) => {
      const text = block.heading_3.rich_text.map(t => t.plain_text).join('');
      return `<h3>${text}</h3>`;
    });
    
    // Add support for image blocks
    n2m.setCustomTransformer("image", async (block) => {
      const { image } = block;
      const imageUrl = image?.file?.url || image?.external?.url;
      const caption = image?.caption?.[0]?.plain_text || '';
      
      return `<img src="${imageUrl}" alt="${caption}" class="rounded-lg shadow-xl" />`;
    });
    
    // Add support for column blocks
    n2m.setCustomTransformer("column_list", async (block) => {
      const { id, type } = block;
      const columnBlocks = await notion.blocks.children.list({ block_id: id });
      
      let columnsHtml = '<div class="notion-columns">';
      
      for (const columnBlock of columnBlocks.results) {
        if (columnBlock.type === 'column') {
          const columnChildrenBlocks = await notion.blocks.children.list({ block_id: columnBlock.id });
          const columnMdblocks = await n2m.blocksToMarkdown(columnChildrenBlocks.results);
          const { parent: columnMdString } = n2m.toMarkdownString(columnMdblocks);
          
          columnsHtml += `<div class="notion-column">${columnMdString}</div>`;
        }
      }
      
      columnsHtml += '</div>';
      
      return columnsHtml;
    });
    
    // Convert blocks to markdown
    const mdblocks = await n2m.blocksToMarkdown(blocks);
    const { parent: mdString } = n2m.toMarkdownString(mdblocks);
    
    console.log("Markdown content:", mdString);
    
    const finalData = {
      ...heroData,
      content: mdString
    };

    console.log(`Processed home hero content with Markdown`);

    // Write to src/data/hero.json
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2));
    console.log(`Hero data file generated successfully at ${OUTPUT_FILE}`);

    // Write to public/data/home-hero-content.json
    const publicDataDir = path.join(__dirname, '../../public/data');
    if (!fs.existsSync(publicDataDir)) {
      fs.mkdirSync(publicDataDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(publicDataDir, 'home-hero-content.json'),
      JSON.stringify(finalData, null, 2)
    );
    console.log(`Hero data file generated successfully at ${path.join(publicDataDir, 'home-hero-content.json')}`);
  } catch (error) {
    console.error('Error generating home hero data file:', error);
  }
}

// Execute the function
generateHeroData().catch(console.error);
