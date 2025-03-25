# Tech Context

## Technologies Used
- **Astro**: A modern framework for building fast, content-focused websites.
- **Notion API**: Used for syncing Notion content with the website.
- **AWS S3**: Cloud storage for optimized images with CDN capabilities.
- **AWS SDK**: JavaScript SDK for interacting with AWS services.
- **Flowbite**: A UI framework built on top of Tailwind CSS.
- **Svelte**: A front-end framework that compiles components to highly efficient vanilla JavaScript at build time.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **pnpm**: The package manager used for managing dependencies.
- **Vite**: The build tool used by Astro for fast development and optimized builds.
- **Sharp**: A high-performance image processing library for optimization and format conversion.
- **Notion-to-MD**: A library for converting Notion content to Markdown.
- **Marked**: A markdown parser and compiler for rendering Markdown content consistently.
- **Reading Time**: A library for calculating reading time based on content length.
- **Lodash**: A utility library for common programming tasks.
- **Nanostores**: A state management library for Svelte.
- **Svelte Inspector**: A plugin for inspecting Svelte components in the browser.

## Development Setup
- **IDE**: Visual Studio Code (VSCode) is the primary IDE used for development.
- **Version Control**: Git is used for version control, with GitHub as the remote repository.
- **CI/CD**: A CI/CD pipeline is set up for automated testing, building, and deployment.
- **Environment Variables**: Environment variables are used to manage configuration settings, ensuring that sensitive information is not hard-coded.

## Technical Constraints
- **Notion API Limits**: The Notion API has rate limits and usage quotas that need to be managed.
- **Efficient Data Syncing**: The timestamp tracking system ensures only updated content is fetched from Notion, reducing API calls and sync time.
- **Performance**: The website needs to be optimized for performance, with fast page loads and smooth navigation transitions.
- **Security**: The website needs to be secure, with proper authentication, authorization, and data protection measures in place.
- **Compatibility**: The website needs to be compatible with different browsers and devices.

## Dependencies
- **Astro**: `^5.3.0`
- **Flowbite**: `^0.47.4`
- **Svelte**: `^5.20.1`
- **Tailwind CSS**: `^3.4.3`
- **Notion API**: `^2.2.15`
- **Notion-to-MD**: `^4.0.8`
- **Marked**: `^11.1.1`
- **Reading Time**: `^1.5.0`
- **Sharp**: `^0.33.4`
- **Lodash**: `^4.17.21`
- **Nanostores**: `^0.10.3`
- **Vite**: `^6.1.0`
- **Svelte Inspector**: `^4.0.1`

## Data Architecture
- **Static Content**: Blog posts and projects are served from static MDX files
- **Static Data**: JSON files in `src/data` directory store:
  - Author information
  - Services
  - Testimonials
  - Categories
  - Work Experience
  - About content
  - Social Links
  - Home Hero content
- **Image Storage**:
  - Images stored in AWS S3
  - Optimized and converted to WebP
  - Multiple responsive sizes
  - CDN-ready delivery
  - Local cleanup after S3 upload
  - Manifest tracking for sync status
- **Notion Integration**:
  - Notion API is used only during build process
  - Generates static JSON files from Notion databases
  - Handles image migration to S3
  - Site Settings currently uses hardcoded defaults

## Integration Points
- **AWS S3**: Integrated for image storage and delivery
  - Automatic image upload and optimization
  - CDN-ready delivery
  - Configurable caching and permissions
  - Local cleanup after upload
- **Sharp**: Used for image processing
  - WebP conversion
  - Multiple responsive sizes
  - Quality optimization
  - Format conversion
- **Flowbite**: Integrated with Tailwind CSS for UI components
- **Svelte**: Used for interactive elements and dynamic content
- **Tailwind CSS**: Used for styling the website
- **Notion-to-MD**: Used for converting Notion content to Markdown during build
- **Marked**: Used for rendering Markdown content consistently
- **Reading Time**: Used for calculating reading time based on content length
- **Lodash**: Used for common programming tasks
- **Nanostores**: Used for state management in Svelte components
- **Svelte Inspector**: Used for inspecting Svelte components in the browser

## Development Workflow
- **Local Development**: Developers use `pnpm dev` to start the local development server.
- **Building**: The website is built using `pnpm build` for production.
- **Syncing Notion Content**: Notion content is synced using `npm run sync:notion` or its alias `npm run sync:all`, with timestamp tracking to only sync updated content.
- **Individual Content Syncing**: Specific content types can be synced individually using commands like:
  - `npm run sync:services` - Sync services
  - `npm run sync:testimonials` - Sync testimonials
  - `npm run sync:images` - Sync images to S3
  - `npm run sync:images:s3` - Force sync all images to S3
- **Image Processing Workflow**:
  1. Images are downloaded from Notion
  2. Processed and optimized using Sharp
  3. Uploaded to S3 with proper caching headers
  4. Local copies are cleaned up
  5. Content references are updated to S3 URLs
- **Generating Production Build**: The production build is generated using `pnpm generate`.

## Testing and Quality Assurance
- **Unit Tests**: Unit tests are written for critical components and functions.
- **Integration Tests**: Integration tests are written to ensure that different parts of the system work together correctly.
- **End-to-End Tests**: End-to-end tests are written to simulate user interactions and ensure that the website works as expected.
- **Code Quality**: Code quality is maintained using linting and formatting tools.

## Deployment
- **CI/CD Pipeline**: The CI/CD pipeline is used for automated testing, building, and deployment.
- **Environment Variables**: Environment variables are used to manage configuration settings.
- **Monitoring**: The website is monitored for performance and uptime, with alerts set up for critical issues.

## Performance
- **Lighthouse Scores**: AstroNot receives a **100** on Lighthouse Desktop and **99** for Lighthouse Mobile tests on sample Blog Posts.
- **Image Optimization**: Images are fetched and optimized at build time, resulting in page loads much faster than the native Notion pages.
- **View Transitions**: AstroNot supports Chrome's new `View Transitions` API, resulting in smooth navigation transitions and page animations in supported environments.
