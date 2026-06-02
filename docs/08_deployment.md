# Deployment

## Overview

Deploying your Keely site means taking the files the generator builds and putting them on a web server so readers can access them. Keely's build output is a standard static site — a folder of HTML, CSS, and JavaScript files that any web host can serve.

There are three deployment paths to choose from:

- **Netlify** — recommended. Free tier, simple setup, no server management required.
- **GitHub Pages** — free alternative, slightly more configuration required.
- **Self-hosted** — for experienced users who want full control over their hosting environment.

You don't need to deploy to work on your site locally. You can run and preview your site on your own machine indefinitely using `npm run dev`. Deploy when you're ready for readers.

---

## Before You Deploy

### Run a production build

The dev server (`npm run dev`) is optimized for fast local development, not for production. Before deploying, run a full production build to catch any issues:

```bash
npm run build
```

This runs the entity index builder, the scene image copy script, and the Astro production build in sequence. The output lands in the `dist/` folder at your project root.

Check the terminal output for any warnings — missing required fields, unresolved wiki-links, or missing alt text will appear here. Fix any issues before deploying.

### Preview the production build locally

You can preview the production build locally before deploying:

```bash
npm run preview
```

Open the local address shown in your terminal and check that everything looks right. This is the closest approximation to what readers will see.

---

## Deploying to Netlify

Netlify is the recommended deployment target for Keely. It offers a generous free tier, simple setup, and handles everything from SSL certificates to global CDN distribution automatically.

### First deployment

1. Create a free account at [netlify.com](https://netlify.com) if you don't have one.
2. From your Netlify dashboard, click **Add new site → Deploy manually**.
3. Run `npm run build` in your project folder to generate the `dist/` folder.
4. Drag and drop the `dist/` folder onto the Netlify deploy area.
5. Netlify will give you a URL (something like `random-name.netlify.app`) where your site is live.

### Updating your site

Each time you want to push updates to your live site:

1. Make your changes in your content files.
2. Run `npm run build`.
3. Drag and drop the new `dist/` folder onto your Netlify site's deploy area.

### Custom domain

If you have your own domain name, you can connect it to your Netlify site from the site settings under **Domain management**. Netlify handles SSL automatically.

---

## Deploying to GitHub Pages

GitHub Pages is a free hosting service built into GitHub. It requires a GitHub account and a repository for your project.

### Setup

1. Create a GitHub account at [github.com](https://github.com) if you don't have one.
2. Create a new repository for your Keely project.
3. Push your project files to the repository.
4. In your repository settings, go to **Pages** and set the source to the `dist/` folder on your main branch, or configure a GitHub Actions workflow to run the build automatically on push.

GitHub Pages serves your site at `yourusername.github.io/repository-name` by default. Custom domains are supported.

### Updating your site

Push your updated files to GitHub. If you've set up a GitHub Actions workflow, the build and deploy happen automatically. If not, run `npm run build` locally and push the updated `dist/` folder manually.

---

## Self-Hosted

If you're comfortable managing your own web server, Keely's build output is a standard static site that deploys anywhere that can serve HTML files — Apache, Nginx, Caddy, or any other static file server.

Run `npm run build` to generate the `dist/` folder, then copy its contents to your server's web root. No server-side processing is required — Keely sites are entirely static.

For specific server configuration, environment setup, or advanced deployment pipelines, refer to the [Astro deployment documentation](https://docs.astro.build/en/guides/deploy/) which covers a wide range of hosting targets in detail.

---

## Updating Your Site

The ongoing publishing workflow is the same regardless of your deployment target:

1. Write or edit your content files in Obsidian or VS Code.
2. If you've added or renamed entities, rebuild the entity index: `node src/scripts/build-entity-index.mjs`
3. Run a production build: `npm run build`
4. Deploy the updated `dist/` folder to your host.

The Phase 2 editor app will consolidate steps 2–4 into a single "build and deploy" button.

---

## Next Steps

Your site is live. From here, the ongoing work is writing — adding scenes, expanding your wiki, and building your reader community.

**→ `QUICKSTART.md`** — a condensed version of this entire documentation set for authors who want a fast path from install to live site.
