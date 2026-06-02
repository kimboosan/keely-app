# Customization

## Overview

Keely gives you two layers of customization: **reader defaults** (behavior) and **visual styling** (appearance). Reader defaults control how your site behaves for first-time visitors. Visual styling controls how it looks — colors, fonts, layout. Both are optional; Keely's defaults are designed to work well out of the box.

A third layer — **publisher branding** — covers your logo, storefront labels, and about page, which are set in `publisher.toml` and `authors.toml`. These are covered in `docs/01_your-first-project.md` but summarized here for completeness.

---

## Reader Defaults

Reader defaults control the initial state of reader-facing UI features on a visitor's first arrival. Readers can override any of these in their own browser — the defaults only apply before a reader has made their own choices.

Set reader defaults in the `[reader_defaults]` block in `project.toml`. Individual stories can override any of these in their own `story.toml` using the same block.

```toml
[reader_defaults]
show_content_warnings = true
show_author_notes = true
default_thread_view = "main"
sidebar_collapsed = false
scene_date_display = "first"
```

| Field | Default | Description |
|---|---|---|
| `show_content_warnings` | `true` | Whether content warning banners display on scene pages for first-time visitors. Strongly recommended to leave on. |
| `show_author_notes` | `true` | Whether author's notes display above and below scene prose. |
| `default_thread_view` | `"main"` | Which through-line readers start on. Set to a thread name to start readers on that thread instead of the full linear order. |
| `sidebar_collapsed` | `false` | Whether the wiki sidebar starts collapsed. Set to `true` for a cleaner first impression on prose-heavy stories where you'd rather readers focus on the text. |
| `scene_date_display` | `"first"` | Which publication date shows on scene pages. `"first"` shows the original publication date. `"last"` shows the most recent update date. `"both"` shows both when they differ. |

---

## Visual Customization

Keely's visual appearance is controlled by CSS custom properties (variables) defined at the top of `public/styles/reader.css`. These variables act as design tokens — change a variable once and it updates everywhere that variable is used across the entire site.

You do not need to understand the full stylesheet to customize your site. The variables at the top of `reader.css` are designed to be the only thing most authors ever need to touch.

### How to customize

Open `public/styles/reader.css` in your editor. At the very top of the file, inside the `:root { }` block, you'll find all the design token variables. Edit the values there — everything below that block is structural CSS that you generally won't need to change.

```css
:root {
  --color-bg: #ffffff;          /* change this to change the page background */
  --color-text: #1a1a1a;        /* change this to change the body text color */
  /* ... and so on */
}
```

Variables accept any valid CSS color value: named colors (`teal`, `navy`), hex values (`#4a3f8f`), RGB (`rgb(74, 63, 143)`), or HSL. For fonts, use any web-safe font stack or a Google Fonts import.

The full variable reference is in the appendix at the bottom of this document.

### A note on updates

When Keely updates, `reader.css` may be updated too. If you've edited the file directly, you'll need to re-apply your changes after an update. For this reason, keep a note of exactly which variables you've changed and what values you used — a comment at the top of the file works well:

```css
/* My customizations:
   --color-header-bg: #2c1810  (dark brown, matches my book cover)
   --font-prose: 'Palatino Linotype', Palatino, serif
*/
```

---

## Publisher Branding

These fields are set in `publisher.toml` and `authors.toml` — they're covered fully in `docs/01_your-first-project.md`, but here's a quick summary of the branding-relevant ones:

- `logo` in `publisher.toml` — your press logo, displayed in the site header. If omitted, your `name` displays as text.
- `tagline` in `publisher.toml` — a one-liner beneath your name on the storefront.
- `storefront_blurb` in `publisher.toml` — a welcome message for readers on your home page.
- `projects_label` and `about_label` in `publisher.toml` — the nav link labels on your storefront.
- `portrait` in `authors.toml` — your author photo on the about page.

---

## Entity Type Customization

The three default entity types — characters, places, and groups — can have their display labels and colors customized in `project.toml`. You can also declare entirely new entity types for things like artifacts, magic systems, ships, or any other category your world needs.

### Customizing default entity types

Add an `[[entity_types]]` entry in `project.toml` for any default type you want to customize:

```toml
[[entity_types]]
name = "characters"
singular = "Character"
plural = "Characters"
color = "blue"
```

You only need to include the fields you want to change — omit any field to keep the default.

### Adding custom entity types

To add a new entity type:

1. Create a matching folder in your project: `projects/my-project/my-type/`
2. Add an `[[entity_types]]` entry in `project.toml`:

```toml
[[entity_types]]
name = "artifacts"
singular = "Artifact"
plural = "Artifacts"
color = "#a855f7"
```

3. Add your entity folders inside the new type folder, each with an `index.md` file following the same structure as characters, places, and groups.

The `color` field accepts any CSS color value and is used for the entity type's accent color in listings and the wiki sidebar.

---

## Next Steps

**→ `docs/08_deployment.md`** — put your site on the web.

---

## Appendix: CSS Variables Reference

All variables are defined in the `:root` block at the top of `public/styles/reader.css`. Values shown are the defaults.

### Colors

| Variable | Default | Used for |
|---|---|---|
| `--color-bg` | `#ffffff` | Page background |
| `--color-text` | `#1a1a1a` | Body text |
| `--color-link` | `#4a3f8f` | Link color throughout the site |
| `--color-link-hover` | `#2d2660` | Link hover color |
| `--color-border` | `#cccccc` | Borders and dividers |
| `--color-header-bg` | `#1a1a2e` | Site header background |
| `--color-header-text` | `#ffffff` | Site header text and button color |
| `--color-wiki-bg` | `#f5f5f5` | Wiki sidebar background and scene meta blocks |
| `--color-wiki-strip` | `#4a3f8f` | Wiki sidebar accent strip, rating pill background, scene meta border |

### Story Block Colors

| Variable | Default | Used for |
|---|---|---|
| `--color-warning-bg` | `#fff8e1` | Content warning block background |
| `--color-warning-border` | `#f0c040` | Content warning block left border |
| `--color-block-bg` | `#f5f5f5` | Generic story info block background |
| `--color-block-border` | `#cccccc` | Generic story info block left border |
| `--color-credits-bg` | `#e8f0fe` | Credits block background and author's notes background |
| `--color-credits-border` | `#4a7fc1` | Credits block left border and author's notes left border |
| `--color-acknowledgments-bg` | `#e8f4fd` | Acknowledgments block background |
| `--color-acknowledgments-border` | `#5ba3c9` | Acknowledgments block left border |

### Typography

| Variable | Default | Used for |
|---|---|---|
| `--font-prose` | `Georgia, 'Times New Roman', serif` | Scene prose, story and project landing pages |
| `--font-ui` | `system-ui, -apple-system, sans-serif` | Navigation, metadata, wiki sidebar, labels |
| `--font-size-base` | `1.1rem` | Base font size for prose |
| `--line-height-prose` | `1.75` | Line height for prose text |

### Layout

| Variable | Default | Used for |
|---|---|---|
| `--header-height` | `48px` | Height of the site header bar |
| `--wiki-pane-width` | `380px` | Width of the wiki sidebar when open |
| `--wiki-pane-collapsed-width` | `12px` | Width of the wiki sidebar when collapsed |
| `--prose-pane-padding` | `2rem` | Padding around the prose pane |
| `--prose-max-width` | `75ch` | Maximum width of prose content (in characters) |
