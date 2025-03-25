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

// Define the output directory and file for testimonials data
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'testimonials.json');

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
 * Fetch testimonials from Notion database
 * @returns {Promise<Array>} Array of testimonial objects
 */
async function fetchTestimonialsFromNotion() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch testimonials.");
    return [];
  }
  
  const testimonialsDbId = process.env.VITE_TESTIMONIALS_DB_ID;
  if (!testimonialsDbId) {
    console.warn("VITE_TESTIMONIALS_DB_ID not found in .env file");
    return [];
  }

  try {
    // Get the last sync time for testimonials
    const lastSyncTime = getCollectionLastSync('testimonials');
    console.log("Last testimonials sync time:", lastSyncTime || "Never synced");
    
    console.log("Querying testimonials database:", testimonialsDbId);
    
    let queryFilter = {
      property: "active",
      checkbox: {
        equals: true,
      },
    };
    
    // Check if we have any existing testimonials
    const forceSync = !fs.existsSync(OUTPUT_FILE);
    
    // If we have a last sync time and we're not forcing sync, add a filter for last_edited_time
    if (lastSyncTime && !forceSync) {
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
      console.log("Filtering for testimonials updated since:", lastSyncTime);
    } else {
      console.log("Fetching all testimonials (force sync)");
    }
    
    const response = await notion.databases.query({
      database_id: testimonialsDbId,
      filter: queryFilter
    });
    
    console.log("Testimonials query results count:", response.results.length);

    if (response.results.length === 0) {
      console.warn("No testimonials found in Notion database");
      return [];
    }

    const testimonials = [];
    
    for (const testimonial of response.results) {
      try {
        // Get the last edited time for this testimonial
        const lastEditedTime = testimonial.last_edited_time;
        
        // Extract testimonial properties
        const name = testimonial.properties.name?.rich_text?.[0]?.plain_text || "Anonymous";
        
        // Get position/title if available
        const title = testimonial.properties.position?.rich_text?.[0]?.plain_text || 
                     testimonial.properties.title?.rich_text?.[0]?.plain_text || 
                     "";
        
        // Get company if available
        const company = testimonial.properties.company?.rich_text?.[0]?.plain_text || 
                       testimonial.properties.organization?.rich_text?.[0]?.plain_text || 
                       "";
        
        // Get the quote from the title property (which is named "quote" in the database)
        const quote = testimonial.properties.quote?.title?.[0]?.plain_text || "";
        
        // Avatar handling
        let avatar = "";
        if (testimonial.properties.avatar?.files?.length > 0) {
          const avatarFile = testimonial.properties.avatar.files[0];
          avatar = avatarFile.file?.url || avatarFile.external?.url || "";
        }
        
        const featured = testimonial.properties.featured?.checkbox || false;
        const order = testimonial.properties.order?.number || 0;
        
        testimonials.push({
          id: testimonial.id,
          name,
          title,
          company,
          quote,
          avatar,
          featured,
          order
        });
        
        console.log(`Processed testimonial: ${name} (${company}): "${quote.substring(0, 30)}..."`);
        
        // Update the timestamp for this testimonial
        updateTimestamp('testimonial', testimonial.id, lastEditedTime);
      } catch (error) {
        console.error("Error processing testimonial:", error);
      }
    }
    
    // Update the collection timestamp after processing all testimonials
    updateCollectionTimestamp('testimonials');

    console.log("Final testimonials count:", testimonials.length);
    return testimonials.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching testimonials from Notion:", error);
    return [];
  }
}

/**
 * Generate static JSON file for testimonials
 */
async function generateTestimonialsData() {
  console.log('Generating testimonials data file...');
  
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Fetch testimonials from Notion
    const testimonials = await fetchTestimonialsFromNotion();
    
    if (!testimonials || testimonials.length === 0) {
      console.warn('No testimonials found in Notion database');
      return;
    }
    
    console.log(`Found ${testimonials.length} testimonials in Notion database`);
    
    // Write the testimonials data to a JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testimonials, null, 2));
    
    console.log(`Testimonials data file generated successfully at ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating testimonials data file:', error);
  }
}

// Execute the function
generateTestimonialsData().catch(console.error);
