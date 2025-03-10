// This file exports static data generated during the build process

// Import static data files with try-catch blocks
let testimonials = [];
try {
  testimonials = (await import('./testimonials.json')).default;
} catch (error) {
  console.warn('Failed to load testimonials data:', error);
}

let heroContent = {};
try {
  heroContent = (await import('./hero.json')).default;
} catch (error) {
  console.warn('Failed to load hero data:', error);
}

let services = [];
try {
  services = (await import('./services.json')).default;
} catch (error) {
  console.warn('Failed to load services data:', error);
}

let socialLinks = [];
try {
  socialLinks = (await import('./social-links.json')).default;
} catch (error) {
  console.warn('Failed to load social links data:', error);
}

let workExperience = [];
try {
  workExperience = (await import('./work-experience.json')).default;
} catch (error) {
  console.warn('Failed to load work experience data:', error);
}

let author = {};
try {
  author = (await import('./author.json')).default;
} catch (error) {
  console.warn('Failed to load author data:', error);
}

// Export data for use in components
export { 
  testimonials, 
  heroContent, 
  services, 
  socialLinks, 
  workExperience, 
  author 
};
