# AstroNot

<b>AstroNot</b> is a fully customizable site builder powered by Astro & Notion: [astronot.dev](https://astronot.dev)

Write, Edit, and Publish directly from Notion with total control over the website and design!

![](public/images/astronot-homepage-screenshot.png?raw=true)
![](public/images/astronot-blog-screenshot.png?raw=true)
![](public/images/astronot-post-screenshot.png?raw=true)

## 🙋🏼 Why AstroNot?

There are plenty of good options for turning your Notion content into a website, such as `super.so`. Why AstroNot?

First of all, AstroNot is 100% open-source and free. You can self host on a variety of platforms, such Vercel and Netlify, or for free on Github Pages. `super.so`, is $16/month _(without analytics)_!

Other popular Notion site builders allow for some limited customization such as changing fonts and logos, but are inherently based on Notion's layout; this is great if you want to design your entire site in Notion and mirror it to the web! However, if you want to design your own site with full control while still using Notion as a Content Management Solution for content such as blog posts and articles, that's where AstroNot shines!

AstroNot exports Notion content into MarkdownX, which can be styled and customized however you like. Since AstroNot only syncs Notion content to the `/posts` route, the entire website is available to modify, including the HTML, styling, and scripts.

AstroNot is built for performance from the ground up. Images are fetched and optimized at build time, resulting in page loads much faster than the native Notion pages! AstroNot also supports Chrome's new `View Transitions` API, resulting in smooth navigation transitions and page animations in supported environments.

Use the included Flowbite UI or Svelte components to design a landing page, marketing site, or portfolio. Or, feel free to BYOF _(Bring Your Own Framework)_ and add your own React or Vue components. The sky is the limit!

## 📡 Technology

Space requires **FAST** speeds, so AstroNot is built for performance with the **FAST** stack:

- **Flowbite**: Flowbite is a UI Framework which is built on top of Tailwind CSS. It's a collection of design elements, components, and layouts, helping to build pixel-perfect responsive websites and apps faster and easier. Flowbite can be used with all of the popular frameworks (React, Svelte, Vue, etc), or with no framework at all.

- **Astro**: Astro builds fast content sites, powerful web applications, dynamic server APIs, and everything in-between; pages are pre-rendered on the server so adding extra frameworks and large libraries will only slow users if hydrated to client for interactivity (using `client:load`, etc). AstroNot is built on Astro v5.4, which offers a host of new powerful features including enhanced `View Transitions` and improved `Image Optimization`.

- **Svelte**: Svelte describes itself as "cybernetically enhanced web apps". Svelte is not just a front-end UI framework, but also a compiler - which means that deployed web applications can remain lightweight and fast, without large Javascript bundle sizes required of other frameworks such as React. Svelte pairs perfectly with Astro and `nanostores`.

- **Tailwind**: Tailwind is utility-first CSS framework packed with classes like `flex`, `pt-4`, `text-center` and `rotate-90` that can be composed to build any design, directly in your markup. Tailwind used to power all of the Flowbite components included in AstroNot, as well as many other available Tailwind based UI libraries (such as TailwindUI) that are also compatible out of the box with AstroNot.

### 📦 Package Manager

AstroNot includes `pnpm` out of the box, and supports `bun`! Feel free to replace with your favorite package manager of choice.

### 🎨 Animations

- Includes Tailwind Animated library out of the box: [https://www.tailwindcss-animated.com/](https://www.tailwindcss-animated.com/)
  - Just add classes such as `wiggle`, `rotate-x`, `jump-out`, `bounce`, `fade-left`, or `flip-down`.
- Svelte animations: [https://svelte.dev/docs/svelte-animate](https://svelte.dev/docs/svelte-animate)
- View Transition support via Astro. Use `transition:name` to animate elements between page loads.

### ↝ MarkdownX processing

- Uses `notion-to-md` under the hood for converting Notion to Markdown
- `/src/notion.js` contains the Notion sync and transform code. Perform any alterations to Post layout and logic in this file.

## 👏🏼 Notion Features

- Tag support: Syncs tags with your posts, including color!
- Automatically generate Table of Content based on document. Supports nested headings.
- Images optimized based on view resolution at build time. High resolution images will be converted to the best format and size for the layout.
- **Efficient Timestamp Tracking**: Only sync content that has been updated since the last sync, reducing API calls and sync time.
- **Enhanced Notion Integration**: Optional integration with multiple Notion databases for dynamic content:
  - Author database for managing blog post author information
  - Projects database for showcasing your work
  - Services database for listing your offerings
  - Testimonials database for displaying client feedback
  - Categories database for organizing content
  - Social links database for your social media presence
  - Work Experience database for your professional history
  - About page content database for your personal information
  - Social Links database for managing social media links across the site
  - Home Hero database for customizing the homepage hero section
  - Site Settings database for managing global site settings (title, logo, favicon, meta tags, etc.)

### 🆕 New Features

1. **Improved Social Media Integration**
   - Streamlined social media icons using flowbite-svelte-icons v2.0.3
   - Support for GitHub, Twitter/X, and LinkedIn icons
   - Automatic icon validation during build process

2. **Enhanced Image Processing**
   - Automatic image optimization and WebP conversion
   - Multiple responsive sizes generated for each image
   - Improved error handling for Notion image downloads
   - Automatic retry mechanism for failed image downloads

3. **Build System Improvements**
   - Comprehensive build process documentation
   - Pre-build validation checks
   - Post-build verification steps
   - Automatic content synchronization with Notion
   - Improved error reporting and logging

4. **Developer Experience**
   - New build instructions in memory-bank
   - Clearer error messages for common issues
   - Streamlined deployment process
   - Better handling of environment variables

5. **Performance Optimizations**
   - Improved image loading and optimization
   - Better handling of social media icons
   - Reduced bundle size through icon optimization
   - Enhanced build-time optimizations

## ⚙️ Notion Setup

- [Clone this Notion CMS starter template](https://jsonmartin.notion.site/aea5cd29dea84e77b14f2f7c769eeb61?v=57943f457a0b44cfbcac2aaf75d2fa38&pvs=4)
- Create a Notion "internal" integration and get the API secret key
- Copy the database ID from the cloned Database _(open in browser; the database ID is in the URL for the database on Notion's website, before the `?v=` and after the last `/`)_
- For enhanced Notion integration, see the [notion-setup.md](notion-setup.md) file for detailed instructions on setting up additional databases

## 🚀 Installation

- Clone this repo
- Install with your package manager of choice _(`pnpm`, `bun`, etc...)_: `pnpm install`
- Move `.env.example` to `.env` and add your Notion API key and database ID
- Run `pnpm sync` to sync Notion Content for the first time
- Run `pnpm dev` to start development server

## 🔄 Notion Sync System

AstroNot includes an efficient timestamp tracking system that only syncs content that has been updated since the last sync, reducing API calls and sync time.

### Sync Commands

```bash
# Sync all content from Notion
npm run sync:notion

# Alias for sync:notion
npm run sync:all

# Sync specific content types
npm run sync:published  # Sync published posts
npm run sync:projects   # Sync projects
npm run sync:services   # Sync services
npm run sync:testimonials # Sync testimonials
npm run sync:hero      # Sync hero content
npm run sync:categories # Sync categories
npm run sync:social-links # Sync social links
npm run sync:work-experience # Sync work experience
npm run sync:author    # Sync author information
npm run sync:about     # Sync about page content
npm run sync:images    # Sync images from Notion
```

### How Timestamp Tracking Works

The timestamp tracking system maintains timestamps for:

1. **Collections**: Each content type (services, testimonials, posts, etc.) has a collection timestamp that records when it was last synced.

2. **Individual Items**: Each item (post, project, service, etc.) has its own timestamp that records when it was last updated.

When syncing content:

1. The system checks the last sync time for the collection.
2. It only fetches items from Notion that have been updated since that time.
3. After processing each item, it updates the item's timestamp.
4. After processing all items in a collection, it updates the collection timestamp.

This approach significantly reduces the number of API calls to Notion and speeds up the sync process, especially for sites with a lot of content.

### Deployment with Nixpacks

AstroNot includes a `nixpacks.toml` configuration file for easy deployment on platforms that support Nixpacks (like Railway). The configuration:

1. Sets up the environment with Node.js and pnpm
2. Installs dependencies
3. Runs the generate command to build the site
4. Serves the static files from the dist folder

To deploy:
1. Ensure your environment variables (NOTION_KEY, DATABASE_ID) are set on your hosting platform
2. Push your code - the nixpacks configuration will automatically:
   - Install dependencies
   - Run the build process
   - Start serving your site from the dist folder

### Install to an existing project

- To set up AstroNot with an existing `Astro` project, install the following dependencies:

  ```bash
  pnpm install -D flowbite dotenv image-type notion-to-md reading-time rimraf @notionhq/client tinycolor2 tailwind-merge sharp
  ```

- Add `mdx` support to your `Astro` project: `pnpm astro add mdx`
- Add the following scripts to `package.json`'s `scripts` section:

  ```json
  "sync": "rimraf src/pages/posts/_ && node src/astronot.js",

  "sync:published": "rimraf src/pages/posts/_ && node src/astronot.js --published",

  "generate": "rimraf dist/\*_ && ([ -d 'dist' ] || mkdir dist) && ([ -d 'dist/images' ] || mkdir dist/images) && ([ -d 'src/pages/posts' ] || mkdir src/pages/posts) && ([ -d 'src/images' ] || mkdir src/images) && ([ -d 'src/images/posts' ] || mkdir src/images/posts) && rimraf src/pages/posts/_ && node src/astronot.js --published && astro build"
  ```

- Add `src/astronot.js` and `src/helpers/*.mjs` from the current latest version of the `main` branch to your project

- Add `NOTION_KEY` and `DATABASE_ID` to `.env` file

- Run `pnpm run generate` to scaffold and generate a production build based off latest Notion API data.

  - **Note: this command should be run on deploy, instead of `build` for platforms such as Netlify and Vercel**. `astro build` only builds the web files, but does not sync and generate posts from Notion.
  - **This is required to run for first time setup**.

- Run `pnpm sync` to sync Notion Content directly without triggering a web build

- Optionally add `Tags`, `TableOfContents`, or `LatestPosts` components to your project library

- Add a `PostLayout.astro` template, and create a page to display the posts in the `/src/pages/posts` to get started!

### Starter Template

- All of the built-in content here is available for reference, but can be modified or deleted
  - Parallax components show how to add interactive svelte components
  - `DarkMode` and `Hyperdark` components demonstrate how to use `nanostores` for data peristence with `Svelte`
  - Various examples using different Astro hydration techniques, such as `client:load`, `client:visible`, and `client:idle`.
- Alternatively, there is a more lightweight `starter` branch with extra content removed (there are still a few removable components, such as is a Contact form for implementation reference)

### Get Started!

Start by replacing with your own content & design. Create new pages by adding a new `.astro` file to `/src/pages`!
_Note: With Astro, components will not ship any Javascript to client unless `client:load` or `client:only` are used for interactivity._

## 🔄 Configuration Files

AstroNot now includes configuration files for various components of the website:

- `src/config/about.ts`: Configuration for the about page content
- `src/config/contact.ts`: Configuration for the contact form
- `src/config/email.ts`: Configuration for email functionality
- `src/config/hero.ts`: Configuration for the homepage hero section
- `src/config/resume.ts`: Configuration for the resume timeline
- `src/config/services.ts`: Configuration for the services section
- `src/config/testimonials.ts`: Configuration for the testimonials section

These configuration files make it easy to customize the content of your website without having to modify the components directly. They also serve as fallbacks when Notion integration is not set up or when a specific Notion database ID is not provided.

## Performance

- AstroNot receives a **100** on Lighthouse Desktop and **99** for Lighthouse Mobile tests on sample Blog Posts:

  ![](/public/images/lighthouse-desktop.png?raw=true)
  ![](/public/images/lighthouse-mobile.png?raw=true)

## 🏗️ Project Structure

```text
/
├── public/
├── src/
│   └── pages/
│       └── posts/   <-- Notion content lives here
│   ├── components/
│   ├── config/      <-- Configuration files
│   ├── helpers/     <-- Helper functions
│   ├── layouts/
│   │   └── Layout.astro
│   │   └── PostLayout.astro
│   │   └── _Navbar.svelte
│   │   └── _Footer.svelte
└── package.json
```

AstroNot looks for `.astro`, `.md.` or `.mdx` files in the `src/pages/` directory. Each page is exposed as a route based on its file or folder name. A page can be one `.astro` file, or a folder containing many components; if using a subfolder inside `/pages` or `layout`, all component filenames must be prefixed `_`, such as `/pages/home/_Features.[astro,svelte,jsx,etc...]` and the main file should be called `index.astro`.

There's nothing special about `src/components/`, but that's where we like to put any Astro or React/Vue/Svelte/Preact components. It's recommended to use this location if sharing components.

Any static assets, like images, can be placed in the `public/` directory. Images which are to be optimized need to be placed inside `/src/images`, as they need to be imported during Astro's build process.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                                |
| :------------------------ | :---------------------------------------------------- |
| `npm install`             | Installs dependencies                                 |
| `npm run dev`             | Starts local dev server at `localhost:4321`           |
| `npm run build`           | Build your production site to `./dist/`               |
| `npm run preview`         | Preview your build locally, before deploying          |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check`      |
| `npm run astro -- --help` | Get help using the Astro CLI                          |
| **`npm run sync`**        | **Download & Transform Notion content into `/posts`** |
| **`npm run generate`**    | **Sync Published posts & generate production build**  |

## 🔄 Automatic Publish Deploys

You can use webhooks or automated platforms such as `Make` or `Zapier` to automatically trigger deploys on compatible platforms such as `Netlify`.

[make.com](https://make.com/) currently offers 1,000 operations / month, which is more than enough for most use cases to automate publishing for a small blog. To enable, simply connect Make to Notion and watch for any changes to your content database, and connect to trigger Netlify deploy action (which will automatically build a new site based off of the latest content from Notion); this can be set up to run as often as every 15 minutes.

- [ ] TODO: Add Tutorial Video
