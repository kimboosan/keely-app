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
Choose exactly one per project or story. These come from `src/data/genres.json`; a value that isn't on this list stops the build.

| Value |
|---|
| Action & Adventure |
| Coming of Age |
| Contemporary Fiction |
| Crime |
| Drama |
| Dystopian |
| Erotica |
| Fairy Tale & Folklore |
| Family Life |
| Fantasy |
| General Fiction |
| Historical Fiction |
| Horror |
| Humor |
| LGBTQ+ |
| Literary Fiction |
| Mystery & Detective |
| Paranormal |
| Poetry |
| Romance |
| Science Fiction |
| Short Stories |
| Thriller & Suspense |
| War & Military |
| Western |
| Women's Fiction |

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
story-level warnings, never replace them. These come from
`src/data/warnings-vocabulary.json`.

| Value | Meaning |
|---|---|
| `grief` | Grief |
| `death` | Death |
| `dying` | Dying |
| `medical-content` | Medical content |
| `mental-health` | Mental health |
| `abuse` | Abuse |
| `alcohol-drugs` | Alcohol/drugs |
| `strong-language` | Strong language |
| `sexual-references` | Sexual references |
| `body-horror` | Body horror |
| `trauma` | Trauma |
| `self-harm` | Self-harm |
| `racism` | racist language and behaviors represented |
| `misogyny` | hatred of women in language and behavior |
| `queerphobia` | hatred of LGBTQ+ language and behavior |
| `transphobia` | hatred of trans individuals represented in language and behavior |

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
statuses are treated as drafts. `npm run dev` shows every scene, so you
can read your drafts as you write; `npm run build` includes only
`published` ones. A story with no published scenes still gets its page,
so it can be announced before its first scene.

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

### Group Scope
Optional. How far a group's influence reaches.

| Value |
|---|
| `minor` |
| `major` |
| `dominant` |

---

## Field Quick Reference

### publisher.toml
| Field | Required? | Notes |
|---|---|---|
| `name` | Yes | Display name or press name |
| `tagline` | No | One-liner for the storefront |
| `logo` | No | Filename of an image in the generator's `public/images/` folder |
| `storefront_blurb` | No | Markdown welcome text |
| `projects_label` | No | Defaults to "Stories" |
| `about_label` | No | Defaults to "About the Author" |
| `adult_notice` | No | `true` or `false` (default). When `true`, a page rated Mature or Explicit opens behind a notice with **Continue** and **Go back**; continuing is remembered per story in the reader's browser |
| `hide_from_search_engines` | No | `true` or `false` (default). When `true`, every page asks search engines not to list it. The major ones honour this, but it isn't a guarantee: only a password truly hides a site |

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
| `tags` | No | Free-form list, shown on the project page; stories don't inherit them |

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
| `tags` | No | Free-form list. The story is listed on the tag page of every tag it carries: its own, its arcs' and chapters', and its published scenes' |
| `featuring` | No | Entries the whole story features, by type: `[featuring]` then `relationships = ["gene-hunt-x-sam-tyler"]`. Lists the story under **Featured In** on each entry's page |

### _meta.toml (inside an arc, chapter or interlude folder)
All optional. Each arc, chapter and interlude has a page of its own,
where these show.

| Field | Notes |
|---|---|
| `title` | Display title; without one, it comes from the folder name |
| `summary` | Plain text; a blank line starts a new paragraph |
| `rating` | Controlled vocabulary. Covers this arc's or chapter's page and its scenes (for the adult-content notice); keep the story's `rating` the highest across it |
| `tags` | Free-form list; puts the story on those tags' pages |
| `featuring` | As in `story.toml`; listed under its story on each entry's Featured In once it holds a published scene |

### keely-hosting.toml (beside `src/`)
Optional. Where the finished site will live on the web.

| Field | Notes |
|---|---|
| `address` | The site's full web address, e.g. `https://example.com/` or `https://example.com/stories/`. Needed only when the site goes in a subfolder: every link is then made under it. `npm run dev` ignores it |

### Character index.md
| Field | Required? | Notes |
|---|---|---|
| `name` | Yes | |
| `type` | Yes | Always `character` |
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
| `author_notes.top` | No | Plain text (markdown and wiki-links not converted) |
| `author_notes.bottom` | No | Plain text (markdown and wiki-links not converted) |
| `pov_character` | No | A character's slug, without brackets (`angie-mcdonnell`); omit for omniscient/ensemble |
| `characters_in_scene` | No | List of character slugs, without brackets; drives character backlinks |
| `scene_location` | No | A place's slug, without brackets; drives place backlinks |
| `also_at` | No | List of place slugs, without brackets |
| `threads` | No | Free-form list; do not include "main" |
| `tags` | No | For what belongs to this scene; the story's own go in `story.toml`. Puts the story on those tags' pages |
| `featuring` | No | Other entries this scene features, by type (groups or custom types): `featuring: { relationships: [gene-hunt-x-sam-tyler] }`. Lists the scene under Featured In on each entry's page |
| `choice_point` | No | Phase 1 ignored; defaults to false |
| `next_scene_branches` | No | Phase 1 ignored |

---

## Wiki-Link Syntax

Wiki-links connect your prose and entity pages to each other. The slug
is always the folder name of what you're linking to.

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

**Links to other scenes** — in scene prose, link to another scene in the
same story by its name: its folder name without the number.
```
[[the-fax]]                 ← the scene in 03-the-fax/
[[the-fax|that morning]]
```
Shows the scene's title (or your display text) and links to that scene.
Because the number isn't part of the link, moving or renumbering scenes
never breaks it. A link written the older way, with the number
(`[[03-the-fax]]`), still works; `npm run renumber` updates it to the
name. Scene names are only unique within a story, so scene links can't
reach other stories. If a scene and an entity share a name, the link goes
to the entity.

**Inline images** — in scene prose, show an image stored in the scene's
folder:
```
[[image:evacuation-notice.png|Alt text describing the image]]
```

**Links to things that don't exist yet** — a `[[slug]]` that matches no
entity or scene shows as a faded, dashed "not yet" link with a "No page
yet" tooltip; clicking it does nothing. It becomes a real link as soon as
something with that folder name exists. If you meant an existing page,
check the slug against its folder name.

**Aliases** — an entity's `aliases` are shown on its page as other names
it goes by. They don't create links on their own: every link needs
`[[]]` markup.

**Resolving slugs** — the slug is always the folder name, regardless of
the entity's display name. If your character folder is named
`angie-mcdonnell`, the link is `[[angie-mcdonnell]]` even if her
display name is "Angela McDonnell".

---

## Where Things Live

```
src/
  content/
    projects/<project>/         ← everything one project owns
      project.toml              (+ project cover and banner images)
      characters/<slug>/index.md  (+ the entity's images)
      places/<slug>/index.md
      groups/<slug>/index.md
      <custom-type>/<slug>/index.md
      stories/<story>/
        story.toml              (+ story cover and banner images)
        scenes/                 ← scenes, optionally in arc/chapter folders
  data/                         ← site-wide settings
    publisher.toml
    authors.toml                (+ author portraits)
    genres.json, ratings.json, warnings-vocabulary.json
keely-hosting.toml              ← optional: where the finished site will live
```

- Where a file sits says what it belongs to. Slugs need only be unique
  within their project (entities, stories) or story (scenes).
- Back up `src/content/` and `src/data/` — together they are all of your
  work. Everything else is the generator, or files it computes.
- **Advanced:** to keep your content outside the generator's folder, set
  the `KEELY_VAULT` environment variable to the folder that contains your
  `src/content/` and `src/data/`, e.g.
  `KEELY_VAULT=~/writing/my-keely-site npm run dev`.

---

## Folder Naming Conventions

### General rules
- Use lowercase letters, numbers, and hyphens only
- No spaces, underscores, or special characters
- Keep slugs short but meaningful: `angie-mcdonnell` not `angela-francesca-mcdonnell`
- An entity's folder name becomes its URL, so choose something you won't
  want to change

### How a story's folders are named
The numbers in a story's folders are the numbers readers see: Arc 2,
Chapter 3, Scene 9.
```
scenes/
  arc-01-evacuation/
    chapter-01-the-order/
      01-the-order/
      02-a-history/
    chapter-02-breakdown/
      03-breakdown/
  arc-01.1-quiet-night/          ← an interlude between the arcs
    04-the-long-dark/
  arc-02-crisis/
    chapter-03-what-comes-next/
      05-whats-going-on/
    chapter-03.1-a-letter-home/  ← an interlude between chapters
      06-dear-mum/
    chapter-04-endgame/
      07-take-off/
```
- **Scenes** are `NN-name`, numbered straight through the whole story;
  they don't restart in each chapter or arc.
- **Arcs** are `arc-NN-name`, numbered through the story.
- **Chapters** are `chapter-NN-name`, numbered through the story,
  whichever arc they're in.
- Numbers are zero-padded (`01`, `02` … `10`) so folders sort in reading
  order, and widen to three digits once a story passes 99 scenes.
- A story holds scenes, chapters, arcs and interludes; an arc holds
  scenes, chapters and interludes; chapters and interludes hold only
  scenes.

**A scene's address is its name.** A scene's web address and its links
use the folder name without the number: `05-whats-going-on/` is at
`…/scenes/whats-going-on/` and linked as `[[whats-going-on]]`. So
renumbering never changes a scene's address or breaks a link; renaming a
scene does. Scene names must be unique within a story. An arc's, chapter's
or interlude's page is at its kind and name: `…/arc-crisis`,
`…/interlude-quiet-night`.

### The order within a folder
Folders sort by name, so within the story, or within an arc, the order
is always: **loose scenes first, then arcs, then chapters.** A scene at
the top of a story or an arc works as a prologue. For anything else in
between, use an interlude.

### Interludes
An interlude holds scenes that sit between arcs or between chapters: an
interlude, a prologue, an epilogue, a letter home. It isn't counted as an
arc or chapter, so Arc 2 is still Arc 2; readers see it by its title,
marked as an interlude.

Its folder takes the number of the arc or chapter it follows, plus `.1`
for the first interlude there, `.2` for a second, up to `.9`:
- `arc-01.1-quiet-night` comes after Arc 1, among the arcs.
- `chapter-03.1-a-letter-home` comes after Chapter 3, among the chapters.
- `arc-00.1-prologue` comes before Arc 1.

The number counts through the whole story, as chapter numbers do: an
interlude opening Arc 2, before Chapter 3, is `chapter-02.1-…`. Its scenes
are numbered with all the others.

### Renumbering
To insert or move something, give its folder a name that sorts where you
want it (any number will do), then renumber the story:
```
npm run renumber -- my-project/my-story            # dry run
npm run renumber -- my-project/my-story --apply    # renames folders
```
Renumbering puts every scene, chapter, arc and interlude number in
order, and undoes itself completely if anything fails. It refuses, and
says why, if a folder breaks the order above.

Container folders do not contain an `index.md` — that file is what
identifies a folder as a scene.

**Older names.** Stories made with v0.7 or v0.8 name arcs and chapters
with a position marker (`02_arc-01-setup`). They still work. Run
`npm run renumber -- my-project/my-story --apply` once to update them to
the names above; it also updates links written with scene numbers.
Stories from before v0.7 (`arc-01-setup`) already have these names.

### Container titles
An arc or chapter is labelled with its kind, number and title:
`chapter-01-the-evacuation-order` becomes "Chapter 1: The Evacuation
Order"; an interlude is labelled by its title alone. For a different
title, add a `_meta.toml` inside the folder:
```toml
title = "When It All Began"
```

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

### Groups and custom types
| Computed field | How it's built |
|---|---|
| Featured In | Stories, arcs, chapters and scenes that list this entry under `featuring` |

Entity scene lists (Appears in, Scenes at this location, Featured In) are
grouped by story, and folded when a project has several stories.

### Scenes
| Computed field | How it's built |
|---|---|
| Position in story | Ordinal derived from folder traversal order |
| Previous | The scene before, or the page of the arc, chapter or interlude it opens |
| Next | The scene after, or the page of the arc, chapter or interlude that comes next |

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
