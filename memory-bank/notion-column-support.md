# Notion Column Support Implementation

## Overview

This document details the implementation of Notion column support across the AstroNot site. The goal was to ensure that column-based content created in Notion is properly rendered in posts, projects, and the home hero section, maintaining the same visual structure and layout as in Notion.

## Implementation Details

### 1. Custom Transformers for NotionToMarkdown

Custom transformers were added to the NotionToMarkdown configuration in multiple files to handle column blocks:

#### In `src/astronot.js` (for blog posts):

```javascript
// Custom block transformers for column structure
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

// Custom transformer for column_list blocks
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
```

#### In `src/scripts/generate-hero-data.js` (for home hero content):

Similar custom transformers were added for column blocks, with additional transformers for heading blocks to ensure proper rendering:

```javascript
// Add support for heading blocks
n2m.setCustomTransformer("heading_1", async (block) => {
  const text = block.heading_1.rich_text.map(t => t.plain_text).join('');
  return `<h1>${text}</h1>`;
});

n2m.setCustomTransformer("heading_2", async (block) => {
  const text = block.heading_2.rich_text.map(t => t.plain_text).join('');
  return `<h2>${text}</h2>`;
});

n2m.setCustomTransformer("heading_3", async (block) => {
  const text = block.heading_3.rich_text.map(t => t.plain_text).join('');
  return `<h3>${text}</h3>`;
});

// Add support for image blocks
n2m.setCustomTransformer("image", async (block) => {
  const { image } = block;
  const imageUrl = image?.file?.url || image?.external?.url;
  const caption = image?.caption?.[0]?.plain_text || '';
  
  return `<img src="${imageUrl}" alt="${caption}" class="rounded-lg shadow-xl" />`;
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
```

#### In `src/helpers/notion.js` and `src/scripts/generate-project-files.js`:

Similar custom transformers were added to ensure consistent column rendering across all content types.

### 2. CSS Styles for Column Layout

CSS styles were added to `src/layouts/Layout.astro` to ensure proper rendering of columns:

```css
/* Notion columns */
.notion-columns {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 1rem 0;
}

@media (min-width: 768px) {
  .notion-columns {
    flex-direction: row;
  }
}

.notion-column {
  flex: 1;
  padding: 0 0.5rem;
}

/* Ensure headings in columns have proper spacing */
.notion-column h1,
.notion-column h2,
.notion-column h3 {
  margin-top: 0;
}

/* Responsive adjustments for small screens */
@media (max-width: 767px) {
  .notion-column {
    padding: 0;
  }
}
```

### 3. Component Updates

#### Updated `src/pages/home/_FeatureHero.svelte`:

The FeatureHero component was updated to properly render HTML content from Notion:

```svelte
{#if heroContent.content}
  <div class="max-w-screen-xl px-4 mx-auto">
    <div class="prose dark:prose-invert mt-12 format format-sm sm:format-base lg:format-lg format-blue dark:format-invert max-w-none">
      {@html heroContent.content}
    </div>
  </div>
{/if}
```

The key change was removing the `marked.parse()` call that was stripping HTML structure and using `{@html heroContent.content}` to directly render the HTML content.

### 4. MDX Configuration

Updated `astro.config.mjs` to ensure proper HTML rendering in MDX files:

```javascript
export default defineConfig({
  integrations: [
    mdx({
      remarkPlugins: [remarkGfm],
      rehypePlugins: [
        [rehypeStringify, { allowDangerousHtml: true }]
      ],
      extendMarkdownConfig: true
    }),
    // other integrations...
  ],
  // other config...
});
```

## Testing and Verification

The implementation was tested with various column layouts in Notion, including:

1. Two-column layouts with text and images
2. Columns with headings and paragraphs
3. Columns with different width ratios

All tests confirmed that the column structure is properly preserved when rendered on the website.

## Future Improvements

Potential future improvements to the column support include:

1. Support for nested columns (columns within columns)
2. Better handling of column width ratios
3. Enhanced mobile responsiveness for complex column layouts
4. Support for additional block types within columns (e.g., callouts, toggles)

## Conclusion

The implementation of Notion column support ensures that content creators can use Notion's column feature to create rich, multi-column layouts that will be properly rendered on the AstroNot site. This maintains design consistency between Notion and the website, providing a seamless content management experience.
