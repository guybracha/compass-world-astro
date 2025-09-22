import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://guybracha.github.io/compass-world-astro/', // הכתובת המלאה של הפרויקט
  base: '/compass-world-astro/', // תת-נתיב בריפו
  integrations: [react(), mdx(), sitemap()],
  output: 'static',
});
