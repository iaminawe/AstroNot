import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { config } from 'dotenv';
import { delay } from './delay.mjs';

// Load ENV Variables
config();

// Check if Notion API key is available
const NOTION_KEY = import.meta.env.VITE_NOTION_KEY;
if (!NOTION_KEY) {
  console.warn("Missing Notion API key in .env file. Notion integration will not work.");
}

// Initialize Notion client if API key is available
const notion = NOTION_KEY ? new Client({
  auth: NOTION_KEY,
  config: {
    parseChildPages: false
  }
}) : null;

// Initialize NotionToMarkdown
const n2m = new NotionToMarkdown({ notionClient: notion });

// Rate limiting helper
const THROTTLE_DURATION = 334; // ms - Notion API has a rate limit of 3 requests per second

/**
 * Fetch projects from Notion database
 * @returns {Promise<Array>} Array of project objects
 */
export async function fetchProjects() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch projects.");
    return [];
  }
  
  const projectsDbId = import.meta.env.VITE_PROJECTS_DB_ID;
  if (!projectsDbId) {
    console.warn("VITE_PROJECTS_DB_ID not found in .env file");
    return [];
  }

  try {
    const { results } = await notion.databases.query({
      database_id: projectsDbId,
    });

    const projects = results.map(project => ({
      id: project.id,
      title: project.properties.title?.title[0]?.plain_text || "Untitled Project",
      description: project.properties.description?.rich_text[0]?.plain_text || "",
      coverImage: project.properties.coverImage?.files[0]?.file?.url || project.properties.coverImage?.files[0]?.external?.url || "",
      url: project.properties.url?.url || "",
      tags: project.properties.tags?.multi_select || [],
      featured: project.properties.featured?.checkbox || false,
      order: project.properties.order?.number || 0,
    }));

    return projects.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching projects from Notion:", error);
    return [];
  }
}

/**
 * Fetch services from Notion database
 * @returns {Promise<Array>} Array of service objects
 */
export async function fetchServices() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch services.");
    return [];
  }
  
  const servicesDbId = import.meta.env.VITE_SERVICES_DB_ID;
  if (!servicesDbId) {
    console.warn("VITE_SERVICES_DB_ID not found in .env file");
    return [];
  }

  try {
    const { results } = await notion.databases.query({
      database_id: servicesDbId,
    });

    const services = [];
    
    for (const service of results) {
      const category = service.properties.category?.select?.name || "Uncategorized";
      const title = service.properties.title?.title[0]?.plain_text || "Untitled Service";
      const description = service.properties.description?.rich_text[0]?.plain_text || "";
      const icon = service.properties.icon?.rich_text[0]?.plain_text || "";
      const url = service.properties.url?.url || "";
      const order = service.properties.order?.number || 0;
      
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
    }
    
    // Sort items within each category
    services.forEach(category => {
      category.items.sort((a, b) => a.order - b.order);
    });
    
    return services;
  } catch (error) {
    console.error("Error fetching services from Notion:", error);
    return [];
  }
}

/**
 * Fetch testimonials from Notion database
 * @returns {Promise<Array>} Array of testimonial objects
 */
export async function fetchTestimonials() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch testimonials.");
    return [];
  }
  
  const testimonialsDbId = import.meta.env.VITE_TESTIMONIALS_DB_ID;
  if (!testimonialsDbId) {
    console.warn("VITE_TESTIMONIALS_DB_ID not found in .env file");
    return [];
  }

  try {
    const { results } = await notion.databases.query({
      database_id: testimonialsDbId,
    });

    const testimonials = results.map(testimonial => ({
      id: testimonial.id,
      name: testimonial.properties.name?.title[0]?.plain_text || "Anonymous",
      title: testimonial.properties.title?.rich_text[0]?.plain_text || "",
      company: testimonial.properties.company?.rich_text[0]?.plain_text || "",
      quote: testimonial.properties.quote?.rich_text[0]?.plain_text || "",
      avatar: testimonial.properties.avatar?.files[0]?.file?.url || testimonial.properties.avatar?.files[0]?.external?.url || "",
      featured: testimonial.properties.featured?.checkbox || false,
      order: testimonial.properties.order?.number || 0,
    }));

    return testimonials.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching testimonials from Notion:", error);
    return [];
  }
}

/**
 * Fetch work experience from Notion database
 * @returns {Promise<Array>} Array of work experience objects
 */
export async function fetchWorkExperience() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch work experience.");
    return [];
  }
  
  const workExperienceDbId = import.meta.env.VITE_WORK_EXPERIENCE_DB_ID;
  if (!workExperienceDbId) {
    console.warn("VITE_WORK_EXPERIENCE_DB_ID not found in .env file");
    return [];
  }

  try {
    const { results } = await notion.databases.query({
      database_id: workExperienceDbId,
      sorts: [
        {
          property: "startDate",
          direction: "descending",
        },
      ],
    });

    const workExperience = [];
    
    for (const job of results) {
      const title = job.properties.title?.title[0]?.plain_text || "Untitled Position";
      const company = job.properties.company?.rich_text[0]?.plain_text || "";
      const location = job.properties.location?.rich_text[0]?.plain_text || "";
      const startDate = job.properties.startDate?.date?.start || "";
      const endDate = job.properties.endDate?.date?.start || "Present";
      const period = `${startDate} - ${endDate}`;
      const skills = job.properties.skills?.multi_select.map(skill => skill.name) || [];
      
      // Fetch description blocks
      const descriptionBlocks = await n2m.pageToMarkdown(job.id);
      await delay(THROTTLE_DURATION); // Throttle to avoid rate limiting
      
      // Convert description blocks to array of strings
      const description = [];
      for (const block of descriptionBlocks) {
        if (block.type === 'paragraph' && block.parent.includes('•')) {
          description.push(block.parent.replace('• ', ''));
        }
      }
      
      workExperience.push({
        title,
        company,
        location,
        period,
        description,
        skills,
      });
    }
    
    return workExperience;
  } catch (error) {
    console.error("Error fetching work experience from Notion:", error);
    return [];
  }
}

/**
 * Fetch about page content from Notion database
 * @returns {Promise<Object>} About page content object
 */
export async function fetchAboutContent() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch about content.");
    return {
      title: "About me",
      paragraphs: [],
      profileImage: {
        src: "",
        alt: "",
      },
      socialLinks: [],
      email: {
        address: "",
        label: "",
      },
    };
  }
  
  const aboutDbId = import.meta.env.VITE_ABOUT_DB_ID;
  if (!aboutDbId) {
    console.warn("VITE_ABOUT_DB_ID not found in .env file");
    return {
      title: "About me",
      paragraphs: [],
      profileImage: {
        src: "",
        alt: "",
      },
      socialLinks: [],
      email: {
        address: "",
        label: "",
      },
    };
  }

  try {
    const { results } = await notion.databases.query({
      database_id: aboutDbId,
      filter: {
        property: "active",
        checkbox: {
          equals: true,
        },
      },
    });

    if (results.length === 0) {
      console.warn("No active about page content found in Notion database");
      return {
        title: "About me",
        paragraphs: [],
        profileImage: {
          src: "",
          alt: "",
        },
        socialLinks: [],
        email: {
          address: "",
          label: "",
        },
      };
    }

    const aboutPage = results[0];
    
    // Fetch content blocks
    const contentBlocks = await n2m.pageToMarkdown(aboutPage.id);
    await delay(THROTTLE_DURATION); // Throttle to avoid rate limiting
    
    // Convert content blocks to array of paragraphs
    const paragraphs = [];
    for (const block of contentBlocks) {
      if (block.type === 'paragraph' && block.parent.trim() !== '') {
        paragraphs.push(block.parent);
      }
    }
    
    // Extract social links
    const socialLinks = [];
    const socialLinksProperty = aboutPage.properties.socialLinks?.rich_text[0]?.plain_text || "[]";
    try {
      const parsedLinks = JSON.parse(socialLinksProperty);
      if (Array.isArray(parsedLinks)) {
        socialLinks.push(...parsedLinks);
      }
    } catch (e) {
      console.warn("Error parsing social links:", e);
    }
    
    return {
      title: aboutPage.properties.title?.title[0]?.plain_text || "About me",
      paragraphs,
      profileImage: {
        src: aboutPage.properties.profileImage?.files[0]?.file?.url || aboutPage.properties.profileImage?.files[0]?.external?.url || "",
        alt: aboutPage.properties.profileImageAlt?.rich_text[0]?.plain_text || "Profile Image",
      },
      socialLinks,
      email: {
        address: aboutPage.properties.email?.email || "",
        label: aboutPage.properties.emailLabel?.rich_text[0]?.plain_text || aboutPage.properties.email?.email || "",
      },
    };
  } catch (error) {
    console.error("Error fetching about page content from Notion:", error);
    return {
      title: "About me",
      paragraphs: [],
      profileImage: {
        src: "",
        alt: "",
      },
      socialLinks: [],
      email: {
        address: "",
        label: "",
      },
    };
  }
}
