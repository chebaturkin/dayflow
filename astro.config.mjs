import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://chebaturkin.github.io',
  base: '/dayflow',
  output: 'static',
  devToolbar: { enabled: false },
});
