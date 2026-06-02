# Entities: Characters, Places, and Groups

## Overview

Entities are the people, places, and groups that populate your story world. They are the backbone of Keely's wiki system — every character, location, and faction you create becomes a wiki page that readers can browse directly or access by clicking entity names in your scene prose.

Keely has three built-in entity types: **characters**, **places**, and **groups**. Custom entity types (artifacts, magic systems, ships, etc.) can be declared in `project.toml` — see `docs/customization.md` for details.

### The folder-per-entity structure

Each entity lives in its own named folder containing a single `index.md` file. This is not arbitrary — the folder structure is what
makes co-location possible. An entity's images (portrait, gallery) live in the same folder as its `index.md`, keeping everything that
belongs to a character together in one place. The folder name is the entity's slug, which becomes its URL.

```
characters/
  angie-mcdonnell/
    index.md
    angie-portrait.jpg
    angie-spacesuit.jpg
places/
  moon-base-delta/
    index.md
    delta-exterior.jpg
groups/
  mizmo/
    index.md
    mizmo-logo.png
```

### Computed fields

Many of the most useful fields on an entity's wiki page are never written by the author — they're computed at build time from data
across your files. Keely reads your scene frontmatter and entity files and assembles cross-references automatically:

- A character's "appears in" list is built from every scene that lists them in `characters_in_scene`
- A place's "scenes at this location" list is built from every scene that lists it in `scene_location`
- A group's member roster is built from every character whose `group` field links to that group

You never maintain these lists by hand. Add a character to a scene's frontmatter and they appear on the character's wiki page automatically at the next build.

See `REFERENCE.md` for the full computed fields reference.

### Template files

Every entity type has a fully annotated template file in `template-files/`. Copy the relevant template into your entity folder,
rename it `index.md`, and fill in the fields. Every field is explained inline in the template.

---

## Characters

A character entity represents any person in your story world — protagonists, antagonists, supporting cast, historical figures, or
anyone else worth a wiki entry. Characters are the most field-rich entity type because they carry the most relational data: group
membership, relationships to other characters, POV scenes, and appearance lists.

### Character fields

| Field | Required? | Type | Description |
|---|---|---|---|
| `name` | Yes | String | The character's full canonical name. Appears as the page title and in wiki listings. |
| `type` | Yes | String | Always `character`. Do not change. |
| `project` | Yes | List | The project slug(s) this character belongs to. Required for the generator to index them correctly. |
| `short_name` | No | String | The name used in wiki references and the sidebar. Defaults to `name` if omitted. Use this for nicknames or shortened forms — "Angie" instead of "Angela McDonnell". |
| `aliases` | No | List | Other names this character is known by. Used for auto-linking — if a scene mentions "Exec", the generator can auto-link it to this character's page. |
| `subtype` | No | String | Free-form category for your own use. Examples: crew, antagonist, love-interest, minor, suspect. Appears in listings but is not a controlled vocabulary — use whatever makes sense for your story. |
| `role` | No | String | Controlled vocabulary. Controls visual prominence in character listings. Choose one: `main`, `secondary`, `minor`, `background`. Defaults to `minor` if omitted. |
| `function` | No | String | Free-form narrative function, for your reference. Examples: protagonist, mentor, comic-relief, foil. Not displayed to readers. |
| `age` | No | String or number | The character's age. Can be a number (`34`) or a descriptive string (`"mid-thirties"`, `"unknown"`). |
| `occupation` | No | String | Job title or role. |
| `title` | No | String | Formal title, if any. Examples: Captain, Dr., Ambassador. |
| `appearance` | No | String | Physical description. Supports multi-line text using the YAML block scalar (`>`). |
| `portrait` | No | String | Filename of the character's primary image, relative to the entity folder. |
| `portrait_alt` | Req. if portrait set | String | Alt text for the portrait image. Required for accessibility — never leave blank if a portrait is set. Describe the image as you would for someone who cannot see it. |
| `gallery` | No | List | Additional images. Each entry needs `file`, `alt`, and optionally `caption`. Gallery rendering is deferred to a future phase — the field is parsed but not yet displayed. |
| `group` | No | List | Wiki-links to groups this character belongs to (`[[group-slug]]`). Characters can belong to multiple groups. The group's page will automatically list this character as a member — you only need to declare it here. |
| `related_to` | No | List | Relationships with other characters or entities. Each entry has `entity` (a wiki-link) and `relationship` (free-form description: sibling, mentor, rival, ally). |
| `tags` | No | List | Free-form tags for categorization and site-wide search. |

### A note on role vs. function

`role` and `function` serve different purposes and it's worth understanding both.

`role` is a controlled vocabulary that the generator uses to make rendering decisions — how prominently a character appears in listings,
whether they get a featured card or a compact entry. It's a structural signal to the tool.

`function` is free-form and is for your own reference as an author — it doesn't affect rendering. Use it to note narrative roles like
"protagonist" or "reluctant ally" that have meaning to you but don't need to drive the generator's behavior.

### A note on group membership

The `group` field on a character is the only place you need to declare group membership. You do not need to list members on the group's page — the generator computes the roster automatically from every character who links to that group. Declare it once, on the character.

---

## Places

A place entity represents any location in your story world — a building, a city, a planet, a vehicle, or any other space that
characters inhabit or pass through. Places support a parent/child hierarchy so you can represent nested locations (a room inside a
station inside a crater, for example).

### Place fields

| Field | Required? | Type | Description |
|---|---|---|---|
| `name` | Yes | String | The place's full canonical name. |
| `type` | Yes | String | Always `place`. Do not change. |
| `project` | Yes | List | The project slug(s) this place belongs to. |
| `short_name` | No | String | Short display name for wiki references. Defaults to `name`. Example: "Moon Base Delta" → "The Station". |
| `aliases` | No | List | Other names this place is known by, used for auto-linking. |
| `subtype` | No | String | Free-form category. Examples: facility, city, planet, region, vehicle, building. |
| `scope` | No | String | Controlled vocabulary. Controls visual prominence in place listings. Choose one: `primary`, `secondary`, `minor`, `background`. Defaults to `minor`. |
| `size` | No | String | Controlled vocabulary. Physical scale of the place. Choose one: `small` (a room or vehicle), `medium` (a facility or ship), `large` (a city or region), `vast` (a continent or world). |
| `status` | No | String | Free-form current state of the place. Examples: active, abandoned, destroyed, contested, failing. |
| `location` | No | String | Free-form prose describing where this place is. Supports multi-line text. |
| `operator` | No | Wiki-link | The group that runs or owns this place (`[[group-slug]]`). |
| `parent_place` | No | Wiki-link | The larger place this place is contained within (`[[place-slug]]`). |
| `contains` | No | List | Places contained within this place, each as a wiki-link. The generator computes the reverse relationship automatically — you only need to declare it on one side. |
| `image` | No | String | Filename of the place's primary image, relative to the entity folder. Can be a photo, map, or illustration. |
| `image_alt` | Req. if image set | String | Alt text for the image. Required for accessibility. |
| `gallery` | No | List | Additional images. Each entry needs `file`, `alt`, and optionally `caption`. Deferred to a future phase. |
| `tags` | No | List | Free-form tags for categorization and search. |

### A note on place hierarchy

The `parent_place` and `contains` fields let you build a nested location structure. You only need to declare the relationship on one
side — if Place A declares `parent_place: "[[place-b]]"`, Place B automatically knows it contains Place A.

A practical example:

```yaml
# moon-base-delta/index.md
name: "Moon Base Delta"
contains:
  - "[[living-quarters]]"
  - "[[mining-tunnels]]"

# living-quarters/index.md
name: "Living Quarters"
parent_place: "[[moon-base-delta]]"
size: medium
status: failing
```

---

## Groups

A group entity represents any collective in your story world — a corporation, a faction, a family, a crew, a government, a cult. Groups
are the connective tissue between characters: a character's `group` field links them to a group, and the group's member roster is computed automatically. A character can belong to multiple groups (for instance: family, business, political faction).

Groups can also declare relationships with each other — alliances and oppositions — and the generator mirrors those relationships
automatically so you only declare each relationship once.

### Group fields

| Field | Required? | Type | Description |
|---|---|---|---|
| `name` | Yes | String | The group's canonical name. |
| `type` | Yes | String | Always `group`. Do not change. |
| `project` | Yes | List | The project slug(s) this group belongs to. |
| `short_name` | No | String | Short display name for wiki references. Defaults to `name`. |
| `full_name` | No | String | The group's full unabbreviated name, if `name` is an abbreviation or informal shorthand. Example: `name` is "Mizmo", `full_name` is "Mizmo Lunar Operations Corporation". |
| `aliases` | No | List | Other names this group is known by, used for auto-linking. |
| `subtype` | No | String | Free-form category. Examples: corporation, faction, family, crew, government, cult. |
| `status` | No | String | Free-form current state of the group. Examples: active, dissolved, underground, contested. |
| `headquarters` | No | String | Where the group is based. Free-form text or a wiki-link to a place. |
| `founded` | No | String | When the group was founded. Free-form text or a year. |
| `leader` | No | Wiki-link | The character who leads this group (`[[character-slug]]`). |
| `opposed_to` | No | List | Groups this group is opposed to, each as a wiki-link. The generator mirrors the relationship on the other group's page automatically. |
| `allied_with` | No | List | Groups this group is allied with, each as a wiki-link. Mirrored automatically. |
| `image` | No | String | Filename of the group's primary image (logo, banner, insignia). |
| `image_alt` | Req. if image set | String | Alt text for the image. Required for accessibility. |
| `gallery` | No | List | Additional images. Deferred to a future phase. |
| `tags` | No | List | Free-form tags for categorization and search. |

### A note on inter-group relationships

Declare inter-group relationships on whichever group's file makes most narrative sense to you — the generator mirrors them
automatically. If the Mizmo corporation declares `opposed_to: ["[[the-ranchers]]"]`, the Ranchers' page will automatically show Mizmo as an opposition without you having to add anything to the Ranchers' file.

---

## Wiki-links in Entity Prose

The body prose of any entity file — the text below the frontmatter — supports full wiki-link syntax. A character's description can link
to a place. A place's history can link to a group. A group's profile can link to its leader character.

**Basic link:**
```
[[entity-slug]]
```

**Display text override** — shows different text but links to the same page:
```
[[angie-mcdonnell|Angie]]
```

When readers click a wiki-link in entity prose while reading, the linked entity loads in the wiki sidebar without leaving the current
page. Wiki-links in entity prose work the same way as wiki-links in scene prose.

See `REFERENCE.md` for the full wiki-link syntax reference.

---

## The Entity Index

Keely maintains an index of all your entities at build time to power wiki-link resolution in scene prose and entity cross-references. When you add new entities or rename existing ones, you need to rebuild this index before the changes take effect:

```bash
node src/scripts/build-entity-index.mjs
```

Run this from your project root. You only need to run it when you add or rename entities — not every time you edit their content. The
terminal will confirm when the index has been rebuilt.

The Phase 2 editor app will handle this automatically whenever you create or rename an entity.

---

## Next Steps

Your entities are set up and indexed. From here:

**→ `docs/03_images.md`** — add portraits, place images, and cover art to your entities and project pages.

**→ `docs/04_writing-scenes.md`** — write your first scene and start linking it to your entities.
