# Tech Context

## Technologies Used
- **Astro**: A modern framework for building fast, content-focused websites.
- **Notion API**: Used for syncing Notion content with the website.
- **Flowbite**: A UI framework built on top of Tailwind CSS.
- **Svelte**: A front-end framework that compiles components to highly efficient vanilla JavaScript at build time.
- **Tailwind CSS**: A utility-first CSS framework for rapid UI development.
- **pnpm**: The package manager used for managing dependencies.
- **Vite**: The build tool used by Astro for fast development and optimized builds.
- **Sharp**: A high-performance image processing library.
- **Notion-to-MD**: A library for converting Notion content to Markdown.
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
- **Reading Time**: `^1.5.0`
- **Sharp**: `^0.33.4`
- **Lodash**: `^4.17.21`
- **Nanostores**: `^0.10.3`
- **Vite**: `^6.1.0`
- **Svelte Inspector**: `^4.0.1`

## Integration Points
- **Notion API**: Used for syncing Notion content with the website.
- **Flowbite**: Integrated with Tailwind CSS for UI components.
- **Svelte**: Used for interactive elements and dynamic content.
- **Tailwind CSS**: Used for styling the website.
- **Sharp**: Used for image optimization.
- **Notion-to-MD**: Used for converting Notion content to Markdown.
- **Reading Time**: Used for calculating reading time based on content length.
- **Lodash**: Used for common programming tasks.
- **Nanostores**: Used for state management in Svelte components.
- **Svelte Inspector**: Used for inspecting Svelte components in the browser.

## Development Workflow
- **Local Development**: Developers use `pnpm dev` to start the local development server.
- **Building**: The website is built using `pnpm build` for production.
- **Syncing Notion Content**: Notion content is synced using `pnpm sync`.
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
