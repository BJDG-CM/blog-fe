import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const base = process.env.PUBLIC_BASE_PATH ?? '/';
const site = process.env.PUBLIC_SITE_URL ?? 'https://example.github.io/repo';

export default defineConfig({
  site,
  base,
  integrations: [react()],
  // 뷰포트에 들어온 내부 링크를 미리 받아 이동을 즉시 느껴지게 한다.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
  build: {
    inlineStylesheets: 'auto',
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
    },
  },
  vite: {
    define: {
      'import.meta.env.PUBLIC_PRIVATE_MODE': JSON.stringify(
        process.env.PUBLIC_PRIVATE_MODE ?? 'false',
      ),
    },
  },
});
