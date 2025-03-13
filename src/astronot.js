import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import fs from 'fs';
import readingTime from 'reading-time';
import { config } from 'dotenv';
import { parseArgs } from 'node:util';
import { sanitizeUrl, sanitizeImageString } from './helpers/sanitize.mjs';
import { hashString, downloadImage } from './helpers/images.mjs';
import { delay } from './helpers/delay.mjs';

// Input Arguments
const ARGUMENT_OPTIONS = {
  published: { // Only sync published posts
    type: 'boolean',
    short: 'p'
  },
};
const { values: { published } } = parseArgs({ options: ARGUMENT_OPTIONS });
const isPublished = !!published;
console.log(`Syncing Published Only: ${isPublished}`)

// Load ENV Variables
config();
if (!process.env.NOTION_KEY || !process.env.DATABASE_ID) throw new Error("Missing Notion .env data")
const NOTION_KEY = process.env.NOTION_KEY;
const DATABASE_ID = process.env.DATABASE_ID; // TODO: Import from ENV
const AUTHOR_DB_ID = process.env.AUTHOR_DB_ID; // New Author DB ID

const POSTS_PATH = `src/pages/posts`;
const THROTTLE_DURATION = 334; // ms Notion API has a rate limit of 3 requests per second, so ensure that is not exceeded

console.log("Notion API Base URL:", process.env.NOTION_API_URL);
console.log("Notion Database ID:", process.env.NOTION_DATABASE_ID);

const notion = new Client({
  auth: NOTION_KEY,
  config: {
    parseChildPages: false,
  }
});

// Notion Custom Block Transform START
const n2m = new NotionToMarkdown({ 
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
    }
  }
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

n2m.setCustomTransformer("embed", async (block) => {
  const { embed } = block;
  if (!embed?.url) return "";
  return `<figure>
  <iframe src="${embed?.url}"></iframe>
  <figcaption>${await n2m.blockToMarkdown(embed?.caption)}</figcaption>
</figure>`;
});

n2m.setCustomTransformer("image", async (block) => {
  const { image, id } = block;
  const imageUrl = image?.file?.url || image?.external?.url;
  const imageFileName = sanitizeImageString(imageUrl.split('/').pop());
  const filePath = await downloadImage(imageUrl, `./images/${imageFileName}`);
  const fileName = filePath.split('/').pop();

  return `<Image src="/images/posts/${fileName}" />`;
});

n2m.setCustomTransformer("video", async (block) => {
  const { video } = block;
  const { caption, type, external: { url: videoUrl } } = video;

  let url = videoUrl;

  if (url.includes('youtube.com')) {
    if (url.includes('/watch')) {
      // Youtube URLs with the /watch format don't work, need to be replaced with /embed
      const videoId = url.split('&')[0].split('?v=')[1];
      url = `https://www.youtube.com/embed/${videoId}`;
    }
  }

  return `<iframe width="100%" height="480" src="${url}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
});

// Add custom transformer for bookmarks
n2m.setCustomTransformer("bookmark", async (block) => {
  const { bookmark } = block;
  const { url, caption } = bookmark;
  
  if (!url) return "";
  
  // Try to fetch metadata from the URL
  let title = '';
  let description = '';
  let image = '';
  
  try {
    // Use node-fetch to get the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AstroNotBot/1.0; +https://astronot.dev)'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      
      // Extract title
      const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
      
      // Extract description
      const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || 
                              html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i) ||
                              html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                              html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["'][^>]*>/i);
      if (descriptionMatch && descriptionMatch[1]) {
        description = descriptionMatch[1].trim();
      }
      
      // Extract image
      const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["'][^>]*>/i) ||
                        html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["'][^>]*>/i);
      if (imageMatch && imageMatch[1]) {
        image = imageMatch[1].trim();
      }
    }
  } catch (error) {
    console.warn(`Error fetching metadata for ${url}:`, error.message);
  }
  
  // Return the BookmarkCard component with metadata
  return `<BookmarkCard url="${url}" ${title ? `title="${title}"` : ''} ${description ? `description="${description}"` : ''} ${image ? `image="${image}"` : ''} />`;
});
// Notion Custom Block Transform END

// Fetch Notion Posts from Database via Notion API
const queryParams = {
  database_id: DATABASE_ID,
}

if (isPublished) {
  queryParams.filter = {
    "and": [
      {
        "property": "status",
        "select": {
          equals: 'published'
        }
      },
    ]
  }
}

const databaseResponse = await notion.databases.query(queryParams);
const { results } = databaseResponse;

// Create Pages
const pages = results.map((page) => {
  const { properties, cover, created_time, last_edited_time, icon, archived } = page;
  const title = properties.title.title[0].plain_text
  const slug = properties?.slug?.rich_text[0]?.plain_text || sanitizeUrl(title)

  console.info("Notion Page:", page);

  return {
    id: page.id,
    title,
    type: page.object,
    cover: cover?.external?.url || cover?.file?.url,
    tags: properties.tags.multi_select,
    created_time,
    last_edited_time,
    icon,
    archived,
    status: properties?.status?.select?.name,
    publish_date: properties?.publish_date?.date?.start,
    description: properties?.description?.rich_text[0]?.plain_text,
    slug,
  }
});

for (let page of pages) {
  console.info("Fetching from Notion & Converting to Markdown: ", `${page.title} [${page.id}]`);
  const mdblocks = await n2m.pageToMarkdown(page.id);
  const { parent: mdString } = n2m.toMarkdownString(mdblocks);

  const estimatedReadingTime = readingTime(mdString || '').text;

  // Download Cover Image
  const coverFileName = page.cover ? await downloadImage(page.cover, { isCover: true }) : '';
  if (coverFileName) console.info("Cover image downloaded:", coverFileName)

  // Check if the markdown contains a bookmark
  const hasBookmark = mdString.includes('<BookmarkCard');
  
  // Generate page contents (frontmatter, MDX imports, + converted Notion markdown)
  const pageContents = `---
layout: "../../layouts/PostLayout.astro"
id: "${page.id}"
slug: "${page.slug}"
title: "${page.title}"
cover: "${coverFileName}"
tags: ${JSON.stringify(page.tags)}
created_time: ${page.created_time}
last_edited_time: ${page.last_edited_time}
icon: ${JSON.stringify(page.icon)}
archived: ${page.archived}
status: "${page.status}"
publish_date: ${page.publish_date ? page.publish_date : false}
description: "${page.description === 'undefined' ? '' : page.description}"
reading_time: "${estimatedReadingTime}"
---
import Image from '../../components/Image.astro';
${hasBookmark ? 'import BookmarkCard from \'../../components/BookmarkCard.astro\';' : ''}

${mdString}
`

  if (mdString) fs.writeFileSync(`${process.cwd()}/${POSTS_PATH}/${page.slug}.mdx`, pageContents);
  else console.log(`No content for page ${page.id}`)

  console.debug(`Sleeping for ${THROTTLE_DURATION} ms...\n`)
  await delay(THROTTLE_DURATION); // Need to throttle requests to avoid rate limiting
}

console.info("Successfully synced posts with Notion")

// Fetch Author Data
async function syncAuthor() {
  // Check if AUTHOR_DB_ID is provided
  if (!AUTHOR_DB_ID) {
    console.warn("AUTHOR_DB_ID not provided in .env file. Using default author data.");
    return [{
      name: "Gregg Coppen",
      bio: "Human in the Loop, Designer, Developer, AI Consultant",
      avatar: "/images/portrait.webp"
    }];
  }
  
  try {
    const { results } = await notion.databases.query({
      database_id: AUTHOR_DB_ID,
      filter: { property: "active", checkbox: { equals: true } }
    });
    
    if (results.length === 0) {
      console.warn("No active author found in Notion database. Using default author data.");
      return [{
        name: "Gregg Coppen",
        bio: "Human in the Loop, Designer, Developer, AI Consultant",
        avatar: "/images/portrait.webp"
      }];
    }
    
    // Log the author properties to see what's available
    console.log("Author properties:", JSON.stringify(results[0].properties, null, 2));
    
    // Try to access the properties safely
    return results.map(author => {
      const name = author.properties.name?.title?.[0]?.plain_text || 
                  author.properties.Name?.title?.[0]?.plain_text || 
                  author.properties.title?.title?.[0]?.plain_text || 
                  "Gregg Coppen";
      
      const bio = author.properties.bio?.rich_text?.[0]?.plain_text || 
                 author.properties.Bio?.rich_text?.[0]?.plain_text || 
                 "Human in the Loop, Designer, Developer, AI Consultant";
      
      const avatar = author.properties.avatar?.files?.[0]?.file?.url || 
                    author.properties.Avatar?.files?.[0]?.file?.url || 
                    "/images/portrait.webp";
      
      return { name, bio, avatar };
    });
  } catch (error) {
    console.error("Error fetching author data from Notion:", error);
    console.warn("Using default author data as fallback.");
    return [{
      name: "Gregg Coppen",
      bio: "Human in the Loop, Designer, Developer, AI Consultant",
      avatar: "/images/portrait.webp"
    }];
  }
}

let authorData;
try {
  authorData = await syncAuthor();
  console.info("Successfully synced author data:", authorData);
} catch (error) {
  console.error("Error syncing author data:", error);
  authorData = [{
    name: "Gregg Coppen",
    bio: "Human in the Loop, Designer, Developer, AI Consultant",
    avatar: "/images/portrait.webp"
  }];
  console.info("Using default author data:", authorData);
}
