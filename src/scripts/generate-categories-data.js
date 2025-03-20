#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { Client } from "@notionhq/client";

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

async function fetchCategoriesFromNotion() {
  if (!notion) {
    console.error("Notion client not initialized");
    return [];
  }

  try {
    const response = await notion.databases.query({
      database_id: CATEGORIES_DB_ID,
    });

    const categoriesMap = new Map();
    const rootCategories = [];

    // First pass - collect all categories
    for (const categoryPage of response.results) {
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
  
  for (const [id, category] of categoriesMap) {
    let current = category;
    while (current.parent) {
      if (visited.has(current.parent)) {
        console.error(`Circular reference detected in category ${current.id}`);
        return;
      }
      visited.add(current.parent);
      current = categoriesMap.get(current.parent);
    }
  }

  // Check for orphaned categories
  categoriesMap.forEach(category => {
    if (!category.isTopLevel && !category.parent && !categoriesMap.has(category.parent)) {
      console.warn(`Orphaned category detected: ${category.id} - ${category.name}`);
    }
  });
}

async function generateCategoriesData() {
  try {
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const { categories, flat } = await fetchCategoriesFromNotion();
    
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
