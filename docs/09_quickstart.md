# Quickstart

This is an abbreviated fast-path guide to getting a Keely site up and running. It is intentionally condensed — if anything here is unclear or you need more detail, always refer to the full documentation in this folder. Every topic covered here has a dedicated full-length doc.

---

## Prerequisites Checklist

Before you start, make sure you have:

- [ ] **Git** — `git --version` to check. Install from [git-scm.com](https://git-scm.com).
- [ ] **Node.js 18+** — `node --version` to check. Install from [nodejs.org](https://nodejs.org).
- [ ] **A code editor** — VS Code recommended ([code.visualstudio.com](https://code.visualstudio.com)).
- [ ] **A deployment account** — Netlify recommended ([netlify.com](https://netlify.com)). Optional if working locally only.

Full details: `INSTALL.md`

---

## Minimal File Set

A working Keely site needs at minimum:

```
src/data/
  publisher.toml          ← your identity (name required)
  authors.toml            ← your author bio
  projects/
    my-project/
      project.toml        ← project metadata (title, genre, rating required)
      characters/
      places/
      groups/
      stories/
        my-story/
          story.toml      ← story metadata (title, genre, rating, content_warnings.required)
          scenes/
            01-my-scene/
              index.md    ← your first scene (type, status, narrative_mode required)
```

Copy everything from `template-files/` — all fields are annotated inline.

---

## Step by Step

**1. Clone the template**
```bash
git clone https://github.com/keely-app/keely-template my-project
cd my-project
npm install
```

**2. Fill in your publisher identity**
Open `src/data/publisher.toml` and set your `name`. Open `src/data/authors.toml` and fill in your author entry. Full details: `docs/01_your-first-project.md`

**3. Create your project**
Copy `template-files/projects/my-project/project.toml` into `src/data/projects/your-project-name/`. Set `title`, `genre`, `rating`, `author.name`, and both `license` fields. Create empty `characters/`, `places/`, `groups/`, and `stories/` folders inside your project folder.

**4. Create your story**
Copy `template-files/projects/my-project/stories/my-story/story.toml` into `src/data/projects/your-project-name/stories/your-story-name/`. Set `title`, `genre`, `rating`, `completion_status`, and `content_warnings.required`. Create a `scenes/` folder inside your story folder.

**5. Add your first entities**
Copy the relevant template from `template-files/` into a named folder inside `characters/`, `places/`, or `groups/`. Name the file `index.md`. Set `name`, `type`, and `project` at minimum. Full details: `docs/02_entities.md`

**6. Rebuild the entity index**
```bash
node src/scripts/build-entity-index.mjs
```
Run this every time you add or rename entities.

**7. Write your first scene**
Copy `template-files/projects/my-project/stories/my-story/scenes/my-first-scene/index.md` into a numbered folder inside your `scenes/` folder (e.g. `01-my-first-scene/`). Set `type: scene`, `status: drafting`, and `narrative_mode`. Write your prose below the closing `---`. Full details: `docs/04_writing-scenes.md`

**8. Run the dev server**
```bash
npm run dev
```
Open the local address shown in your terminal. Your site is running.

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
| `npm run dev` | Start the local dev server |
| `npm run build` | Run a full production build (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |
| `node src/scripts/build-entity-index.mjs` | Rebuild the entity index after adding or renaming entities |

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
