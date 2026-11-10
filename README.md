# Keely

A static site generator for serialized fiction with integrated wiki developed and shared by KimBoo York.

**STATUS**: Version 0.8.1

Keely turns plain markdown files into a dual-pane reader site — prose on the left, live wiki entries on the right, with character and place names clickable throughout the story text.

**→ Start here: [START-HERE.md](START-HERE.md)**

## Quick links
- [Installation guide](INSTALL.md)
- [Documentation](docs/09_quickstart.md)
- [Starter site / template files](template-files/)

## Updating from 0.8
**Folder names carry the numbers readers see.** Arcs are `arc-02-crisis`, chapters `chapter-03-what-comes-next`, scenes
`09-whats-going-on`, all numbered straight through the story. For scenes in between — a prologue, an interlude, an epilogue — there's
a new **interlude** folder, named after what it follows: `arc-01.1-quiet-night`, `chapter-03.1-a-letter-home`. See
`docs/01_your-first-project.md`.

**A scene's address and links use its name, not its number:** `09-whats-going-on/` is at `…/scenes/whats-going-on/` and linked as
`[[whats-going-on]]`. Renumbering never breaks a link again. This changes the web address of every scene page once, with this update,
so a link someone saved to a single scene stops working; links to a story's page don't. Old links in your prose (`[[03-the-fax]]`) still
work.

After pulling the update, bring each story's folders up to date:

```bash
npm run renumber -- my-project/my-story            # shows every change, touching nothing
npm run renumber -- my-project/my-story --apply    # makes them
```

It renames arc, chapter and scene folders and updates links written with a scene's number, and puts everything back if anything goes
wrong. Stories of scenes alone don't need it. If a story uses 0.7's any-order freedom — a scene after an arc's chapters, or a chapter
before the first arc — it stops and says so, changing nothing. Such a story still builds and reads as before; only renumbering it waits for a later version.

**Also new:**
- Only `published` scenes go into a real build (`npm run build`); `npm run dev` still shows your drafts.
- Arcs, chapters and interludes have pages of their own, with an optional summary, rating and tags in their `_meta.toml`.
- Tags on projects, stories and arcs; `featuring` lists entries under **Featured In** (handy for relationships or pairings).
- Optional settings in `publisher.toml`: a notice before Mature or Explicit stories (`adult_notice`), and asking search engines not to
  list your site (`hide_from_search_engines`).
- A site in a subfolder (such as GitHub Pages) works: set its address in `keely-hosting.toml`. See `docs/08_deployment.md`.
- Breadcrumbs in the page header; entity scene lists grouped by story.
- **Check your scenes' cast and location fields:** `pov_character`, `characters_in_scene`, `scene_location` and `also_at` hold slugs
  without brackets (`angie-mcdonnell`). The docs used to show `"[[angie-mcdonnell]]"`, which never worked there; the build now names
  any scene that still has it.

## Updating from 0.7
0.8 puts everything a project owns in one folder: `src/content/projects/my-project/` now holds the project's settings, its characters,
places and groups, and its stories and their scenes. `src/data/` keeps only what's site-wide. Two projects can now use the same story or
character names. Your writing doesn't change, and neither do your site's page addresses; inline scene images gain the project in their
address, which only matters if you've linked straight to one from somewhere else.

After pulling the update, move your folder to the new layout:

```bash
npm run migrate-layout             # shows every change, touching nothing
npm run migrate-layout -- --apply  # makes them
```

It copies your old folders to `Keely History/before-layout-update/` first, and puts everything back if anything goes wrong. The generator
only reads the new layout, so do this before your next build. `npm run renumber` and `npm run restructure` now take the project too:
`npm run renumber -- my-project/my-story`.

Also new: web links open in a new tab with a ↗, `[[project/slug]]` links reach another project's entities, and custom entity types have
their own reader pages.

## License
Code: MIT — see [LICENSE](LICENSE)
File format specification: CC0 — see [CONTENT-LICENSE](CONTENT-LICENSE)
