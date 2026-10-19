# Quickstart

This is an abbreviated fast-path guide to getting a Keely site up and running. It is intentionally condensed — if anything here is unclear or you need more detail, always refer to the full documentation in this folder. Every topic covered here has a dedicated full-length doc.

---

## Prerequisites Checklist

Before you start, make sure you have:

- [ ] **Git** — `git --version` to check. Install from [git-scm.com](https://git-scm.com).
- [ ] **Node.js 22.12+** — `node --version` to check. Install from [nodejs.org](https://nodejs.org).
- [ ] **A code editor** — VS Code recommended ([code.visualstudio.com](https://code.visualstudio.com)).
- [ ] **A deployment account** — Netlify recommended ([netlify.com](https://netlify.com)). Optional if working locally only.

Full details: `INSTALL.md`

---

## Minimal File Set

A working Keely site needs at minimum:

```
src/
  content/                    ← your writing, organized by type
    characters/               ← one folder per character (optional)
    places/
    groups/
    stories/
      my-story/
        scenes/
          01-my-scene/
            index.md          ← a scene (type, status, narrative_mode required)
  data/                       ← your settings
    publisher.toml            ← your identity (name required)
    authors.toml              ← your author bio
    genres.json, ratings.json, warnings-vocabulary.json  ← vocabularies; leave as they are
    projects/
      my-project/
        project.toml          ← project metadata (title, genre, rating required)
        stories/
          my-story/
            story.toml        ← story metadata (title, genre, rating, content_warnings.required)
```

The story folder name (`my-story`) appears twice, once under `content/` for its scenes and once under `data/` for its settings, and must match. `template-files/` contains exactly this set, every field annotated inline.

---

## Step by Step

**1. Clone Keely and copy in the starter site**
```bash
git clone https://github.com/kimboosan/keely-app my-site
cd my-site
npm install
cp -R template-files/content template-files/data src/
```

**2. Fill in your publisher identity**
Open `src/data/publisher.toml` and set your `name`. Open `src/data/authors.toml` and fill in your author entry. Full details: `docs/01_your-first-project.md`

**3. Make the project yours**
Rename `src/data/projects/my-project/` to your project's slug (lowercase, hyphens), e.g. `my-novel`. In its `project.toml`, set `title`, `genre`, `rating`, `author.name`, and both `license` fields.

**4. Make the story yours**
Rename the story folder in **both** places to your story's slug: `src/data/projects/<project>/stories/my-story/` and `src/content/stories/my-story/`. In `story.toml`, set `title`, `genre`, `rating`, `completion_status`, and `content_warnings.required`.

**5. Add your entities**
Rename or copy the starter folders in `src/content/characters/`, `places/`, and `groups/`. Each entity is a folder named with its slug, containing an `index.md`. Set `name`, `type`, and `project` (your project's slug) at minimum. Full details: `docs/02_entities.md`

**6. Write your first scene**
Edit `src/content/stories/<story>/scenes/01-my-first-scene/index.md`, or copy it into a new numbered folder (e.g. `02-the-next-scene/`). Set `type: scene`, `status: drafting`, and `narrative_mode`. Write your prose below the closing `---`. Full details: `docs/04_writing-scenes.md`

**7. Run the dev server**
```bash
npm run dev
```
Open the local address shown in your terminal. Your site is running, with a yellow **PREVIEW** bar across the top as a reminder that only you can see it.

**8. Added or renamed an entity while the dev server is running?**
Stop it with `Ctrl+C` and run `npm run dev` again, so its wiki-links resolve. (`npm run dev` and `npm run build` rebuild Keely's entity index each time they start.)

**9. Publish a scene**
When a scene is ready for readers, set `status: published` in its frontmatter. Add `first_published_date`, `last_published_date` (both set to today), and `word_count`.

**10. Build and deploy**
```bash
npm run build
```
Drag and drop the `dist/` folder onto your Netlify site. Full details: `docs/08_deployment.md`

---

## Common Commands

| Command | What it does |
|---|---|
| `npm run dev` | Rebuild the entity index, then start the local dev server |
| `npm run build` | Rebuild the entity index, then run a full production build (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run index` | Rebuild the entity index and relationships on their own |

---

## Full Documentation by Topic

| Topic | File |
|---|---|
| Installation and setup | `INSTALL.md` |
| Your first project, story, and entities | `docs/01_your-first-project.md` |
| Characters, places, and groups | `docs/02_entities.md` |
| Images | `docs/03_images.md` |
| Writing and publishing scenes | `docs/04_writing-scenes.md` |
| Content warnings | `docs/05_content-warnings.md` |
| Navigation and threads | `docs/06_navigation-and-threads.md` |
| Customization and CSS | `docs/07_customization.md` |
| Deployment | `docs/08_deployment.md` |
| Field reference, vocabularies, folder conventions | `docs/REFERENCE.md` |
