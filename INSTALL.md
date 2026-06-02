# Installing Keely

## Introduction

Keely is a static site generator for authors who publish serialized fiction
on the web. It produces a dual-pane reader site: prose on the left, a live
wiki on the right. Readers can click any character name, place, or group
in your story text and see the relevant wiki entry appear in the sidebar
without leaving the page.

The wiki is yours. You build it from plain markdown files — characters,
places, groups, whatever entities populate your world — and Keely
cross-references everything automatically at build time. Backlinks,
"appears in" lists, group rosters, location indexes: the generator
computes all of it from your files so you never have to maintain it
by hand.

Keely is built on three Commitments that shape every decision made in
its design and development.

### The Portability Guarantee

Your files are the source of truth. Keely is a thin, replaceable layer
on top of an open, human-readable file format. If Keely disappeared
tomorrow, every file you've written would remain fully readable in any
text editor, editable in any markdown tool, and movable to any other
platform without loss. No proprietary formats. No database lock-in.
No format rot.

### The Accessibility Principle

No author should ever need to open, read, or edit a config file to use
this tool. The files exist because they are the portability guarantee —
but the daily interface to those files will be the Phase 2 editor app.
Technical authors who prefer working directly in files can do so; that
path is a choice, not a requirement.

### Design and Build as We Mean to Continue

Every decision in Keely's design is made with the long term in mind.
No convenient shortcuts that become tomorrow's problems. No
architecture that works for one story but breaks for ten. If a feature
can't hold up across all phases of the platform, it doesn't ship.

---

Keely is built on [Astro](https://astro.build), a fast static site
generator. You don't need to know Astro to use Keely, but if you're
curious or want to dig deeper, the Astro documentation is excellent.

Keely is currently in **Phase 1** — the static site generator. You
manage your content directly in files, run a build command, and deploy
to the web. Phase 2 will wrap this in a desktop editor app for authors
who prefer a visual interface. Phase 3 will add reader interaction
features: comments, subscriptions, paywalls, and analytics.

For a full overview of what each phase delivers, see `REFERENCE.md`.

---

## Prerequisites

You'll need four things installed before you can run Keely. If you
already have all of these, skip ahead to **Get the Template**.

### Git

Git is version control software — it tracks changes to your files over
time and lets you download (clone) the Keely template from GitHub.

**Check if you have it:** open a terminal and type `git --version`.
If you see a version number, you're set.

**Install it:** download from [git-scm.com](https://git-scm.com) and
follow the installer for your operating system.

### Node.js

Node.js is the runtime that powers Keely's build process. You need
version 18 or higher.

**Check if you have it:** open a terminal and type `node --version`.
If you see `v18` or higher, you're set.

**Install it:** download from [nodejs.org](https://nodejs.org) and
choose the LTS (Long Term Support) version. The installer handles
everything.

### A Code Editor

You need a plain text editor to work with your content files. We
recommend **VS Code** ([code.visualstudio.com](https://code.visualstudio.com))
for its excellent markdown support, file tree navigation, and terminal
integration.

**Obsidian as a companion tool:** many Keely authors also use
[Obsidian](https://obsidian.md) alongside VS Code. Obsidian renders
your markdown files beautifully, supports wiki-links natively, and
makes navigating a large content vault fast and pleasant. You can
point Obsidian at your Keely content folder and use it as your
day-to-day writing environment while using VS Code for configuration
and build tasks.

Obsidian is free to download and use locally.

### A Deployment Account

To publish your site to the web you'll need an account with a hosting
provider. We recommend **Netlify** ([netlify.com](https://netlify.com))
for its simplicity — free tier, one-click deploys from GitHub, no
server management required.

**Alternatives:**
- **GitHub Pages** — free, slightly more configuration required.
  A GitHub account also doubles as your template source, so you may
  already have one.
- **Your own server** — if you're comfortable with web hosting and
  want full control, Keely's build output is a standard static site
  that deploys anywhere. See `docs/deployment.md` for details.

You don't need a deployment account to work locally — you can run
and preview your site on your own machine indefinitely.

---

## Get the Template

Open a terminal, navigate to the folder where you want your Keely
project to live, and run:

```bash
git clone https://github.com/keely-app/keely-template my-project
cd my-project
```

Replace `my-project` with whatever you want your project folder to
be called.

This gives you a complete copy of the Keely template — the generator,
all configuration, and the placeholder content files you'll replace
with your own.

---

## Install Dependencies

Inside your project folder, run:

```bash
npm install
```

This downloads the libraries Keely needs to build your site. It only
needs to run once (or again if you update Keely later). You'll see a
lot of output — that's normal. When it finishes and returns you to
the prompt, you're ready.

---

## Run the Dev Server

Start the local development server:

```bash
npm run dev
```

Open your browser and go to the local address shown in your terminal
— it will look something like `http://localhost:4321` (the specific number might be different). You should see
the placeholder Keely site — the template content running live on your machine.

The dev server watches your files for changes and updates the browser
automatically. Leave it running while you work.

To stop the server, press `Ctrl+C` in the terminal.

---

## What You're Looking At

Here's a quick map of the project folder so nothing feels mysterious.

```
my-project/
  src/
    data/          ← your content lives here (Phase 1 location)
      publisher.toml
      authors.toml
      projects/
        my-project/
          project.toml
          characters/
          places/
          groups/
          stories/
    pages/         ← the generator templates (you won't need to touch these)
    scripts/       ← build scripts (you won't need to touch these)
  public/          ← static assets (built output; do not edit directly)
  template-files/  ← annotated template files to copy when adding content
  docs/            ← documentation (you're reading one now)
  REFERENCE.md     ← quick reference for all fields and vocabularies
```

**The most important thing to know:** your content lives in `src/data/`.
That's where you'll spend most of your time. Everything else is the
generator — you don't need to touch it to publish your story.

The `template-files/` folder contains fully annotated copies of every
file type, with every field explained inline. Copy from there whenever
you're adding a new character, place, group, or scene.

---

## Next Steps

Your site is running. Now it's time to make it yours.

**→ Continue to `QUICKSTART.md`** to replace the placeholder content
with your own project, write your first scene, and deploy your site
to the web.

If you want to explore the file format in depth before diving in,
`REFERENCE.md` has everything: controlled vocabularies, field
references, folder conventions, and an explanation of how computed
fields work.
