#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { Client } from "@notionhq/client";
import { needsSync, updateTimestamp, getCollectionLastSync, updateCollectionTimestamp } from './notion-timestamp-tracker.js';

config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'categories.json');

const NOTION_KEY = process.env.VITE_NOTION_KEY;
const CATEGORIES_DB_ID = process.env.VITE_CATEGORIES_DB_ID;

let notion = null;
if (NOTION_KEY && CATEGORIES_DB_ID) {
  try {
    notion = new Client({ auth: NOTION_KEY });
  } catch (error) {
    console.error("Error initializing Notion client:", error);
  }
}

async function fetchCategoriesFromNotion(forceSync = false) {
  if (!notion) {
    console.error("Notion client not initialized");
    return [];
  }

  try {
    // Get the last sync time for categories
    const lastSyncTime = forceSync ? null : getCollectionLastSync('categories');
    console.log("Last categories sync time:", lastSyncTime || "Never synced");
    
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
      console.log("Filtering for categories updated since:", lastSyncTime);
    } else {
      console.log("Fetching all categories (force sync)");
    }
    
    const response = await notion.databases.query({
      database_id: CATEGORIES_DB_ID,
      filter: queryFilter,
    });

    const categoriesMap = new Map();
    const rootCategories = [];

    // First pass - collect all categories
    for (const categoryPage of response.results) {
      // Get the last edited time for this category
      const lastEditedTime = categoryPage.last_edited_time;
      
      const props = categoryPage.properties;
      console.log("Category properties:", props);
      const category = {
        id: categoryPage.id,
        name: props.Name?.title[0]?.plain_text || 'Unnamed Category',
        icon: props.Icon?.url || '',
        intro: props.Intro?.rich_text[0]?.plain_text || '',
        footnotes: props.Footnotes?.rich_text[0]?.plain_text || '',
        displayOrder: props.displayOrder?.number || 0,
        parent: props.ParentCategory?.relation[0]?.id || null,
        isTopLevel: props.IsTopLevel?.checkbox || false,
        children: []
      };
      
      categoriesMap.set(categoryPage.id, category);
      
      // Update the timestamp for this category
      updateTimestamp('category', categoryPage.id, lastEditedTime);
    }

    // Second pass - build hierarchy
    for (const [id, category] of categoriesMap) {
      if (category.parent) {
        const parent = categoriesMap.get(category.parent);
        if (parent) {
          parent.children.push(category);
          parent.children.sort((a, b) => a.displayOrder - b.displayOrder);
        }
      } else if (category.isTopLevel) {
        rootCategories.push(category);
      }
    }

    // Sort root categories and validate
    const sortedRoots = rootCategories.sort((a, b) => a.displayOrder - b.displayOrder);
    validateHierarchy(categoriesMap);
    
    // Update the collection timestamp after processing all categories
    updateCollectionTimestamp('categories');

    return {
      categories: sortedRoots,
      flat: Array.from(categoriesMap.values())
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

function validateHierarchy(categoriesMap) {
  const visited = new Set();
  const path = new Set();
  
  for (const [id, category] of categoriesMap) {
    let current = category;
    path.clear();
    
    while (current && current.parent) {
      if (path.has(current.parent)) {
        console.error(`Circular reference detected in category ${current.id}`);
        // Break the circular reference by making this a top-level category
        current.parent = null;
        current.isTopLevel = true;
        break;
      }
      path.add(current.parent);
      visited.add(current.parent);
      current = categoriesMap.get(current.parent);
    }
  }

  // Check for orphaned categories
  categoriesMap.forEach(category => {
    if (!category.isTopLevel && !category.parent && !categoriesMap.has(category.parent)) {
      console.warn(`Orphaned category detected: ${category.id} - ${category.name}`);
      // Make orphaned categories top-level
      category.isTopLevel = true;
    }
  });
}

async function generateCategoriesData() {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Check if we have existing categories
    let forceSync = false;
    if (!fs.existsSync(OUTPUT_FILE)) {
      forceSync = true;
    } else {
      try {
        const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        if (!existingData.flat || existingData.flat.length === 0) {
          forceSync = true;
        }
      } catch (e) {
        forceSync = true;
      }
    }

    const { categories, flat } = await fetchCategoriesFromNotion(forceSync);
    
    // If no updates were found and we have existing data, keep the existing data
    if (!forceSync && flat.length === 0 && fs.existsSync(OUTPUT_FILE)) {
      try {
        const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        if (existingData.flat && existingData.flat.length > 0) {
          console.log('No updates found, keeping existing categories data');
          return;
        }
      } catch (e) {
        console.error('Error reading existing categories data:', e);
      }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify({
      hierarchy: categories,
      flat: flat
    }, null, 2));

    console.log(`Generated ${flat.length} categories with ${categories.length} root categories`);
  } catch (error) {
    console.error('Failed to generate categories:', error);
  }
}

generateCategoriesData().catch(console.error);
