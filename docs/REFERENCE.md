# Keely — Quick Reference

This document is your at-a-glance companion to the Keely file format.
It lives alongside your template files and covers everything the inline
comments point you to: controlled vocabularies, field lists, link syntax,
folder conventions, and computed fields.

For the full setup guide, tutorials, and developer documentation, visit
**keely-app.com**.

---

## App Phases

Keely is being built in three phases. Here's where things stand and
what's coming.

### Phase 1 — Static Site Generator (current)
You are here. Keely generates a fully functional reader site from your
markdown and TOML files. You manage your content directly in Obsidian
or VS Code, run a build command, and deploy to the web.

What's working now:
- Full dual-pane reader site (prose + wiki sidebar)
- Characters, places, and groups with auto-generated cross-references
- Through-line navigation (linear, POV-filtered, thread-filtered)
- Content warnings with reader-controlled display
- Genre, subgenre, and rating display
- Story and project landing pages
- Publisher storefront and about page
- Image support (portraits, place images, inline scene images)
- Netlify and GitHub Pages deployment

### Phase 2 — Desktop Editor App (coming)
A desktop app that makes Keely accessible to authors who prefer not to
work directly in files or a terminal. Everything Phase 1 does, wrapped
in a friendly interface.

What Phase 2 will add for authors:
- Create and manage projects through a visual UI — no config files to edit
- Write scenes in a built-in markdown editor with live preview
- Wiki-link autocomplete — type `[[` and see your entities in a dropdown
- Drag-and-drop scene reordering (automatic renumbering handled for you)
- One-click build and deploy
- Word count tracked automatically
- Image drag-and-drop with alt text prompt

Phase 1 authors who work directly in files will not need to change
anything — the file format is identical in both phases.

For technical development details, see the developer documentation at
**keely-app.com/docs**.

### Phase 3 — Reader Interaction Features (future)
Keely becomes a full publishing platform with reader-facing features.

What Phase 3 will add:
- Reader comments on scenes
- Email subscriptions and new-chapter notifications
- RSS feed generation
- Paywalled chapters and subscription tiers
- Privacy-respecting reader analytics
- Hosted tier (publish without managing your own server)

---

## Controlled Vocabularies

These are the fixed lists Keely uses to make decisions about rendering,
filtering, and display. Use values exactly as written — spelling and
capitalization matter.

### Genre
Choose exactly one per project or story.

| Value | Notes |
|---|---|
| Science Fiction | |
| Fantasy | |
| Romance | |
| Mystery | |
| Thriller | |
| Horror | |
| Historical Fiction | |
| Alternative History | |
| Literary Fiction | |
| Western | |
| Action and Adventure | |
| LitRPG | |
| Non-Fiction | |
| Memoir | |
| Fan Fiction | |

Use `subgenre` (free-form) for niche descriptors like "cozy", "sapphic",
"grimdark", or "solarpunk".

---

### Rating
Choose exactly one per project or story.

| Value | Meaning |
|---|---|
| Not Rated | You have deliberately chosen not to assign a rating |
| General Audiences | Suitable for all ages |
| Teen and Up | Mild mature themes; suitable for teenagers |
| Mature | Significant mature themes; adult content short of explicit |
| Explicit | Explicit sexual or graphic content |

"Not Rated" is a valid deliberate choice, not a placeholder.
If your project contains stories of mixed ratings, set the project-level
rating to the highest rating present across all stories.

---

### Content Warnings — Required Field
Every story must declare exactly one value in `content_warnings.required`.
This is a mandatory declaration — "no warnings" is a deliberate statement,
not an oversight. Readers rely on this signal.

| Value | Meaning |
|---|---|
| `graphic-violence` | Significant violent content |
| `character-death` | A named character dies |
| `sexual-content` | Sexual content present (use with Mature or Explicit rating) |
| `non-consent` | Non-consensual situations depicted |
| `creator-chose-not-to-warn` | You have chosen not to disclose specific warnings |
| `no-warnings-apply` | No significant warnings apply to this story |

---

### Content Warnings — Additional Vocabulary
Use zero or more of these in `content_warnings.additional` at story or
scene level. Scene-level warnings are additive — they layer on top of
story-level warnings, never replace them.

| Value | Notes |
|---|---|
| `suicide-and-self-harm` | |
| `abuse` | Physical, emotional, or psychological |
| `addiction` | |
| `grief-and-loss` | |
| `mental-illness` | |
| `child-harm` | |
| `animal-harm` | |
| `body-horror` | |
| `torture` | |
| `war-and-combat` | |
| `racism-and-discrimination` | Depicted in story content |
| `sexual-violence` | More specific than non-consent |
| `eating-disorders` | |
| `pregnancy-and-birth` | Including loss |
| `medical` | Surgery, illness, medical procedures |
| `phobias` | Spiders, heights, confined spaces, etc. — use `custom` to specify |

For anything not on this list, use `content_warnings.custom` with your
own free-form text.

---

### Narrative Mode
Required on every scene. Choose exactly one.

| Value | Meaning |
|---|---|
| `first-person` | Narrated as "I" — reader is inside the narrator's head |
| `third-limited` | Narrated as "she/he/they" — camera stays close to one character |
| `third-omniscient` | Narrated as "she/he/they" — narrator knows all, moves freely |
| `second-person` | Narrated as "you" — reader is addressed directly |
| `third-objective` | Narrated as "she/he/they" — camera observes only, no interiority |
| `epistolary` | Told through documents: letters, logs, reports, transcripts |
| `unreliable` | Any mode where the narrator's account cannot be fully trusted |

---

### Scene Status
Required on every scene. Controls whether the scene appears on the
reader site.

| Value | Appears on site? | Meaning |
|---|---|---|
| `drafting` | No | Work in progress |
| `revising` | No | Draft complete, revisions underway |
| `in-beta` | No | With beta readers |
| `finalized` | No | Ready to publish, not yet live |
| `published` | **Yes** | Live for readers |

Only `published` scenes are built and visible to readers. All other
statuses are treated as drafts.

---

### Character Role
Optional. Controls visual prominence in character listings.

| Value | Meaning |
|---|---|
| `main` | Primary character — largest display weight |
| `secondary` | Supporting character |
| `minor` | Appears occasionally |
| `background` | Named but peripheral |

If omitted, defaults to `minor`.

---

### Place Scope
Optional. Controls visual prominence in place listings.

| Value | Meaning |
|---|---|
| `primary` | Central to the story — largest display weight |
| `secondary` | Significant but not central |
| `minor` | Appears occasionally |
| `background` | Named but peripheral |

If omitted, defaults to `minor`.

---

### Place Size
Optional. Describes the physical scale of the place.

| Value | Meaning |
|---|---|
| `small` | Intimate scale — a room, a vehicle, a small building |
| `medium` | Moderate scale — a facility, a neighbourhood, a ship |
| `large` | Significant scale — a city, a station, a region |
| `vast` | Planetary or larger scale — a continent, a world |

If omitted, no size is displayed.

---

## Field Quick Reference

### publisher.toml
| Field | Required? | Notes |
|---|---|---|
| `name` | Yes | Display name or press name |
| `tagline` | No | One-liner for the storefront |
| `logo` | No | Filename relative to src/data/ |
| `storefront_blurb` | No | Markdown welcome text |
| `projects_label` | No | Defaults to "Stories" |
| `about_label` | No | Defaults to "About the Author" |
| `required_warnings` | No | Defaults to true |

### authors.toml
| Field | Required? | Notes |
|---|---|---|
| `name` | Yes | Per author entry |
| `bio` | No | Markdown |
| `portrait` | No | Filename relative to src/data/ |
| `links` | No | List of `{ label, url }` pairs |

### project.toml
| Field | Required? | Notes |
|---|---|---|
| `title` | Yes | |
| `genre` | Yes | Controlled vocabulary |
| `rating` | Yes | Controlled vocabulary |
| `author.name` | Yes | |
| `license.code` | Yes | |
| `license.content` | Yes | |
| `tagline` | No | |
| `summary` | No | Markdown |
| `cover` | No | Image filename |
| `banner` | No | Image filename |
| `subgenre` | No | Free-form list |
| `author.url` | No | |
| `author_notes.top` | No | Markdown |
| `author_notes.bottom` | No | Markdown |
| `content_warnings` | No | Whole section optional at project level |
| `entity_types` | No | Only needed for customization or custom types |
| `reader_defaults` | No | All fields have built-in defaults |

### story.toml
| Field | Required? | Notes |
|---|---|---|
| `title` | Yes | |
| `genre` | Yes | Controlled vocabulary |
| `rating` | Yes | Controlled vocabulary |
| `completion_status` | Yes | `in-progress | complete | hiatus | abandoned` |
| `content_warnings.required` | Yes | Controlled vocabulary |
| `tagline` | No | |
| `summary` | No | Markdown |
| `cover` | No | Image filename |
| `banner` | No | Image filename |
| `subgenre` | No | Free-form list |
| `start_date` | No | YYYY-MM-DD |
| `expected_chapters` | No | Number or "?" |
| `content_warnings.additional` | No | |
| `content_warnings.custom` | No | |
| `author_notes.top` | No | Markdown |
| `author_notes.bottom` | No | Markdown |
| `credits` | No | Whole section optional |
| `acknowledgments` | No | Whole section optional |
| `license` | No | Inherits from project.toml if omitted |
| `reader_defaults` | No | Inherits from project.toml if omitted |

### Character index.md
| Field | Required? | Notes |
|---|---|---|
| `name` | Yes | |
| `type` | Yes | Always `character` |
| `project` | Yes | List of project slugs |
| `short_name` | No | Defaults to `name` |
| `aliases` | No | Used for auto-linking |
| `subtype` | No | Free-form |
| `role` | No | Controlled vocabulary; defaults to `minor` |
| `function` | No | Free-form |
| `age` | No | Number or string |
| `occupation` | No | |
| `title` | No | Formal title |
| `appearance` | No | |
| `portrait` | No | Filename |
| `portrait_alt` | Required if portrait set | Alt text for screen readers |
| `gallery` | No | |
| `group` | No | Wiki-links |
| `related_to` | No | List of `{ entity, relationship }` |
| `tags` | No | |

### Place index.md
| Field | Required? | Notes |
|---|---|---|
| `name` | Yes | |
| `type` | Yes | Always `place` |
| `project` | Yes | List of project slugs |
| `short_name` | No | Defaults to `name` |
| `aliases` | No | Used for auto-linking |
| `subtype` | No | Free-form |
| `scope` | No | Controlled vocabulary; defaults to `minor` |
| `size` | No | Free-form |
| `status` | No | Free-form |
| `location` | No | Free-form prose |
| `operator` | No | Wiki-link to a group |
| `parent_place` | No | Wiki-link |
| `contains` | No | List of wiki-links |
| `image` | No | Filename |
| `image_alt` | Required if image set | Alt text for screen readers |
| `gallery` | No | |
| `tags` | No | |

### Group index.md
| Field | Required? | Notes |
|---|---|---|
| `name` | Yes | |
| `type` | Yes | Always `group` |
| `project` | Yes | List of project slugs |
| `short_name` | No | Defaults to `name` |
| `full_name` | No | Unabbreviated formal name |
| `aliases` | No | Used for auto-linking |
| `subtype` | No | Free-form |
| `status` | No | Free-form |
| `headquarters` | No | |
| `founded` | No | |
| `leader` | No | Wiki-link to a character |
| `opposed_to` | No | List of wiki-links; mirror computed automatically |
| `allied_with` | No | List of wiki-links; mirror computed automatically |
| `image` | No | Filename |
| `image_alt` | Required if image set | Alt text for screen readers |
| `gallery` | No | |
| `tags` | No | |

### Scene index.md
| Field | Required? | Notes |
|---|---|---|
| `type` | Yes | Always `scene` |
| `status` | Yes | Controlled vocabulary |
| `narrative_mode` | Yes | Controlled vocabulary |
| `first_published_date` | Required if published | YYYY-MM-DD; set once, never change |
| `last_published_date` | Required if published | YYYY-MM-DD; update on re-publish |
| `word_count` | Required if published | Integer |
| `title` | No | Defaults to humanized folder name |
| `summary` | No | Plain text only |
| `content_warnings.additional` | No | Additive; layered onto story warnings |
| `content_warnings.custom` | No | Free-form |
| `authors_notes.top` | No | Markdown; wiki-links allowed |
| `authors_notes.bottom` | No | Markdown; wiki-links allowed |
| `pov_character` | No | Wiki-link; omit for omniscient/ensemble |
| `characters_in_scene` | No | List of wiki-links; drives character backlinks |
| `scene_location` | No | Wiki-link; drives place backlinks |
| `also_at` | No | List of wiki-links |
| `threads` | No | Free-form list; do not include "main" |
| `tags` | No | |
| `choice_point` | No | Phase 1 ignored; defaults to false |
| `next_scene_branches` | No | Phase 1 ignored |

---

## Wiki-Link Syntax

Wiki-links connect your prose and entity pages to each other. The slug
is always the entity's folder name.

**Basic link:**
```
[[character-slug]]
[[place-slug]]
[[group-slug]]
```

**Display text override** — shows different text but links to the same page:
```
[[angie-mcdonnell|Angie]]
```
Displays "Angie" but links to Angie's character page.

**Auto-linking** — if an entity has values in its `aliases` field, the
generator can recognize those names in scene prose and link them
automatically, without explicit `[[]]` markup. This is an opt-in setting
in `project.toml`.

**Resolving slugs** — the slug is always the folder name, regardless of
the entity's display name. If your character folder is named
`angie-mcdonnell`, the link is `[[angie-mcdonnell]]` even if her
display name is "Angela McDonnell".

---

## Folder Naming Conventions

### General rules
- Use lowercase letters, numbers, and hyphens only
- No spaces, underscores, or special characters
- Keep slugs short but meaningful: `angie-mcdonnell` not `angela-francesca-mcdonnell`
- The folder name becomes the URL, so choose something you won't want to change

### Scene numbering
Scene folders must have a numeric prefix to control reading order:
```
01-my-first-scene/
02-my-second-scene/
03-my-third-scene/
```
The generator reads folders alphanumerically, so `01-` always comes
before `02-`. Use zero-padded numbers so ordering stays correct beyond
nine scenes (`01-` through `09-`, then `10-`).

To insert a scene between existing scenes, rename the affected folder
prefixes. The Phase 2 editor app handles reordering by drag-and-drop
with automatic renumbering.

### Container folders (arcs and chapters)
Stories can be flat (scenes only) or nested (scenes grouped into
chapters and/or arcs). Nesting is expressed through folder structure,
not frontmatter.

**Flat:**
```
scenes/
  01-the-order/
  02-peters-office/
  03-the-fax/
```

**Chapters only:**
```
scenes/
  chapter-01-the-evacuation-order/
    01-the-order/
    02-peters-office/
  chapter-02-breakdown/
    01-vodka-and-theories/
```

**Arcs and chapters:**
```
scenes/
  arc-01-setup/
    chapter-01-the-evacuation-order/
      01-the-order/
      02-peters-office/
    chapter-02-breakdown/
      01-vodka-and-theories/
```

Container folders do not contain an `index.md` — that file is what
identifies a folder as a scene. Any folder without `index.md` is
treated as a container.

### Container titles (`_meta.toml`)
Each container folder can optionally include a `_meta.toml` file to
set a display title:
```toml
title = "The Evacuation Order"
```
If `_meta.toml` is absent, the generator humanizes the folder name
(e.g. `chapter-01-the-evacuation-order` becomes
"Chapter 01: The Evacuation Order").

---

## Computed Fields

Computed fields are generated automatically at build time from the
data in your files. They appear in the reader site and (in Phase 2)
in the editor sidebar — but they are **never written back to your files**.

This is intentional. Your files contain only what you wrote. The tool
handles everything else.

### Characters
| Computed field | How it's built |
|---|---|
| Appears in scenes | Scenes where this character is listed in `characters_in_scene` |
| POV scenes | Scenes where this character is set as `pov_character` |
| Mentioned in | Other entity pages whose prose contains a wiki-link to this character |

### Places
| Computed field | How it's built |
|---|---|
| Scenes at this location | Scenes where this place is listed in `scene_location` or `also_at` |
| Characters appearing here | Union of all characters across those scenes |

### Groups
| Computed field | How it's built |
|---|---|
| Members | Characters whose `group` field contains a wiki-link to this group |
| Appears in scenes | Union of scenes across all member characters |
| Allied with (mirror) | If Group A declares `allied_with: [[group-b]]`, Group B automatically shows Group A as an ally |
| Opposed to (mirror) | Same mirror logic for opposition relationships |

### Scenes
| Computed field | How it's built |
|---|---|
| Position in story | Ordinal derived from folder traversal order |
| Previous scene | Adjacent scene in traversal order |
| Next scene | Adjacent scene in traversal order |

---

## Image Sizing Quick Reference

| Context | Recommended size | Notes |
|---|---|---|
| Publisher logo | Max 60px tall | PNG with transparency recommended |
| Author portrait | 300×300px min | Square crop |
| Project / story cover | 400×600px | 2:3 portrait ratio |
| Project / story banner | 1200×400px | Keep key content center-frame |
| Character portrait | 300×400px | 3:4 ratio or square |
| Place / group image | 600×400px landscape or 400×400px square | |
| Inline scene image | Any | Displays at full prose column width |

These are recommendations, not requirements. Keely will display
whatever you provide — the sizes above just tend to look best in
the default layout.

**Supported formats:** JPEG, PNG, WebP, GIF. For photographs and
portraits, JPEG or WebP are recommended. For illustrations, logos,
or images with transparency, PNG or WebP are recommended.

**Alt text** is required whenever an image field is set. Describe
what the image shows, not what it represents. See
`docs/03_images.md` for full alt text guidance.
