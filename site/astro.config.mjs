import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const base = process.env.PUBLIC_BASE_PATH ?? '/';
const site = process.env.PUBLIC_SITE_URL ?? 'https://example.github.io/repo';

export default defineConfig({
  site,
  base,
  integrations: [react()],
  markdown: {
    shikiConfig: {
      theme: 'github-dark'
    }
  },
  vite: {
    define: {
      'import.meta.env.PUBLIC_PRIVATE_MODE': JSON.stringify(process.env.PUBLIC_PRIVATE_MODE ?? 'false')
    }
  }
});
