import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import svelte from "@astrojs/svelte";
import { svelteInspector } from '@sveltejs/vite-plugin-svelte-inspector';

export default defineConfig({
  integrations: [react(), tailwind(), mdx(), svelte()],
  image: {
    remotePatterns: [{
      protocol: 'https',
      hostname: '**.unsplash.com'
    }]
  },
  vite: {
    assetsInclude: ['**/*.bmp'], // Allow importing image types not allowed by default
    plugins: [
      svelteInspector()
    ]
  }
});
