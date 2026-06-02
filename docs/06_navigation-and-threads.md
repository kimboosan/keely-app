# Navigation and Threads

## Overview

Keely gives readers three ways to move through your story: the main reading order, POV-filtered navigation, and story threads. Together these are called **through-line navigation** — each one is a different path through the same set of scenes.

Readers switch between navigation modes using the navigation panel in the wiki sidebar. The mode they're in determines which scenes appear in the prev/next buttons and the scene list.

All three modes are available to readers automatically. You don't need to configure anything to enable them — you simply populate the relevant frontmatter fields in your scene files and Keely handles the rest.

---

## The Main Reading Order

The main reading order is the default through-line — the sequence every reader starts on. It includes every published scene in your story, in the order determined by your scene folder numbering.

Every scene is automatically part of the main reading order. You don't declare it anywhere; it's implicit. The prev/next buttons on scene pages follow the main order unless the reader has switched to a different mode.

The main reading order is determined entirely by folder structure — scene `01-` comes before `02-`, which comes before `03-`, straight through the story regardless of chapter or arc containers. See `docs/04_writing-scenes.md` for scene numbering conventions.

---

## POV-Filtered Navigation

POV filtering lets readers follow the story through the eyes of a single character, seeing only the scenes where that character is the point-of-view narrator.

To make a scene part of a character's POV thread, set `pov_character` in the scene's frontmatter:

```yaml
pov_character: "[[angie-mcdonnell]]"
```

Only scenes with `pov_character` set are visible in POV-filtered navigation. Scenes without a POV character set — omniscient scenes, ensemble scenes, or scenes you've chosen not to tag — appear only in the main reading order.

Readers access POV filtering through the navigation panel in the wiki sidebar. They select a character from the list of available POV characters and the prev/next buttons update to reflect only that character's scenes.

**When to use POV filtering:** POV filtering works best for stories with multiple distinct POV characters whose storylines interweave — readers who want to follow one character's arc without interruption can do so, while readers who want the full experience follow the main order.

If your story is written entirely from one character's POV, you can still set `pov_character` on every scene — it doesn't hurt anything — but it doesn't add much value for readers since the POV filter and the main order will be identical.

---

## Story Threads

Threads are named subsets of scenes that readers can follow independently of the main order or POV filtering. They're the most flexible navigation tool — use them for subplots, parallel storylines, thematic arcs, or any other grouping that makes sense for your story.

Declare threads in the scene's frontmatter as a list of free-form strings:

```yaml
threads:
  - angies-arc
  - evacuation-plot
```

A scene can belong to any number of threads. Every scene is automatically part of the main reading order whether or not it belongs to any threads — threads are additional memberships, not replacements.

**Do not include "main" in your threads list.** Every scene is already part of the main order implicitly. Adding "main" as a thread value has no effect and clutters your frontmatter.

Thread names are free-form — invent whatever names make sense for your story. Use lowercase slugs with hyphens, consistent across all your scene files. The navigation panel displays thread names to readers, so choose names that are meaningful to them, not just to you as the author.

```yaml
# Good thread names — meaningful to readers
threads:
  - peters-perspective
  - the-wadi-investigation

# Less good — meaningful only to the author
threads:
  - subplot-b
  - arc3-scenes
```

**When to use threads:** threads are most useful when your story has distinct narrative strands that some readers may want to follow in isolation — a mystery subplot, a romance arc, a political storyline running alongside the main action. They're also useful for stories with a large cast where different readers care about different groups of characters.

If your story is straightforward and linear, you may not need threads at all. Don't add complexity for its own sake.

**Maximum threads:** a story can have a maximum of 50 distinct thread values across all its scenes.

---

## The Navigation Panel

The navigation panel lives in the wiki sidebar and is accessible from every scene page. It shows:

- The current through-line mode (main, POV character, or thread)
- A switcher to change modes
- The full scene list for the current mode, with the current scene highlighted
- Prominent prev/next buttons

Readers can collapse the navigation panel if they want to focus on reading. Their panel state is preserved in their browser.

The navigation panel also shows the story hierarchy — arc and chapter containers appear as groupings in the scene list, so readers can see where they are in the larger structure at a glance.

---

## Next Steps

**→ `docs/07_customization.md`** — customize your site's appearance and reader defaults to match your project's identity.
