# Keely — Start Here

Keely is a static site generator for authors who publish serialized fiction on the web. It produces a dual-pane reader site: prose on the left, a live wiki on the right. Readers can click any character, place, or group name in your story text and see the relevant wiki entry appear in the sidebar without leaving the page. Your content lives in plain markdown and TOML files on your own machine — Keely is a thin, replaceable layer on top of them.

Full documentation, tutorials, and updates live at **keely-app.com**.

---

## The Three Commitments

Every decision in Keely's design is shaped by three core Commitments:

**The Portability Guarantee** — Your files are the source of truth. If Keely disappeared tomorrow, every file you've written would remain fully readable in any text editor, editable in any markdown tool, and movable to any other platform without loss.

**The Accessibility Principle** — No author should ever need to open, read, or edit a config file to use this tool. The Phase 2 desktop editor app will make Keely fully accessible to non-technical authors. Phase 1 (what you're installing now) requires some comfort with files and a terminal.

**Design and Build as We Mean to Continue** — Every decision is made with the long term in mind. No convenient shortcuts that become tomorrow's problems.

---

## Where to Start

If you are installing Keely for the first time, read in this order:

1. **`INSTALL.md`** — prerequisites, getting the template, running your first local preview
2. **`docs/09_quickstart.md`** — a fast path from install to live site. Abbreviated by design — always refer to the full documentation for complete answers.
3. **`docs/01_your-first-project.md`** — full walkthrough of setting up your project, stories, and entities
4. **`docs/`** — the complete documentation set, one topic per file

If you are looking up a specific field, vocabulary list, or convention, go straight to:

- **`docs/REFERENCE.md`** — controlled vocabularies, field quick-reference, folder conventions, computed fields, image sizing, and app phase overview. Your first stop for quick answers.

---

## What's in This Repo

```
START-HERE.md           ← you are here
INSTALL.md              ← installation guide
LICENSE                 ← MIT license (covers the generator code)
CONTENT-LICENSE         ← CC0 license (covers the file format specification)
template-files/         ← annotated template files to copy when adding content
docs/                   ← full documentation set
  01_your-first-project.md
  02_entities.md
  03_images.md
  04_writing-scenes.md
  05_content-warnings.md
  06_navigation-and-threads.md
  07_customization.md
  08_deployment.md
  09_quickstart.md
  REFERENCE.md
```

---

## About Keely

Keely is named after KimBoo York's dog, who was portable, beloved, and made her life better. The project is open source under the MIT License. The file format specification is CC0 — public domain — so anyone can implement it freely.
