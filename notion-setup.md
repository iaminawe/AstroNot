# Notion Setup Guide for Enhanced Integration

This guide provides detailed instructions on how to set up Notion databases for enhanced integration with AstroNot. The enhanced integration allows you to manage various aspects of your website directly from Notion, including projects, services, testimonials, work experience, and about page content.

## Prerequisites

Before setting up the Notion databases, make sure you have:

1. A Notion account
2. Created a Notion integration and obtained an API key
   - Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
   - Click "New integration"
   - Give it a name (e.g., "AstroNot Integration")
   - Select the capabilities required (Read content, Update content, Insert content)
   - Click "Submit" to create the integration
   - Copy the "Internal Integration Token" (this is your `NOTION_KEY`)

## Environment Variables

Add the following environment variables to your `.env` file:

```
# Notion API Key
VITE_NOTION_KEY='your_notion_api_key_here'

# Notion Database IDs
VITE_PROJECTS_DB_ID='your_projects_database_id_here'
VITE_SERVICES_DB_ID='your_services_database_id_here'
VITE_TESTIMONIALS_DB_ID='your_testimonials_database_id_here'
VITE_WORK_EXPERIENCE_DB_ID='your_work_experience_database_id_here'
VITE_ABOUT_DB_ID='your_about_database_id_here'
```

> **Note**: If you don't want to use a specific Notion database, simply omit the corresponding environment variable. The website will fall back to using the configuration files in the `src/config` directory.

## Setting Up Notion Databases

### 1. Projects Database

This database is used to showcase your work on the projects page.

1. Create a new database in Notion
2. Add the following properties:
   - `title` (Title): The title of the project
   - `description` (Text): A brief description of the project
   - `coverImage` (Files & Media): The cover image for the project
   - `url` (URL): The URL to the project (optional)
   - `tags` (Multi-select): Tags for the project
   - `featured` (Checkbox): Whether the project should be featured
   - `order` (Number): The order in which the project should appear

3. Share the database with your integration:
   - Click "Share" in the top right corner of the database
   - Click "Invite" and search for your integration name
   - Click "Invite"

4. Copy the database ID from the URL:
   - The database ID is the part of the URL after the last `/` and before the `?`
   - Example: `https://www.notion.so/myworkspace/1234567890abcdef1234567890abcdef?v=...`
   - In this example, the database ID is `1234567890abcdef1234567890abcdef`

5. Add the database ID to your `.env` file as `VITE_PROJECTS_DB_ID`

### 2. Services Database

This database is used to display your services on the website.

1. Create a new database in Notion
2. Add the following properties:
   - `title` (Title): The title of the service
   - `description` (Text): A brief description of the service
   - `icon` (Text): The icon to use for the service (e.g., "CodeOutline")
   - `url` (URL): The URL to more information about the service (optional)
   - `category` (Select): The category of the service (e.g., "Learn", "Strategize", "Execute")
   - `categoryIcon` (Text): The icon to use for the category (optional)
   - `order` (Number): The order in which the service should appear

3. Share the database with your integration
4. Copy the database ID and add it to your `.env` file as `VITE_SERVICES_DB_ID`

### 3. Testimonials Database

This database is used to display client testimonials on the website.

1. Create a new database in Notion
2. Add the following properties:
   - `name` (Title): The name of the client
   - `title` (Text): The title/position of the client
   - `company` (Text): The company of the client
   - `quote` (Text): The testimonial quote
   - `avatar` (Files & Media): The avatar image of the client (optional)
   - `featured` (Checkbox): Whether the testimonial should be featured
   - `order` (Number): The order in which the testimonial should appear

3. Share the database with your integration
4. Copy the database ID and add it to your `.env` file as `VITE_TESTIMONIALS_DB_ID`

### 4. Work Experience Database

This database is used to display your work experience on the about page.

1. Create a new database in Notion
2. Add the following properties:
   - `title` (Title): The job title
   - `company` (Text): The company name
   - `location` (Text): The location of the job
   - `startDate` (Date): The start date of the job
   - `endDate` (Date): The end date of the job (leave empty for current jobs)
   - `skills` (Multi-select): Skills used in the job

3. For each job entry, add bullet points in the content area to describe your responsibilities and achievements
   - Each bullet point should start with a bullet character (•)
   - These will be extracted as the job description

4. Share the database with your integration
5. Copy the database ID and add it to your `.env` file as `VITE_WORK_EXPERIENCE_DB_ID`

### 5. About Page Content Database

This database is used to manage the content of the about page.

1. Create a new database in Notion
2. Add the following properties:
   - `title` (Title): The title of the about page
   - `profileImage` (Files & Media): The profile image
   - `profileImageAlt` (Text): The alt text for the profile image
   - `email` (Email): Your email address
   - `emailLabel` (Text): The label for the email link
   - `socialLinks` (Text): A JSON array of social links (see format below)
   - `active` (Checkbox): Whether this about page content is active

3. For the `socialLinks` property, use the following JSON format:
   ```json
   [
     {
       "name": "Twitter",
       "url": "https://twitter.com/yourusername",
       "icon": "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"
     },
     {
       "name": "GitHub",
       "url": "https://github.com/yourusername",
       "icon": "M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
     }
   ]
   ```

4. In the content area of the database entry, add paragraphs of text that will be used as the about page content

5. Share the database with your integration
6. Copy the database ID and add it to your `.env` file as `VITE_ABOUT_DB_ID`

## Using the Enhanced Notion Integration

Once you have set up the Notion databases and added the environment variables, the website will automatically fetch data from Notion when it is built or when the development server is started.

If a specific Notion database ID is not provided or if there is an error fetching data from Notion, the website will fall back to using the configuration files in the `src/config` directory.

This approach provides flexibility and ensures that the website works even without Notion integration.

## Troubleshooting

If you encounter issues with the Notion integration, check the following:

1. Make sure the Notion API key is correct
2. Make sure the database IDs are correct
3. Make sure the databases are shared with your integration
4. Make sure the database properties match the expected format
5. Check the console for error messages

If you continue to experience issues, you can disable the Notion integration for specific components by removing the corresponding environment variables from your `.env` file. The website will then use the configuration files in the `src/config` directory as fallbacks.
