# Keely

A static site generator for serialized fiction with integrated wiki developed and shared by KimBoo York.

**STATUS**: Version 0.7

Keely turns plain markdown files into a dual-pane reader site — prose on the left, live wiki entries on the right, with character and place names clickable throughout the story text.

**→ Start here: [START-HERE.md](START-HERE.md)**

## Quick links
- [Installation guide](INSTALL.md)
- [Documentation](docs/09_quickstart.md)
- [Starter site / template files](template-files/)

## Updating from 0.6
0.7 lets scenes, chapters and arcs sit in any order — a prologue chapter before your first arc, an epilogue scene after the last — by
adding a small position marker to arc and chapter folder names (`02_arc-01-evacuation`). Scene folders, links and web addresses don't
change. After pulling the update, for each story with arcs or chapters:

```bash
npm run renumber -- your-story            # see what will change
npm run renumber -- your-story --apply    # update the folder names
```

Stories that haven't been updated keep working as before. Also new: links to pages that don't exist yet show as faded "not yet" links
instead of leading to a missing page, and arc and chapter titles from `_meta.toml` now appear on the reader site.

## License
Code: MIT — see [LICENSE](LICENSE)
File format specification: CC0 — see [CONTENT-LICENSE](CONTENT-LICENSE)
