# Writing Scenes

## Overview

Scenes are the atomic unit of your story in Keely — each scene is a single narrative moment, chapter section, or story beat that readers
encounter in sequence. If you think in chapters, a chapter might contain several scenes. If you think in episodes, an episode might
map to one scene or several.

Keely doesn't enforce a definition of "scene" — write at whatever granularity feels natural for your story. The only rule is that each
scene lives in its own folder.

### The folder-per-scene structure

Like entities, each scene lives in its own named folder containing a single `index.md` file. This structure exists for the same reason:
co-location. A scene's inline images live in the same folder as its prose, keeping everything that belongs to that scene together in one
place.

```
scenes/
  01-the-order/
    index.md
    evacuation-notice.png  ← inline image, lives here
  02-peters-office/
    index.md
  03-the-fax/
    index.md
```

For guidance on organizing scenes into chapters and arcs, see
`docs/01_your-first-project.md`.

---

## Creating a Scene

### Name and number your scene folder

Scene folders must have a numeric prefix that controls reading order. The generator reads folders alphanumerically, so `01-` always comes before `02-`:

```
01-my-first-scene/
02-my-second-scene/
03-my-third-scene/
```

**Scene numbering is contiguous across your entire story.** Scenes do not restart numbering when they move into a new chapter or arc. If
your story has three chapters, the scenes run `01-`, `02-`, `03-`... straight through from the first scene of chapter one to the last scene of the final chapter. The chapter or arc folder is just an organizational container — it doesn't reset the count.

```
scenes/
  chapter-01/
    01-the-order/
    02-peters-office/
  chapter-02/
    03-the-fax/       ← continues from where chapter 01 left off
    04-breakdown/
```

Use zero-padded numbers so ordering stays correct beyond nine scenes (`001-` through `009-`, then `010-`, `011-`, and so on). Choose a
descriptive slug for the rest of the name — you'll thank yourself later when navigating a large scene list.

**How much padding do you need?** That depends on your story's length. For stories under 100 scenes, two digits (01- through 99-) is
sufficient. For longer works — novels with many short scenes, or ongoing serials — use three digits (001- through 999-) from the
start. It's much easier to pad from the beginning than to renumber 150 scenes later. When in doubt, use three digits.

To insert a scene between existing scenes, rename the affected folder prefixes manually. The Phase 2 editor app will handle reordering by drag-and-drop with automatic renumbering.

### Copy the template

Copy `template-files/projects/my-project/stories/my-story/scenes/my-first-scene/index.md` into your new scene folder and name it `index.md`. Open it and fill in the frontmatter fields.

---

## Scene Frontmatter

Scene files use YAML frontmatter — the block of fields between the `---` markers at the top of the file. Below the closing `---` is
your scene prose.

### Full field reference

| Field | Required? | Type | Description |
|---|---|---|---|
| `type` | Yes | String | Always `scene`. Do not change. |
| `status` | Yes | String | Publication status. Controls whether the scene appears on the reader site. See Scene Status below. |
| `narrative_mode` | Yes | String | How the scene is narrated. Controlled vocabulary — see Narrative Mode below. |
| `title` | No | String | Display title of the scene. If omitted, the generator humanizes the folder name (e.g. `01-the-order` becomes "The Order"). |
| `first_published_date` | Req. if published | String | Date of first publication, formatted `YYYY-MM-DD`. Set once on first publication — never change it afterward. |
| `last_published_date` | Req. if published | String | Date of most recent publication, formatted `YYYY-MM-DD`. Update this every time you re-publish after revisions. Equals `first_published_date` on first publication. |
| `word_count` | Req. if published | Integer | Scene word count. Enter manually in Phase 1 — the Phase 2 editor app fills this in automatically. |
| `summary` | No | String | A one or two sentence summary shown at the top of the scene page, before the prose. Plain text only — no markdown or wiki-links. |
| `content_warnings` | No | Block | Scene-level content warnings. Additive — these layer on top of story-level warnings, never replace them. See Content Warnings at Scene Level below. |
| `authors_notes.top` | No | String | Author's note shown above the scene prose. Supports markdown and wiki-links. |
| `authors_notes.bottom` | No | String | Author's note shown below the scene prose. Supports markdown and wiki-links. |
| `pov_character` | No | Wiki-link | The character whose perspective drives this scene (`[[character-slug]]`). Omit for omniscient or ensemble scenes. Only scenes with this field set are visible to readers following a POV-filtered through-line. |
| `characters_in_scene` | No | List | All characters who appear in this scene, each as a wiki-link. Include the POV character if set. This is how the generator builds "appears in" lists on character pages. |
| `scene_location` | No | Wiki-link | The primary location of this scene (`[[place-slug]]`). This is how the generator builds "scenes at this location" lists on place pages. |
| `also_at` | No | List | Secondary locations, if the scene moves between places. Each as a wiki-link. |
| `threads` | No | List | Story threads this scene belongs to, beyond the main reading order. Free-form strings. Do not include "main" — every scene is automatically part of the main order. See Story Threads below. |
| `tags` | No | List | Free-form tags for categorization and search. |
| `choice_point` | No | Boolean | CYOA hook — marks this scene as a reader branching point. Phase 1 reads but ignores this field. See CYOA Hooks below. |
| `next_scene_branches` | No | List | CYOA hook — the choices offered at this branching point. Phase 1 reads but ignores this field. See CYOA Hooks below. |

### Narrative mode

`narrative_mode` is required on every scene. It tells the generator how the scene is narrated and surfaces as metadata on the scene page.

| Value | Meaning |
|---|---|
| `first-person` | Narrated as "I" — the reader is inside the narrator's head |
| `third-limited` | Narrated as "she/he/they" — the camera stays close to one character's perspective |
| `third-omniscient` | Narrated as "she/he/they" — the narrator knows all and moves freely between perspectives |
| `second-person` | Narrated as "you" — the reader is addressed directly |
| `third-objective` | Narrated as "she/he/they" — the camera observes only, with no access to any character's inner life |
| `epistolary` | Told through documents: letters, logs, reports, transcripts, or other in-world texts |
| `unreliable` | Any mode where the narrator's account cannot be fully trusted |

### A note on dates

`first_published_date` and `last_published_date` serve different purposes and it's important to keep them distinct.

`first_published_date` is a permanent record — set it once when you first publish a scene and never change it. It tells readers (and you) when this scene first appeared.

`last_published_date` is a living field — update it every time you revise and re-publish a scene. When both dates are the same, the
reader site shows only one date. When they differ, both can be shown depending on your `scene_date_display` setting in `project.toml` or
`story.toml`.

---

## Scene Status and Publishing

The `status` field controls whether a scene appears on your reader site. Only `published` scenes are built and visible to readers. All
other statuses are treated as drafts.

| Status | Visible to readers? | Meaning |
|---|---|---|
| `drafting` | No | Work in progress |
| `revising` | No | Draft complete, revisions underway |
| `in-beta` | No | With beta readers |
| `finalized` | No | Ready to publish, not yet live |
| `published` | **Yes** | Live for readers |

Use the status field to track your writing workflow — move scenes through the statuses as they progress. When you're ready to publish,
change `status` to `published`, fill in the required date fields and word count, and run a build.

The build will warn you in the terminal if a scene marked `published` is missing its required date fields or word count.

---

## Writing Scene Prose

The scene prose lives below the closing `---` of the frontmatter block. This is what readers see when they open a scene.

Keely supports full markdown formatting in scene prose:

```markdown
# Heading

**Bold text** and *italic text*.

A paragraph of prose. Another sentence here.

> A block quote.
```

### Wiki-links in prose

Any entity name in your prose can be made into a wiki-link using double bracket syntax. When readers click a wiki-link, the linked
entity loads in the wiki sidebar without leaving the scene.

```markdown
[[angie-mcdonnell]] crossed the corridor toward the airlock.
```

To show different text while linking to the same entity:

```markdown
[[angie-mcdonnell|Angie]] crossed the corridor toward the airlock.
```

Use the entity's folder name as the slug, not its display name.
If you're unsure of a slug, check the entity's folder name in your
project.

### Inline images

Embed images in scene prose using standard markdown image syntax:

```markdown
![Alt text describing the image](image-filename.jpg)
```

Place the image file in the scene's folder alongside `index.md`. Reference it by filename only — not a full path. See
`docs/03_images.md` for full details on inline scene images.

---

## Author's Notes

Author's notes are optional messages to readers, separate from the scene prose itself. They support markdown and wiki-links.

`authors_notes.top` appears above the scene prose, after any content warning banner. Good for: update notes, context about the scene,
or a note to returning readers.

`authors_notes.bottom` appears below the scene prose, before prev/next navigation. Good for: closing commentary, behind-the-scenes
notes, or acknowledgments.

If both are omitted or left empty, neither appears. Readers can toggle author's notes display on or off — the default is set in `project.toml` or `story.toml` under `reader_defaults.show_author_notes`.

---

## Content Warnings at Scene Level

Individual scenes can carry their own content warnings on top of the story-level warnings set in `story.toml`. Scene-level warnings are
always additive — they layer on top, never replace the story-level declaration.

Use scene-level warnings for scenes with specific content that doesn't apply to the whole story — a single violent scene in an otherwise
mild story, for example.

```yaml
content_warnings:
  additional:
    - graphic-violence
  custom:
    - "depiction of a panic attack"
```

For the full content warnings vocabulary and guidance, see `docs/05_content-warnings.md`.

---

## Story Threads

Threads let readers follow a subset of your scenes — a subplot, a character's storyline, or a parallel narrative strand. Every scene
is automatically part of the main reading order; threads are additional memberships layered on top.

```yaml
threads:
  - angies-arc
  - evacuation-plot
```

Thread names are free-form — invent names that make sense for your story. Readers can switch between thread views using the navigation
panel in the wiki sidebar.

For full details on threads and through-line navigation, see `docs/06_navigation-and-threads.md`.

---

## CYOA Hooks

Keely's scene format includes two fields reserved for future choose-your-own-adventure branching navigation: `choice_point` and
`next_scene_branches`. These fields exist in the schema now so authors who want to plan branching stories can do so in their
frontmatter today.

```yaml
choice_point: true
next_scene_branches:
  - label: "Follow Peter"
    scene: "[[02-peters-office]]"
  - label: "Stay with Angie"
    scene: "[[02-angie-waits]]"
```

The Phase 1 generator reads these fields but does not act on them — branching navigation will be implemented in a future phase. Like the
gallery field on entities, you can populate these fields now and they will activate automatically when the feature ships.

---

## Next Steps

Your scenes are written and published. From here:

**→ `docs/05_content-warnings.md`** — full guidance on the content warnings system, vocabulary, and reader-facing display.

**→ `docs/06_navigation-and-threads.md`** — set up through-line navigation, POV filters, and story threads for your readers.
