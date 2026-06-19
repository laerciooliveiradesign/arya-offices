import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aryaoffices.com.br',
  trailingSlash: 'ignore',
  build: {
    inlineStylesheets: 'auto',
    assets: '_astro',
  },
});
