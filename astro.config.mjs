// @ts-check
import { defineConfig } from 'astro/config';
import { markdownOptions } from './src/utils/markdown.mjs';
import { VAULT } from './src/utils/vault.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://your-site-url.com',
  // Astro's developer toolbar is a tool for site developers; on the
  // preview server it would sit on top of an author's preview (D-153).
  devToolbar: { enabled: false },
  // Shared with entity pages, which render their descriptions themselves
  // (src/utils/markdown.mjs).
  markdown: markdownOptions,
  vite: {
    // `@vault` lets pages glob the author's images wherever the vault lives
    // (import.meta.glob only accepts literal paths — an alias is the one way
    // to point it somewhere decided at runtime). fs.allow lets the dev
    // server serve those files when the vault is outside this folder (D-148).
    resolve: { alias: { '@vault': `${VAULT}/src` } },
    server: { fs: { allow: ['.', VAULT] } },
  },
});
