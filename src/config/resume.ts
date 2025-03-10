export interface WorkExperience {
  title: string;
  company: string;
  location: string;
  period: string;
  description: string[];
  skills: string[];
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  period: string;
  description?: string;
}

export interface ResumeData {
  name: string;
  title: string;
  summary: string;
  workExperience: WorkExperience[];
  education: Education[];
  skills: {
    category: string;
    items: string[];
  }[];
}

export const resumeData: ResumeData = {
  name: "Gregg Coppen",
  title: "Senior Web Developer & AI Consultant",
  summary: "Creative professional with over two decades of experience in web development, design, and animation. Specializing in crafting powerful scalable platforms that meet technical demands while captivating users through intuitive design and engaging experiences.",
  workExperience: [
    {
      title: "AI Implementation Consultant",
      company: "AI Solutions Inc.",
      location: "Vancouver, BC",
      period: "2023 - Present",
      description: [
        "Lead AI strategy and implementation for enterprise clients across education, government, and business sectors.",
        "Developed custom agent platforms tailored to unique organizational needs, resulting in 30% efficiency improvements.",
        "Conducted workshops and training sessions to facilitate AI adoption and integration into existing workflows."
      ],
      skills: ["AI Strategy", "LLM Implementation", "Agent Development", "Prompt Engineering", "Technical Consulting"]
    },
    {
      title: "Senior Web Developer",
      company: "Digital Innovations",
      location: "Vancouver, BC",
      period: "2019 - 2023",
      description: [
        "Led development of complex e-commerce platforms and multi-site Drupal networks for enterprise clients.",
        "Implemented modern front-end frameworks (React, Svelte) to create responsive, accessible user interfaces.",
        "Mentored junior developers and established coding standards and best practices across the organization."
      ],
      skills: ["React", "Svelte", "Drupal", "JavaScript", "TypeScript", "CSS/SASS", "Responsive Design"]
    },
    {
      title: "UX/UI Designer & Developer",
      company: "Creative Solutions",
      location: "London, UK",
      period: "2015 - 2019",
      description: [
        "Created comprehensive design systems for web and mobile applications using Figma and Framer.",
        "Developed front-end components and animations that enhanced user engagement and conversion rates.",
        "Collaborated with cross-functional teams to ensure seamless integration of design and development."
      ],
      skills: ["Figma", "Framer", "UI/UX Design", "Front-end Development", "Animation", "Design Systems"]
    },
    {
      title: "Founder & Creative Director",
      company: "iaminawe",
      location: "London, UK",
      period: "2010 - 2015",
      description: [
        "Founded and led a creative agency specializing in web development and digital branding.",
        "Managed client relationships and project delivery for startups, nonprofits, and established businesses.",
        "Oversaw all aspects of design and development, ensuring high-quality deliverables and client satisfaction."
      ],
      skills: ["Project Management", "Client Relations", "Business Development", "Web Development", "Branding"]
    },
    {
      title: "Web Developer",
      company: "Digital Media Agency",
      location: "Durban, South Africa",
      period: "2005 - 2010",
      description: [
        "Developed websites and interactive media for a diverse portfolio of clients.",
        "Specialized in creating engaging user experiences through innovative design and functionality.",
        "Collaborated with designers and content creators to deliver cohesive digital products."
      ],
      skills: ["HTML/CSS", "JavaScript", "PHP", "WordPress", "Flash Animation"]
    }
  ],
  education: [
    {
      degree: "Bachelor of Arts in Graphic Design",
      institution: "Durban University of Technology",
      location: "Durban, South Africa",
      period: "2001 - 2005",
      description: "Focused on digital media, interactive design, and web development."
    },
    {
      degree: "Certificate in Advanced Web Development",
      institution: "London School of Digital Marketing",
      location: "London, UK",
      period: "2011",
      description: "Specialized training in modern web technologies and frameworks."
    }
  ],
  skills: [
    {
      category: "Development",
      items: ["JavaScript", "TypeScript", "React", "Svelte", "Astro", "Node.js", "PHP", "Drupal", "WordPress"]
    },
    {
      category: "Design",
      items: ["UI/UX Design", "Figma", "Framer", "Adobe Creative Suite", "Design Systems", "Responsive Design", "Animation"]
    },
    {
      category: "AI & Emerging Tech",
      items: ["AI Implementation", "LLM Integration", "Prompt Engineering", "Agent Development", "API Integration"]
    },
    {
      category: "Soft Skills",
      items: ["Project Management", "Client Relations", "Team Leadership", "Technical Writing", "Public Speaking", "Mentoring"]
    }
  ]
};
