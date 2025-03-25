#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { delay } from '../helpers/delay.mjs';

// Load environment variables from .env file
config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the output directory and file for work experience data
const OUTPUT_DIR = path.join(__dirname, '..', 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'work-experience.json');

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
 * Fetch work experience from Notion database
 * @returns {Promise<Array>} Array of work experience objects
 */
async function fetchWorkExperienceFromNotion() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch work experience.");
    return [];
  }
  
  const workExperienceDbId = process.env.VITE_WORK_EXPERIENCE_DB_ID;
  if (!workExperienceDbId) {
    console.warn("VITE_WORK_EXPERIENCE_DB_ID not found in .env file");
    return [];
  }

  try {
    console.log("Querying work experience database:", workExperienceDbId);
    
    const { results } = await notion.databases.query({
      database_id: workExperienceDbId,
      sorts: [
        {
          property: "startDate",
          direction: "descending",
        }
      ],
      filter: {
        property: "active",
        checkbox: {
          equals: true
        }
      }
    });

    console.log("Work experience query results count:", results.length);

    if (results.length === 0) {
      console.warn("No work experience found in Notion database");
      return [];
    }

    const workExperience = [];
    
    for (const job of results) {
      const title = job.properties.Position?.rich_text[0]?.plain_text || "Untitled Position";
      const company = job.properties.Company?.title[0]?.plain_text || "";
      const location = job.properties.Location?.rich_text[0]?.plain_text || "";
      const startDate = job.properties.startDate?.date?.start || "";
      const endDate = job.properties.endDate?.date?.start || "Present";
      const period = `${startDate} - ${endDate}`;
      const skills = job.properties.keySkills?.multi_select.map(skill => skill.name) || [];
      const shortDescription = job.properties.Description?.rich_text[0]?.plain_text || "";
      const employmentType = job.properties.employmentType?.select?.name || "";
      
      console.log(`Processing job: ${title} at ${company}`);
      
      // Fetch description blocks
      const descriptionBlocks = await n2m.pageToMarkdown(job.id);
      await delay(THROTTLE_DURATION); // Throttle to avoid rate limiting
      
      // Convert description blocks to array of strings
      const descriptionItems = [];
      for (const block of descriptionBlocks) {
        if (block.type === 'paragraph' && block.parent.includes('•')) {
          descriptionItems.push(block.parent.replace('• ', ''));
        }
      }
      
      workExperience.push({
        title,
        company,
        location,
        period,
        description: descriptionItems.length > 0 ? descriptionItems : [shortDescription],
        skills,
        employmentType,
        startDate,
        endDate
      });
      
      console.log(`Processed job: ${title} at ${company}`);
    }
    
    console.log("Work experience processed:", workExperience.length);
    
    return workExperience;
  } catch (error) {
    console.error("Error fetching work experience from Notion:", error);
    return [];
  }
}

/**
 * Generate static JSON file for work experience
 */
async function generateWorkExperienceData() {
  console.log('Generating work experience data file...');
  
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Fetch work experience from Notion
    const workExperience = await fetchWorkExperienceFromNotion();
    
    if (!workExperience || workExperience.length === 0) {
      console.warn('No work experience found in Notion database');
      return;
    }
    
    console.log(`Found ${workExperience.length} work experience entries in Notion database`);
    
    // Write the work experience data to a JSON file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(workExperience, null, 2));
    
    console.log(`Work experience data file generated successfully at ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating work experience data file:', error);
  }
}

// Execute the function
generateWorkExperienceData().catch(console.error);
