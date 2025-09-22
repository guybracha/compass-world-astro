import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://guybracha.github.io',   // ✅ רק הדומיין
  base: '/compass-world-astro/',         // ✅ תת-הנתיב של הריפו
  trailingSlash: 'always',               // מומלץ ל-GitHub Pages (נתיבי /folder/)
  integrations: [react(), mdx(), sitemap()],
  output: 'static',
})
