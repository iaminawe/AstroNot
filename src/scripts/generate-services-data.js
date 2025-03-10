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

// Define the output directory and file for services data
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'services.json');

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
 * Fetch services from Notion database
 * @returns {Promise<Array>} Array of service objects
 */
async function fetchServicesFromNotion() {
  console.log("=== FETCH SERVICES FUNCTION CALLED ===");
  
  // Check if Notion client is initialized
  if (!notion) {
    console.error("ERROR: Notion client not initialized. NOTION_KEY:", NOTION_KEY ? "Present" : "Missing");
    return [];
  }
  
  // Check if services database ID is provided
  const servicesDbId = process.env.VITE_SERVICES_DB_ID;
  console.log("Services DB ID:", servicesDbId);
  
  if (!servicesDbId) {
    console.error("ERROR: VITE_SERVICES_DB_ID not found in .env file");
    return [];
  }

  try {
    console.log("Attempting to query Notion database with ID:", servicesDbId);
    
    // Test if the Notion client is working by making a simple request
    try {
      console.log("Testing Notion client with a simple request...");
      const user = await notion.users.me();
      console.log("Notion client is working. User:", user.name);
    } catch (testError) {
      console.error("ERROR: Notion client test failed:", testError);
      return [];
    }
    
    // Query the services database
    console.log("Querying Notion database for services...");
    const response = await notion.databases.query({
      database_id: servicesDbId,
    });
    
    console.log("Notion query response:", response);
    const { results } = response;
    console.log("Notion query results count:", results.length);

    if (results.length === 0) {
      console.warn("No services found in Notion database");
      return [];
    }

    const services = [];
    
    for (const service of results) {
      try {
        console.log("Processing service:", service.id);
        
        // Check if the service has the expected properties
        if (!service.properties) {
          console.error("ERROR: Service has no properties:", service);
          continue;
        }
        
        // Extract service properties with detailed logging
        let category, title, description, icon, url, order;
        
        try {
          category = service.properties.category?.select?.name;
          console.log("Category:", category);
        } catch (e) {
          console.error("ERROR extracting category:", e);
          category = "Uncategorized";
        }
        
        try {
          title = service.properties.title?.title[0]?.plain_text;
          console.log("Title:", title);
        } catch (e) {
          console.error("ERROR extracting title:", e);
          title = "Untitled Service";
        }
        
        try {
          description = service.properties.description?.rich_text[0]?.plain_text || "";
          console.log("Description:", description ? "Present" : "Missing");
        } catch (e) {
          console.error("ERROR extracting description:", e);
          description = "";
        }
        
        try {
          icon = service.properties.icon?.rich_text[0]?.plain_text || "";
          console.log("Icon:", icon || "Missing");
        } catch (e) {
          console.error("ERROR extracting icon:", e);
          icon = "";
        }
        
        try {
          url = service.properties.url?.url || "";
          console.log("URL:", url || "Missing");
        } catch (e) {
          console.error("ERROR extracting url:", e);
          url = "";
        }
        
        try {
          order = service.properties.order?.number || 0;
          console.log("Order:", order);
        } catch (e) {
          console.error("ERROR extracting order:", e);
          order = 0;
        }
        
        console.log(`Processing service: ${title} (${category})`);
        
        // Find if category already exists
        let categoryObj = services.find(s => s.name === category);
        
        if (!categoryObj) {
          categoryObj = {
            name: category,
            icon: service.properties.categoryIcon?.rich_text[0]?.plain_text || "",
            items: []
          };
          services.push(categoryObj);
        }
        
        categoryObj.items.push({
          title,
          description,
          icon,
          url,
          order
        });
      } catch (serviceError) {
        console.error("ERROR processing service:", serviceError);
      }
    }
    
    // Sort items within each category
    services.forEach(category => {
      category.items.sort((a, b) => a.order - b.order);
    });
    
    console.log("Final services structure:", services);
    console.log("Services count:", services.length);
    console.log("Total service items:", services.reduce((count, category) => count + category.items.length, 0));
    
    return services;
  } catch (error) {
    console.error("ERROR fetching services from Notion:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return [];
  }
}

/**
 * Generate static JSON file for services
 */
async function generateServicesData() {
  console.log('Generating services data file...');
  
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Fetch services from Notion
    const services = await fetchServicesFromNotion();
    
    if (!services || services.length === 0) {
      console.warn('No services found in Notion database');
      return;
    }
    
    console.log(`Found ${services.length} service categories in Notion database`);
    
    // Write the services data to a JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(services, null, 2));
    
    console.log(`Services data file generated successfully at ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating services data file:', error);
  }
}

// Execute the function
generateServicesData().catch(console.error);
