import { defineConfig } from 'astro/config';

const SITE_URL = process.env.SITE_URL ?? 'http://localhost:4321';
const BASE_PATH = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  output: 'static',
  build: {
    assets: '_assets',
    inlineStylesheets: 'auto',
  },
});
