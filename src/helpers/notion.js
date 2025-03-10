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
 * Fetch author data from Notion database
 * @returns {Promise<Object>} Author data object
 */
export async function fetchAuthor() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch author data.");
    return null;
  }
  
  const authorDbId = import.meta.env.VITE_AUTHOR_DB_ID;
  if (!authorDbId) {
    console.warn("VITE_AUTHOR_DB_ID not found in .env file");
    return null;
  }

  try {
    const { results } = await notion.databases.query({
      database_id: authorDbId,
      filter: {
        property: "active",
        checkbox: {
          equals: true
        }
      },
      page_size: 1
    });

    if (results.length === 0) {
      console.warn("No active author found in Notion database");
      return null;
    }

    const authorPage = results[0];
    
    return {
      name: authorPage.properties.name?.title[0]?.plain_text || "",
      bio: authorPage.properties.bio?.rich_text[0]?.plain_text || "",
      avatar: authorPage.properties.avatar?.files[0]?.file?.url || authorPage.properties.avatar?.files[0]?.external?.url || ""
    };
  } catch (error) {
    console.error("Error fetching author data from Notion:", error);
    return null;
  }
}

/**
 * Fetch site settings from Notion database
 * @returns {Promise<Object>} Site settings object
 */
export async function fetchSiteSettings() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch site settings.");
    return null;
  }
  
  const siteSettingsDbId = import.meta.env.VITE_SITE_SETTINGS_DB_ID;
  if (!siteSettingsDbId) {
    console.warn("VITE_SITE_SETTINGS_DB_ID not found in .env file");
    return null;
  }

  try {
    const { results } = await notion.databases.query({
      database_id: siteSettingsDbId,
      filter: {
        property: "active",
        checkbox: {
          equals: true
        }
      },
      sorts: [
        {
          property: "updatedAt",
          direction: "descending"
        }
      ],
      page_size: 1
    });

    if (results.length === 0) {
      console.warn("No active site settings found in Notion database");
      return null;
    }

    const settingsPage = results[0];
    
    return {
      title: settingsPage.properties.title?.title[0]?.plain_text || "",
      logo: settingsPage.properties.logo?.files[0]?.file?.url || settingsPage.properties.logo?.files[0]?.external?.url || "",
      favicon: settingsPage.properties.favicon?.files[0]?.file?.url || settingsPage.properties.favicon?.files[0]?.external?.url || "",
      description: settingsPage.properties.description?.rich_text[0]?.plain_text || "",
      metaTags: settingsPage.properties.metaTags?.rich_text[0]?.plain_text || "",
      metaKeywords: settingsPage.properties.metaKeywords?.rich_text[0]?.plain_text || ""
    };
  } catch (error) {
    console.error("Error fetching site settings from Notion:", error);
    return null;
  }
}

/**
 * Fetch home hero content from Notion database
 * @returns {Promise<Object>} Home hero content object
 */
export async function fetchHomeHero() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch home hero content.");
    return null;
  }
  
  const homeHeroDbId = import.meta.env.VITE_HOME_HERO_DB_ID;
  if (!homeHeroDbId) {
    console.warn("VITE_HOME_HERO_DB_ID not found in .env file");
    return null;
  }

  try {
    const { results } = await notion.databases.query({
      database_id: homeHeroDbId,
      filter: {
        property: "active",
        checkbox: {
          equals: true
        }
      },
      sorts: [
        {
          property: "updatedAt",
          direction: "descending"
        }
      ],
      page_size: 1
    });

    if (results.length === 0) {
      console.warn("No active home hero content found in Notion database");
      return null;
    }

    const heroPage = results[0];
    
    return {
      title: heroPage.properties.title?.title[0]?.plain_text || "",
      subtitle: heroPage.properties.subtitle?.rich_text[0]?.plain_text || "",
      description: heroPage.properties.introParagraph?.rich_text[0]?.plain_text || "",
      ctaButton: {
        text: heroPage.properties.ctaTitle?.rich_text[0]?.plain_text || "Learn More",
        url: heroPage.properties.ctaLink?.url || "#",
        target: "_blank"
      },
      secondaryCtaButton: {
        text: heroPage.properties.secondaryCtaTitle?.rich_text[0]?.plain_text || "",
        url: heroPage.properties.secondaryCtaLink?.url || "#",
        target: "_blank"
      },
      profileImage: {
        src: heroPage.properties.imageUrl?.url || heroPage.properties.imageUrl?.rich_text[0]?.plain_text || "",
        alt: heroPage.properties.imageAlt?.rich_text[0]?.plain_text || "Hero Image"
      }
    };
  } catch (error) {
    console.error("Error fetching home hero content from Notion:", error);
    return null;
  }
}

/**
 * Fetch social links from Notion database
 * @returns {Promise<Array>} Array of social link objects
 */
export async function fetchSocialLinks() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch social links.");
    return [];
  }
  
  const socialLinksDbId = import.meta.env.VITE_SOCIAL_LINKS_DB_ID;
  if (!socialLinksDbId) {
    console.warn("VITE_SOCIAL_LINKS_DB_ID not found in .env file");
    return [];
  }

  try {
    const { results } = await notion.databases.query({
      database_id: socialLinksDbId,
      sorts: [
        {
          property: "order",
          direction: "ascending"
        }
      ]
    });

    const socialLinks = results.map(link => ({
      id: link.id,
      name: link.properties.name?.title[0]?.plain_text || "Untitled Link",
      url: link.properties.url?.url || "#",
      icon: link.properties.icon?.rich_text[0]?.plain_text || "",
      iconType: link.properties.iconType?.select?.name || "custom", // 'custom' or 'component'
      order: link.properties.order?.number || 0,
      active: link.properties.active?.checkbox || true
    }));

    return socialLinks.filter(link => link.active).sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching social links from Notion:", error);
    return [];
  }
}

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
    
    // Fetch social links from dedicated database if available
    let socialLinks = [];
    try {
      socialLinks = await fetchSocialLinks();
    } catch (e) {
      console.warn("Error fetching social links from database:", e);
      
      // Fallback to parsing from the about page property
      const socialLinksProperty = aboutPage.properties.socialLinks?.rich_text[0]?.plain_text || "[]";
      try {
        const parsedLinks = JSON.parse(socialLinksProperty);
        if (Array.isArray(parsedLinks)) {
          socialLinks = parsedLinks;
        }
      } catch (e) {
        console.warn("Error parsing social links from about page:", e);
      }
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
