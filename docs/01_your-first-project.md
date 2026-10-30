# Your First Project

## Overview

This guide walks you through setting up your first Keely project from scratch — from your publisher identity all the way to a working local site with a project, a story, and your first entities.

Before you start, make sure Keely is installed and running on your machine. If you haven't done that yet, see `INSTALL.md`.

### Two file formats — and why

Keely uses two different file formats, each doing a different job.

**TOML files** (`.toml`) are configuration files. They tell the generator who you are, what your project is called, what genre it
belongs to, and how it should behave. TOML is designed to be easy for humans to read and write — it looks a lot like a simple list of
settings. You'll edit these files when you're setting up or changing your project's structure, but not during your day-to-day writing.

**Markdown files** (`.md`) are content files. They're where you write your scene prose, character descriptions, place histories, and group profiles. Markdown is plain text with a few simple conventions for formatting (a `#` makes a heading, `**text**` makes it bold). If you've used Obsidian, you're already writing markdown. These are the files you'll live in as an author.

The short version: TOML configures, markdown creates. When something feels like a setting, it's probably TOML. When something feels like
writing, it's probably markdown.

All template files — with every field annotated inline — live in the `template-files/` folder. Copy from there whenever you're creating
something new.

### Where your files live

Everything you write lives in two folders:

- **`src/content/projects/`** — one folder per project, holding everything it owns: `project.toml`, `characters/`, `places/`, `groups/`, any custom entity types, and `stories/`.
- **`src/data/`** — your site-wide settings: `publisher.toml` and `authors.toml`.

If you followed `INSTALL.md`, the starter site is already in both. This guide walks through each piece so you can make it your own.

---

## Setting Up Your Publisher Identity

Your publisher identity is the topmost layer of your Keely site — it's what readers see on your storefront home page and your about
page. It represents you, your press, or your pen name.

Two files drive this: `src/data/publisher.toml` and `src/data/authors.toml`.

### publisher.toml

Open `src/data/publisher.toml` in your editor. You'll find every field annotated with an explanation. At minimum, fill in:

- `name` — your display name, press name, or pen name. This is the only required field.

Everything else is optional. A storefront with just a name is perfectly valid — add more as you're ready.

A few fields worth knowing about:

- `tagline` — a one-liner shown beneath your name on the storefront.
- `storefront_blurb` — a welcome message for readers. Supports markdown.
- `projects_label` and `about_label` — the nav link labels on your storefront. Default to "Stories" and "About the Author" if omitted.

### authors.toml

Open `src/data/authors.toml`. This file declares all authors associated with your Keely instance — yourself, any co-authors, or
additional pen names you publish under.

Each `[[authors]]` entry is one person or pen name, with their own bio, portrait, and links. If you write under a pen name, give it its
own entry. If you co-author with someone, give them their own entry. Display order on the about page follows the order entries appear in
the file.

Fill in at minimum:

- `name` — your display name as it appears on the about page.

Optional but recommended:
- `bio` — your author bio. Supports markdown.
- `portrait` — your author photo or avatar. Place the image file in
  `src/data/` and reference it by filename only.
- `links` — your website, social profiles, newsletter, etc.

---

## Creating Your Project

A **project** in Keely is your creative world — the container that holds all your stories, characters, places, and groups. Think of it
as the top-level identity for an entire creative universe.

A project can contain:
- A single standalone novella or novel
- A series of books set in the same world
- A shared universe with multiple interconnected stories
- Serial arcs published over time under one umbrella
- Any combination of the above

You can have **multiple projects** in a single Keely instance — one for each creative world you maintain. Each project gets its own
landing page, its own entity wiki, and its own storefront card.

### Create the project folder

Inside `src/content/projects/`, create a folder for your project (or rename the starter's `my-project/`). The folder name becomes your
project's URL slug — use lowercase letters and hyphens, no spaces:

```
src/content/projects/my-project-name/
```

Choose a slug you won't want to change later. It appears in every URL on your site.

### Copy and fill in project.toml

Copy `template-files/content/projects/my-project/project.toml` into your new project folder. Open it and fill in the fields.

Required fields:
- `title` — your project's display title
- `genre` — choose one from the controlled vocabulary (see `docs/REFERENCE.md`)
- `rating` — choose one from the controlled vocabulary (see `docs/REFERENCE.md`)
- `author.name` — your name as it appears on this project
- `license.code` and `license.content` — how your work is licensed

Everything else is optional. A missing or unrecognized `genre` stops the build with a message naming the file; a missing or unrecognized
`rating` is reported as a warning in the terminal.

### Customizing your project

Keely gives you control over how your reader site looks and behaves. The `[reader_defaults]` section in `project.toml` lets you set
default behavior for content warning banners, author notes display, wiki sidebar state, and more. The `reader.css` file lets you
customize colors, fonts, and layout to match your project's identity.

These are entirely optional — Keely's defaults are designed to work well out of the box. See `docs/07_customization.md` for full details.

### Your entity folders

Characters, places, and groups live in the project folder, in `characters/`, `places/` and `groups/`. All of the project's stories share
them. You'll add entities in a later step.

---

## Creating Your First Story

A **story** is a single narrative work within your project. It has its own landing page, its own content warnings, its own rating, and
its own scenes. A project can contain as many stories as you need — one for each book in a series, one for each story in an anthology,
or just one if you're publishing a single work.

### Create the story folder

A story is one folder inside your project's `stories/` folder, holding its `story.toml` and its scenes:

```
src/content/projects/my-project-name/
  stories/
    my-story-name/
      story.toml
      scenes/
```

The folder name is the story's slug — lowercase and hyphens.

### Copy and fill in story.toml

Copy `template-files/content/projects/my-project/stories/my-story/story.toml` into the story's folder. Open it and fill in the fields.

Required fields:
- `title` — your story's display title
- `genre` — choose one from the controlled vocabulary
- `rating` — choose one from the controlled vocabulary
- `completion_status` — where the story is in its publication life
- `content_warnings.required` — a mandatory declaration (see below)

**A note on content warnings:** every story must declare exactly one value in `content_warnings.required`. This is intentional — "no
warnings apply" is a deliberate statement, not an oversight. Readers rely on this signal. Choose `no-warnings-apply` if nothing significant applies to your story. See `docs/REFERENCE.md` for the full vocabulary.

### The scenes folder

Scenes go in the story's `scenes/` folder. You'll add your first scene shortly.

### Flat vs. nested story structure

A story can be flat — just scenes — or grouped into chapters, and chapters into arcs. Use as much or as little structure as your story
calls for, in any order: a prologue chapter before your first arc, an interlude scene between chapters, an epilogue scene after the last
arc are all fine.

**Flat** — scenes only. Good for short works, novellas, or stories where you don't want visible chapter divisions:

```
my-project-name/stories/
  my-story/
    scenes/
      01-the-order/
      02-peters-office/
      03-the-fax/
```

**With chapters and arcs:**

```
my-project-name/stories/
  my-story/
    scenes/
      00_chapter-01-prologue/
        01-the-summons/
      01_arc-01-setup/
        01_chapter-02-the-evacuation-order/
          02-the-order/
          03-peters-office/
        03_chapter-03-breakdown/
          04-vodka-and-theories/
      04-epilogue/
```

**How the folder names work:**

- A **scene** folder starts with its number in the story: `02-the-order`. Scene numbers run straight through the whole story — they
  don't restart in each chapter.
- An **arc or chapter** folder has two numbers: `03_chapter-03-breakdown`. The second one (`chapter-03`) is the chapter's own number,
  the one readers see ("Chapter 03: Breakdown"). The **first** one (`03_`) only says where it sits: *after scene 3*. It's what makes the
  folders sort into reading order in Finder or Obsidian, and readers never see it.
- Two arcs or chapters in a row with no scene between them get a letter to keep them in order: `04_…`, `04a_…`.

You don't have to get these numbers right by hand. After adding or rearranging folders, run `npm run renumber -- my-project-name/my-story` to see
what would change, then `npm run renumber -- my-project-name/my-story --apply` to put every number in order (see `docs/04_writing-scenes.md`).

Container folders (arcs and chapters) don't contain an `index.md` — that file is what identifies a folder as a scene. To give an arc or
chapter a title different from its folder name, add a `_meta.toml` file inside it with `title = "Your Title"`.

See `docs/REFERENCE.md` for folder naming conventions and scene numbering details.

---

## Adding Your First Entities

Entities are the people, places, and groups that populate your world. Each entity is a **folder** containing a single `index.md` file —
and this structure is intentional. Because each entity is a folder, it can hold not just the entity's description but also its associated images (portrait, gallery images) right alongside it. Everything belonging to a character lives together in one place, just as everything belonging to a scene does.

The folder name is the entity's slug and becomes its URL.

### Create an entity folder

Inside the appropriate type folder in your project, create a named folder and add your `index.md` inside it:

```
src/content/projects/my-project-name/characters/
  angie-mcdonnell/
    index.md
    angie-portrait.jpg    ← images live here too
```

### Copy and fill in the entity file

Copy the relevant template from `template-files/` into your entity folder, name it `index.md`, and fill in the fields.

Required fields for all entities:
- `name` — the entity's canonical display name
- `type` — always `character`, `place`, or `group` (do not change)

Everything else is optional. Start with just a name and type if you want — you can fill in the rest as your story develops.

**Short names matter:** the `short_name` field controls what appears in the wiki sidebar when readers click an entity link in your prose. If your character's canonical name is "Angela McDonnell" but everyone calls her "Angie", set `short_name: "Angie"`. If omitted, the full `name` is used everywhere.

**Wiki-links:** entity files support wiki-links in their prose body using `[[entity-slug]]` syntax. A character's description can link
to a place, a place's description can link to a group. See `docs/REFERENCE.md` for full wiki-link syntax.

For full details on every entity field, see `docs/02_entities.md`.

---

## Running Your First Build

Once you have at least a `publisher.toml`, one project, and one story set up, you're ready to see your site.

If the dev server is already running (`npm run dev`), your changes appear automatically — just refresh the browser.

If it's not running, start it:

```bash
npm run dev
```

Then open the local address shown in your terminal.

### The entity index

Keely keeps an index of all your entities to power wiki-link resolution in scene prose, plus the "appears in" and backlink lists. `npm run
dev` and `npm run build` rebuild it every time they start, so there's normally nothing to do. If you add or rename an entity while the dev
server is running, stop it (`Ctrl+C`) and start it again so new wiki-links resolve. (`npm run index` rebuilds it on its own.)

### What to expect

Your storefront home page should show your publisher name and any projects you've created. Click through to your project to see its
landing page, and from there to your story.

If something isn't showing up, check the terminal for warning messages — the build logs missing required fields and other issues in plain language.

---

## Next Steps

Your project is set up and running locally. From here:

**→ `docs/04_writing-scenes.md`** — add your first scene and start publishing prose to your reader site.

**→ `docs/02_entities.md`** — full details on every field for characters, places, and groups, including how computed fields like "appears in" and group rosters work.

**→ `docs/07_customization.md`** — colors, fonts, reader defaults, and how to make your site feel like yours.

**→ `docs/08_deployment.md`** — when you're ready to put your site on the web.
