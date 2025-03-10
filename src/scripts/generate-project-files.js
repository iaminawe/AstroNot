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

// Initialize Notion client
const NOTION_KEY = process.env.VITE_NOTION_KEY;
console.log("VITE_NOTION_KEY:", NOTION_KEY ? "Present (length: " + NOTION_KEY.length + ")" : "Missing");

let notion = null;
try {
  if (NOTION_KEY) {
    console.log("Initializing Notion client...");
    notion = new Client({
      auth: NOTION_KEY,
      config: {
        parseChildPages: false
      }
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
 * Fetch projects from Notion database
 * @returns {Promise<Array>} Array of project objects
 */
async function fetchProjectsFromNotion() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch projects.");
    return [];
  }
  
  const projectsDbId = process.env.VITE_PROJECTS_DB_ID;
  if (!projectsDbId) {
    console.warn("VITE_PROJECTS_DB_ID not found in .env file");
    return [];
  }

  try {
    const { results } = await notion.databases.query({
      database_id: projectsDbId,
    });

    const projects = [];
    
    for (const project of results) {
      const title = project.properties.title?.title[0]?.plain_text || "Untitled Project";
      // Create a slug from the title
      const slug = project.properties.slug?.rich_text[0]?.plain_text || 
                  title.toLowerCase()
                      .replace(/[^\w\s-]/g, '')
                      .replace(/\s+/g, '-');
      
      // Fetch the page content
      const mdblocks = await n2m.pageToMarkdown(project.id);
      const { parent: mdString } = n2m.toMarkdownString(mdblocks);
      await delay(THROTTLE_DURATION); // Throttle to avoid rate limiting
      
      // Get cover image from page cover or coverImage property
      let coverImage = "";
      
      // First check if there's a page cover
      if (project.cover) {
        coverImage = project.cover.external?.url || project.cover.file?.url || "";
      }
      
      // If no page cover, check for coverImage property
      if (!coverImage) {
        coverImage = project.properties.coverImage?.files[0]?.file?.url || 
                    project.properties.coverImage?.files[0]?.external?.url || 
                    "";
      }
      
      projects.push({
        id: project.id,
        title,
        description: project.properties.description?.rich_text[0]?.plain_text || "",
        coverImage,
        url: project.properties.url?.url || "",
        tags: project.properties.tags?.multi_select || [],
        featured: project.properties.featured?.checkbox || false,
        order: project.properties.order?.number || 0,
        slug,
        content: mdString || "",
        created_time: project.created_time,
        last_edited_time: project.last_edited_time,
      });
    }

    return projects.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching projects from Notion:", error);
    return [];
  }
}

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define the output directory for project markdown files
const OUTPUT_DIR = path.join(__dirname, '..', 'pages', 'projects');

/**
 * Generate markdown files for projects
 */
async function generateProjectFiles() {
  console.log('Generating project markdown files...');
  
  try {
    // Ensure the output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // Fetch projects from Notion
    const projects = await fetchProjectsFromNotion();
    
    if (!projects || projects.length === 0) {
      console.warn('No projects found in Notion database');
      return;
    }
    
    console.log(`Found ${projects.length} projects in Notion database`);
    
    // Generate a markdown file for each project
    for (const project of projects) {
      const { 
        id, 
        title, 
        description, 
        coverImage, 
        url, 
        tags, 
        featured, 
        order, 
        slug, 
        content, 
        created_time, 
        last_edited_time 
      } = project;
      
      // Create frontmatter
      const frontmatter = `---
layout: "../../layouts/ProjectLayout.astro"
id: "${id}"
slug: "${slug}"
title: "${title.replace(/"/g, '\\"')}"
cover: "${coverImage}"
tags: ${JSON.stringify(tags)}
created_time: ${created_time}
last_edited_time: ${last_edited_time}
url: "${url}"
featured: ${featured}
order: ${order}
status: "published"
publish_date: ${created_time}
description: "${description ? description.replace(/"/g, '\\"') : ''}"
---
import Image from '../../components/Image.astro';
import BookmarkCard from '../../components/BookmarkCard.astro';

${content}`;
      
      // Write the file
      const filePath = path.join(OUTPUT_DIR, `${slug}.mdx`);
      fs.writeFileSync(filePath, frontmatter);
      
      console.log(`Generated markdown file for project: ${title} (${slug})`);
    }
    
    console.log('Project markdown files generated successfully');
  } catch (error) {
    console.error('Error generating project markdown files:', error);
  }
}

// Execute the function
generateProjectFiles().catch(console.error);
