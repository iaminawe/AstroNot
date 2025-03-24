#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { needsSync, updateTimestamp, getCollectionLastSync, updateCollectionTimestamp } from './notion-timestamp-tracker.js';

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
      customTransformer: (node) => {
        if (node.type === 'text') {
          let text = node.text.content;
          if (node.annotations.bold) {
            text = `**${text}**`;
          }
          if (node.annotations.italic) {
            text = `*${text}*`;
          }
          return text;
        }
        return null;
      },
      customBlocks: {
        column_list: async (block) => {
          const { id } = block;
          const columnBlocks = await notion.blocks.children.list({ block_id: id });
          
          let columnsHtml = '<div class="notion-columns">';
          
          for (const columnBlock of columnBlocks.results) {
            if (columnBlock.type === 'column') {
              const columnChildrenBlocks = await notion.blocks.children.list({ block_id: columnBlock.id });
              let columnContent = '';
              
              for (const childBlock of columnChildrenBlocks.results) {
                if (childBlock.type === 'paragraph' || childBlock.type === 'bulleted_list_item' || childBlock.type === 'numbered_list_item' || childBlock.type.startsWith('heading_')) {
                  const richText = childBlock[childBlock.type].rich_text;
                  const formattedText = richText.map(t => {
                    let content = t.plain_text;
                    if (t.annotations.bold) {
                      content = `**${content}**`;
                    }
                    if (t.annotations.italic) {
                      content = `*${content}*`;
                    }
                    return content;
                  }).join('');
                  
                  if (childBlock.type === 'bulleted_list_item') {
                    columnContent += `<li>${formattedText}</li>`;
                  } else if (childBlock.type === 'numbered_list_item') {
                    columnContent += `<li>${formattedText}</li>`;
                  } else if (childBlock.type.startsWith('heading_')) {
                    const level = childBlock.type.charAt(childBlock.type.length - 1);
                    columnContent += `<h${level}>${formattedText}</h${level}>`;
                  } else {
                    columnContent += `<p>${formattedText}</p>`;
                  }
                }
              }
              
              columnsHtml += `<div class="notion-column">${columnContent}</div>`;
            }
          }
          
          columnsHtml += '</div>';
          return columnsHtml;
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
    // Get the last sync time for hero content
    const lastSyncTime = getCollectionLastSync('hero');
    console.log("Last hero sync time:", lastSyncTime || "Never synced");
    
    console.log("Querying Notion database:", homeHeroDbId);
    
    let queryFilter = {
      property: "active",
      checkbox: {
        equals: true
      }
    };
    
    // If we have a last sync time, add a filter for last_edited_time
    if (lastSyncTime) {
      queryFilter = {
        and: [
          queryFilter,
          {
            timestamp: "last_edited_time",
            last_edited_time: {
              on_or_after: lastSyncTime
            }
          }
        ]
      };
      console.log("Filtering for hero content updated since:", lastSyncTime);
    }
    
    const { results } = await notion.databases.query({
      database_id: homeHeroDbId,
      filter: queryFilter,
      page_size: 1
    });

    console.log("Query results:", results);

    if (results.length === 0) {
      console.warn("No active home hero content found in Notion database");
      return null;
    }

    const heroPage = results[0];
    console.log("Hero page properties:", heroPage.properties);
    
    // Get the last edited time for this hero content
    const lastEditedTime = heroPage.last_edited_time;
    
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
    
    // Update the timestamp for this hero content
    updateTimestamp('hero', heroPage.id, lastEditedTime);
    
    // Update the collection timestamp after processing
    updateCollectionTimestamp('hero');
    
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
    
    console.log('Raw blocks from Notion:', JSON.stringify(blocks, null, 2));
    
    // Add support for heading blocks
    // Add support for heading blocks with rich text formatting
    n2m.setCustomTransformer("heading_1", async (block) => {
      const text = block.heading_1.rich_text.map(t => {
        let content = t.plain_text;
        if (t.annotations.bold) content = `**${content}**`;
        if (t.annotations.italic) content = `*${content}*`;
        return content;
      }).join('');
      return `<h1>${text}</h1>`;
    });
    
    n2m.setCustomTransformer("heading_2", async (block) => {
      const text = block.heading_2.rich_text.map(t => {
        let content = t.plain_text;
        if (t.annotations.bold) content = `**${content}**`;
        if (t.annotations.italic) content = `*${content}*`;
        return content;
      }).join('');
      return `<h2>${text}</h2>`;
    });
    
    n2m.setCustomTransformer("heading_3", async (block) => {
      const text = block.heading_3.rich_text.map(t => {
        let content = t.plain_text;
        if (t.annotations.bold) {
          content = `<b>${content}</b>`;
        }
        if (t.annotations.italic) {
          content = `<i>${content}</i>`;
        }
        return content;
      }).join('');
      return `<h3>${text}</h3>`;
    });
    
    // Add support for paragraph blocks with rich text formatting
    n2m.setCustomTransformer("paragraph", async (block) => {
      const text = block.paragraph.rich_text.map(t => {
        let content = t.plain_text;
        if (t.annotations && t.annotations.bold) {
          content = `**${content}**`;
        }
        if (t.annotations && t.annotations.italic) {
          content = `*${content}*`;
        }
        return content;
      }).join('');
      
      return text;
    });
    
    // Add support for bulleted list items with rich text formatting
    n2m.setCustomTransformer("bulleted_list_item", async (block) => {
      const text = block.bulleted_list_item.rich_text.map(t => {
        let content = t.plain_text;
        if (t.annotations.bold) content = `**${content}**`;
        if (t.annotations.italic) content = `*${content}*`;
        return content;
      }).join('');
      return `- ${text}`;
    });
    
    // Add support for numbered list items with rich text formatting
    n2m.setCustomTransformer("numbered_list_item", async (block) => {
      const text = block.numbered_list_item.rich_text.map(t => {
        let content = t.plain_text;
        if (t.annotations.bold) content = `**${content}**`;
        if (t.annotations.italic) content = `*${content}*`;
        return content;
      }).join('');
      return `<li>${text}</li>`;
    });

    let isFirstListItem = false;
    let listOpen = false;

    n2m.setCustomTransformer("bulleted_list_item", async (block) => {
      const text = block.bulleted_list_item.rich_text.map(t => t.plain_text).join('');

      if (!listOpen) {
        isFirstListItem = true;
        listOpen = true;
        return `<ul><li>${text}</li>`;
      }

      return `<li>${text}</li>`;
    });

    let isFirstOrderedListItem = false;
    let orderedListOpen = false;

    n2m.setCustomTransformer("numbered_list_item", async (block) => {
      const text = block.numbered_list_item.rich_text.map(t => t.plain_text).join('');

      if (!orderedListOpen) {
        isFirstOrderedListItem = true;
        orderedListOpen = true;
        return `<ol><li>${text}</li>`;
      }

      return `<li>${text}</li>`;
    });

    n2m.setCustomTransformer("paragraph", async (block) => {
      if (listOpen) {
        listOpen = false;
        return `</ul><p>${block.paragraph.rich_text.map(t => t.plain_text).join('')}</p>`;
      }
      if (orderedListOpen) {
        orderedListOpen = false;
        return `</ol><p>${block.paragraph.rich_text.map(t => t.plain_text).join('')}</p>`;
      }
      return `<p>${block.paragraph.rich_text.map(t => t.plain_text).join('')}</p>`;
    });

    n2m.setCustomTransformer("to_do", async (block) => {
      const text = block.to_do.rich_text.map(t => t.plain_text).join('');
      return `<li>${text}</li>`;
    });

    n2m.setCustomTransformer("toggle", async (block) => {
      const text = block.toggle.rich_text.map(t => t.plain_text).join('');
      return `<li>${text}</li>`;
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
