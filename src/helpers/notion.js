import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { config } from 'dotenv';
import { delay } from './delay.mjs';

// Load ENV Variables
config();

// Check if Notion API key is available
console.log("=== NOTION INITIALIZATION ===");
const NOTION_KEY = import.meta.env.VITE_NOTION_KEY;
console.log("VITE_NOTION_KEY:", NOTION_KEY ? "Present (length: " + NOTION_KEY.length + ")" : "Missing");

// Initialize Notion client if API key is available
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

// Initialize NotionToMarkdown with column support
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
    },
    image: (block) => {
      // Special handling for images
      const { type } = block;
      const value = block[type];
      
      // Get image URL based on type
      let imageUrl = '';
      if (value.type === 'external') {
        imageUrl = value.external.url;
      } else if (value.type === 'file') {
        imageUrl = value.file.url;
      }
      
      // Get caption if available
      const caption = value.caption && value.caption.length > 0 
        ? value.caption[0].plain_text 
        : '';
      
      // Return image tag with proper component import
      return {
        type: 'image',
        parent: `<Image src="${imageUrl}" alt="${caption}" />`,
      };
    }
  }
});

// Rate limiting helper
const THROTTLE_DURATION = 334; // ms - Notion API has a rate limit of 3 requests per second

/**
 * Fetch author data from Notion database
 * @returns {Promise<Object|null>} Author data object or null if not available
 */
export async function fetchAuthor() {
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch author data.");
    return null;
  }
  
  const authorDbId = import.meta.env.VITE_AUTHOR_DB_ID;
  if (!authorDbId || authorDbId === 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
    console.warn("Valid VITE_AUTHOR_DB_ID not found in .env file");
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
  console.log("fetchHomeHero called");
  
  if (!notion) {
    console.warn("Notion client not initialized. Cannot fetch home hero content.");
    return null;
  }
  
  const homeHeroDbId = import.meta.env.VITE_HOME_HERO_DB_ID;
  console.log("Home Hero DB ID:", homeHeroDbId);
  
  if (!homeHeroDbId) {
    console.warn("VITE_HOME_HERO_DB_ID not found in .env file");
    return null;
  }

  try {
    console.log("Querying Notion database:", homeHeroDbId);
    
    const { results } = await notion.databases.query({
      database_id: homeHeroDbId,
      filter: {
        property: "active",
        checkbox: {
          equals: true
        }
      },
      page_size: 1
    });

    console.log("Query results:", results);

    if (results.length === 0) {
      console.warn("No active home hero content found in Notion database");
      return null;
    }

    const heroPage = results[0];
    console.log("Hero page properties:", heroPage.properties);
    
    const heroContent = {
      title: heroPage.properties.title?.title[0]?.plain_text || "",
      subtitle: heroPage.properties.subtitle?.rich_text[0]?.plain_text || "",
      description: heroPage.properties.introParagraph?.rich_text[0]?.plain_text || "",
      ctaButton: {
        text: heroPage.properties.ctaTitle?.rich_text[0]?.plain_text || "Learn More",
        url: heroPage.properties.ctaLink?.url || "#",
        target: "_blank"
      },
      secondaryCtaButton: {
        text: heroPage.properties["CTA Secondary Title"]?.rich_text[0]?.plain_text || "",
        url: heroPage.properties.secondaryCtaLink?.rich_text[0]?.plain_text || "#",
        target: "_blank"
      },
      profileImage: {
        src: heroPage.properties.imageUrl?.url || heroPage.properties.imageUrl?.rich_text[0]?.plain_text || "",
        alt: heroPage.properties.imageAlt?.rich_text[0]?.plain_text || "Hero Image"
      }
    };
    
    console.log("Hero content:", heroContent);
    return heroContent;
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

/**
 * Fetch services from Notion database
 * @returns {Promise<Array>} Array of service objects
 */
export async function fetchServices() {
  console.log("=== FETCH SERVICES FUNCTION CALLED ===");
  
  // Check if Notion client is initialized
  if (!notion) {
    console.error("ERROR: Notion client not initialized. NOTION_KEY:", NOTION_KEY ? "Present" : "Missing");
    return [];
  }
  
  // Check if services database ID is provided
  const servicesDbId = import.meta.env.VITE_SERVICES_DB_ID;
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
 * Fetch testimonials from Notion database
 * @returns {Promise<Array>} Array of testimonial objects
 */
export async function fetchTestimonials() {
  console.log("Fetching testimonials from Notion...");
  
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
    console.log("Querying testimonials database:", testimonialsDbId);
    
    // Test if the Notion client is working by making a simple request
    try {
      console.log("Testing Notion client with a simple request...");
      const user = await notion.users.me();
      console.log("Notion client is working for testimonials. User:", user.name);
    } catch (testError) {
      console.error("ERROR: Notion client test failed for testimonials:", testError);
      return [];
    }
    
    const response = await notion.databases.query({
      database_id: testimonialsDbId,
    });
    
    console.log("Testimonials query response:", response);
    const { results } = response;
    console.log("Testimonials query results count:", results.length);

    if (results.length === 0) {
      console.warn("No testimonials found in Notion database");
      return [];
    }

    const testimonials = [];
    
    for (const testimonial of results) {
      try {
        // Log the raw properties for debugging
        console.log("Raw testimonial properties:", JSON.stringify(testimonial.properties, null, 2));
        
        // In this database, the quote is in the title field, and name is in rich_text
        // Log the property names we're using
        console.log(`Available properties: ${Object.keys(testimonial.properties).join(', ')}`);
        
        // Get the name from the name rich_text property
        const name = testimonial.properties.name?.rich_text?.[0]?.plain_text || "Anonymous";
        console.log(`Extracted name: ${name}`);
        
        // Get position/title if available
        const title = testimonial.properties.position?.rich_text?.[0]?.plain_text || 
                     testimonial.properties.title?.rich_text?.[0]?.plain_text || 
                     "";
        console.log(`Extracted title: ${title}`);
        
        // Get company if available
        const company = testimonial.properties.company?.rich_text?.[0]?.plain_text || 
                       testimonial.properties.organization?.rich_text?.[0]?.plain_text || 
                       "";
        console.log(`Extracted company: ${company}`);
        
        // Get the quote from the title property (which is named "quote" in the database)
        const quote = testimonial.properties.quote?.title?.[0]?.plain_text || "";
        console.log(`Extracted quote: ${quote}`);
        
        // Avatar handling
        let avatar = "";
        if (testimonial.properties.avatar?.files?.length > 0) {
          const avatarFile = testimonial.properties.avatar.files[0];
          avatar = avatarFile.file?.url || avatarFile.external?.url || "";
        }
        console.log(`Extracted avatar: ${avatar ? "Present" : "None"}`);
        
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
      } catch (error) {
        console.error("Error processing testimonial:", error);
      }
    }

    console.log("Final testimonials count:", testimonials.length);
    return testimonials.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching testimonials from Notion:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
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
