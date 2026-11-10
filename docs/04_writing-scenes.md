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
src/content/projects/my-project/stories/my-story/scenes/
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
  chapter-01-the-order/
    01-the-order/
    02-peters-office/
  chapter-02-the-fax/
    03-the-fax/       ← continues from where chapter 1 left off
    04-breakdown/
```

The numbers in the folders are the numbers readers see: Chapter 2, Scene 3. Choose a descriptive name for the rest of the folder
name — it's the scene's web address and the name you link to it by: `03-the-fax/` is at `…/scenes/the-fax/`, linked as `[[the-fax]]`.
Scene names must be unique within a story.

**Padding:** numbers are zero-padded (`01-` through `99-`) so folders sort in reading order. If a story grows past 99 scenes,
renumbering (below) widens every scene number to three digits for you in one step — otherwise `100-…` would sort between `10-…` and
`11-…`.

To insert a scene between existing scenes (or move one), give the folder any number that sorts where you want it, then let Keely
renumber the story:

```bash
npm run renumber -- my-project/my-story            # dry run: shows what would change
npm run renumber -- my-project/my-story --apply    # renames the folders
```

Renumbering puts every scene, chapter, arc and interlude number in order. Because links use a scene's name, not its number, it never
breaks a link or changes a web address. (Links written the older way, with the number, like `[[03-the-fax]]`, are updated to the name
within that story.) If anything goes wrong partway, it undoes itself completely; and it refuses to run over a story that changed since
its dry run, or a folder whose order isn't loose scenes, then arcs, then chapters (see `docs/01_your-first-project.md` for interludes).

### Copy the template

Copy `template-files/content/projects/my-project/stories/my-story/scenes/01-my-first-scene/index.md` into your new scene folder. Open it and fill in the frontmatter fields.

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
| `author_notes.top` | No | String | Author's note shown above the scene prose. Plain text — markdown and wiki-links aren't converted. |
| `author_notes.bottom` | No | String | Author's note shown below the scene prose. Plain text — markdown and wiki-links aren't converted. |
| `pov_character` | No | Slug | The character whose perspective drives this scene: their slug, without brackets (`angie-mcdonnell`). Omit for omniscient or ensemble scenes. Only scenes with this field set are visible to readers following a POV-filtered through-line. |
| `characters_in_scene` | No | List | All characters who appear in this scene, each by slug, without brackets. The POV character counts even if you leave them out. This is how the generator builds "appears in" lists on character pages. |
| `scene_location` | No | Slug | The primary location of this scene: the place's slug, without brackets (`moonbase-delta`). This is how the generator builds "scenes at this location" lists on place pages. |
| `also_at` | No | List | Secondary locations, if the scene moves between places. Each by slug, without brackets. |
| `threads` | No | List | Story threads this scene belongs to, beyond the main reading order. Free-form strings. Do not include "main" — every scene is automatically part of the main order. See Story Threads below. |
| `tags` | No | List | Free-form tags for what belongs to this scene; the story's own go in `story.toml`. Shown on the scene page, and they put the story on those tags' pages. |
| `featuring` | No | Block | Other entries this scene features, by type (groups or your custom types): `featuring: { relationships: [gene-hunt-x-sam-tyler] }`. Lists the scene under Featured In on each entry's page. |
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
project's folder.

### Links to another project

A plain `[[slug]]` only finds entities in the same project. To link to an entity in another project, name the project first:

```markdown
It was the same mark [[dragons-grail/traz|Traz]] had carried.
```

The entity opens in the wiki pane, with a small note saying which project it's from.

### Links to the web

Standard markdown links work for anything on the web:

```markdown
She'd read [the original report](https://example.com/report) twice.
```

They open in a new tab, with a small ↗ after the text, so readers know they're leaving and keep their place.

### Links to other scenes

You can also link to another scene in the same story by its name — its folder name without the number:

```markdown
As she'd learned back in [[the-fax]], nothing on the station stayed quiet for long.
[[the-fax|that morning]], she'd been sure of it.
```

The link shows the scene's title (or your `|display text`) and takes readers to that scene. Because the number isn't part of it, the
link keeps working however the story is renumbered. Scene links only reach scenes in the same story, since scene names are only unique
within a story.

### Inline images

Embed images in scene prose using Keely's image syntax (not standard markdown `![alt](file)`, which can't find images in your scene
folder):

```markdown
[[image:image-filename.jpg|Alt text describing the image]]
```

Place the image file in the scene's folder alongside `index.md`. Reference it by filename only — not a full path. See
`docs/03_images.md` for full details on inline scene images.

---

## Author's Notes

Author's notes are optional messages to readers, separate from the scene prose itself. They're plain text: shown exactly as written, so
markdown formatting and `[[wiki-links]]` aren't converted in them.

`author_notes.top` appears above the scene prose, after any content warning banner. Good for: update notes, context about the scene,
or a note to returning readers.

`author_notes.bottom` appears below the scene prose, before prev/next navigation. Good for: closing commentary, behind-the-scenes
notes, or acknowledgments.

If both are omitted or left empty, neither appears. Files that use the older spelling, `authors_notes`, still work, with a note in the build. Readers can toggle author's notes display on or off — the default is set in `project.toml` or `story.toml` under `reader_defaults.show_author_notes`.

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
    scene: peters-office
  - label: "Stay with Angie"
    scene: angie-waits
```

The Phase 1 generator reads these fields but does not act on them — branching navigation will be implemented in a future phase. Like the
gallery field on entities, you can populate these fields now and they will activate automatically when the feature ships.

---

## Next Steps

Your scenes are written and published. From here:

**→ `docs/05_content-warnings.md`** — full guidance on the content warnings system, vocabulary, and reader-facing display.

**→ `docs/06_navigation-and-threads.md`** — set up through-line navigation, POV filters, and story threads for your readers.
