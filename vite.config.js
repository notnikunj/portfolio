import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// The site's text is rendered into index.html at build time from src/data/*.js,
// so every word is in the HTML before any JavaScript runs.
function injectContent() {
  let server = null;
  let root = process.cwd();
  const load = (path) => (server ? server.ssrLoadModule(path) : import(pathToFileURL(resolve(root, `.${path}`)).href));
  const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  return {
    name: 'inject-content',
    configResolved(config) {
      root = config.root;
    },
    configureServer(s) {
      server = s;
      s.watcher.on('change', (file) => {
        if (/[\\/]src[\\/](data|render)[\\/]/.test(file)) s.ws.send({ type: 'full-reload' });
      });
    },
    async transformIndexHtml(html) {
      const doc = await load('/src/render/doc.js');
      const { site } = await load('/src/data/site.js');
      return html
        .replace('<!--DOC-->', doc.renderDoc())
        .replace('<!--LEGEND-->', doc.renderLegend())
        .replace('<!--JSONLD-->', doc.renderJsonLd())
        .replaceAll('{{SITE_DESCRIPTION}}', attr(site.description));
    },
  };
}

export default defineConfig({
  // '/' because the site is served from the root of nikunjbhavsar.com.
  // If you ever deploy to https://<user>.github.io/<repo>/ without the custom domain,
  // build with: VITE_BASE=/<repo>/ npm run build
  base: process.env.VITE_BASE || '/',
  plugins: [injectContent()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});
