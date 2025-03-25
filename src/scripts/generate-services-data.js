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
 * Fetch category details from Notion
 * @param {string} categoryId - The ID of the category to fetch
 * @returns {Promise<Object>} The category details
 */
async function fetchCategoryDetails(categoryId) {
  try {
    const response = await notion.pages.retrieve({ page_id: categoryId });
    const parentId = response.properties.ParentCategory?.relation[0]?.id;
    let parentDetails = null;
    
    if (parentId) {
      const parentResponse = await notion.pages.retrieve({ page_id: parentId });
      parentDetails = {
        id: parentId,
        name: parentResponse.properties.Name?.title[0]?.plain_text || 'Uncategorized',
        displayOrder: parentResponse.properties.displayOrder?.number || 0
      };
    }
    
    return {
      id: categoryId,
      name: response.properties.Name?.title[0]?.plain_text || 'Uncategorized',
      intro: response.properties.Intro?.rich_text[0]?.plain_text || '',
      footnotes: response.properties.Footnotes?.rich_text[0]?.plain_text || '',
      displayOrder: response.properties.displayOrder?.number || 0,
      parent: parentDetails,
      isTopLevel: response.properties.IsTopLevel?.checkbox || false
    };
  } catch (error) {
    console.error(`Error fetching category details for ID ${categoryId}:`, error);
    return {
      id: categoryId,
      name: 'Uncategorized',
      intro: '',
      footnotes: '',
      displayOrder: 0,
      parent: null,
      isTopLevel: false
    };
  }
}

/**
 * Fetch services from Notion database
 * @returns {Promise<Array>} Array of service objects
 */
async function fetchServicesFromNotion(forceSync = false) {
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
    
    // Get the last sync time for services
    const lastSyncTime = getCollectionLastSync('services');
    console.log("Last services sync time:", lastSyncTime || "Never synced");
    
    // Query the services database
    console.log("Querying Notion database for services...");
    
    let queryFilter = {
      property: "active",
      checkbox: {
        equals: true,
      },
    };
    
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
      console.log("Filtering for services updated since:", lastSyncTime);
    } else {
      console.log("Fetching all services (force sync)");
    }
    
    const response = await notion.databases.query({
      database_id: servicesDbId,
      filter: queryFilter
    });
    
    const { results } = response;
    console.log("Notion query results count:", results.length);

    if (results.length === 0) {
      console.warn("No services found in Notion database");
      return [];
    }

    const services = [];
    const topLevelCategories = new Map(); // Map to store top-level categories
    const categoryDetailsCache = new Map(); // Cache category details
    
    for (const service of results) {
      try {
        console.log("\nProcessing service:", service.id);
        
        // Get the last edited time for this service
        const lastEditedTime = service.last_edited_time;
        
        // Check if the service has the expected properties
        if (!service.properties) {
          console.error("ERROR: Service has no properties:", service);
          continue;
        }
        
        // Extract service properties with detailed logging
        let categoryId, title, description, icon, url, displayOrder, active;
        
        try {
          // Get category ID from relation
          categoryId = service.properties.Category?.relation[0]?.id;
          if (!categoryId) {
            console.error("No category relation found");
            continue;
          }
          
          // Get category details (from cache or fetch new)
          let categoryDetails;
          if (categoryDetailsCache.has(categoryId)) {
            categoryDetails = categoryDetailsCache.get(categoryId);
          } else {
            categoryDetails = await fetchCategoryDetails(categoryId);
            categoryDetailsCache.set(categoryId, categoryDetails);
          }
          
          console.log("Category Details:", categoryDetails);
          
          // Get or create top-level category
          const topLevelCategory = categoryDetails.parent || categoryDetails;
          if (!topLevelCategories.has(topLevelCategory.id)) {
            topLevelCategories.set(topLevelCategory.id, {
              name: topLevelCategory.name,
              icon: "",
              displayOrder: topLevelCategory.displayOrder,
              children: new Map() // Map to store subcategories
            });
          }
          
          // Get or create subcategory
          const subcategoryId = categoryDetails.parent ? categoryId : null;
          if (subcategoryId) {
            const subcategories = topLevelCategories.get(topLevelCategory.id).children;
            if (!subcategories.has(subcategoryId)) {
              subcategories.set(subcategoryId, {
                name: categoryDetails.name,
                icon: "",
                intro: categoryDetails.intro,
                footnotes: categoryDetails.footnotes,
                displayOrder: categoryDetails.displayOrder,
                items: []
              });
            }
          }
        } catch (e) {
          console.error("ERROR extracting Category:", e);
          continue;
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
          displayOrder = service.properties.displayOrder?.number || 0;
          console.log("Display Order:", displayOrder);
        } catch (e) {
          console.error("ERROR extracting displayOrder:", e);
          displayOrder = 0;
        }
        
        try {
          active = service.properties.active?.checkbox || false;
          console.log("Active:", active);
        } catch (e) {
          console.error("ERROR extracting active:", e);
          active = false;
        }

        const categoryDetails = categoryDetailsCache.get(categoryId);
        const topLevelCategory = categoryDetails.parent || categoryDetails;
        const subcategoryId = categoryDetails.parent ? categoryId : null;
        
        // Add service to its subcategory
        if (subcategoryId) {
          const subcategory = topLevelCategories.get(topLevelCategory.id).children.get(subcategoryId);
          subcategory.items.push({
            title,
            description,
            icon,
            url,
            displayOrder,
            active
          });
        }
        
        console.log(`\nProcessed service: ${title} (${categoryDetails.name})`);
        
        // Update the timestamp for this service
        updateTimestamp('service', service.id, lastEditedTime);
      } catch (serviceError) {
        console.error("ERROR processing service:", serviceError);
      }
    }
    
    // Update the collection timestamp after processing all services
    updateCollectionTimestamp('services');
    
    // Convert Map to array and sort everything
    const servicesArray = Array.from(topLevelCategories.values()).map(category => ({
      ...category,
      children: Array.from(category.children.values())
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map(subcategory => ({
          ...subcategory,
          items: subcategory.items.filter(item => item.active).sort((a, b) => a.displayOrder - b.displayOrder)
        }))
    })).sort((a, b) => a.displayOrder - b.displayOrder);
    
    console.log("\nFinal services structure:", JSON.stringify(servicesArray, null, 2));
    console.log("Final services count:", servicesArray.length);
    console.log("Total service items:", servicesArray.reduce((count, category) => 
      category.children.reduce((subcount, subcategory) => 
        subcount + subcategory.items.length, 0), 0));
    
    return servicesArray.filter(category => category.children.some(subcategory => subcategory.items.some(item => item.active))).sort((a, b) => a.displayOrder - b.displayOrder);
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
    
    // Check if we have any existing services
    const forceSync = !fs.existsSync(OUTPUT_FILE);
    
    // Fetch services from Notion
    const services = await fetchServicesFromNotion(forceSync);
    
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
