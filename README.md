# Keely

A static site generator for serialized fiction with integrated wiki developed and shared by KimBoo York.

**STATUS**: Version 0.8

Keely turns plain markdown files into a dual-pane reader site — prose on the left, live wiki entries on the right, with character and place names clickable throughout the story text.

**→ Start here: [START-HERE.md](START-HERE.md)**

## Quick links
- [Installation guide](INSTALL.md)
- [Documentation](docs/09_quickstart.md)
- [Starter site / template files](template-files/)

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
