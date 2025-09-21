import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  integrations: [mdx(), sitemap()],
  site: 'https://guybracha.github.io', // עדכן ל־דומיין הסופי
  output: 'static',
  scopedStyleStrategy: 'where', // CSS מודרני ונוח
  vite: {
    ssr: { external: ['gsap'] },
  },
});
