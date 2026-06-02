# Content Warnings

## Overview

Keely has a built-in content warnings system designed to give readers the information they need before they start reading. Content warnings work at four levels — publisher, project, story, and scene — each layering on top of the last in a cascade.

The cascade works like this:
- **Publisher level** — on or off for the whole site
- **Project level** — optional umbrella warnings that apply to all stories in the project
- **Story level** — mandatory declaration, specific to each story
- **Scene level** — optional additions specific to individual scenes

### The philosophy

Content warnings are **mandatory at the story level**. Every story must declare exactly one value in `content_warnings.required`. This
is intentional and deliberate: "no warnings apply" is not the default assumption — it is a conscious statement that an author makes. Readers who rely on content warnings to protect their wellbeing deserve that signal, and "I forgot to set it" is not a meaningful answer to them.

`no-warnings-apply` is a perfectly valid choice. It simply has to be a choice, not an omission.

The build will warn you in the terminal if a published story is missing its required warning declaration.

---

## Publisher Level — Enabling or Disabling Warnings Site-Wide

The content warnings system is controlled at the top level by `required_warnings` in `publisher.toml`.

```toml
required_warnings = true   # default — warnings are active site-wide
```

Setting this to `false` disables the entire content warnings system for your whole Keely instance:

```toml
required_warnings = false
```

When disabled:
- The mandatory `content_warnings.required` declaration is no longer required in any story
- Warning banners do not appear on any scene pages
- The reader toggle for warnings is removed from the reader UI

**This is not recommended.** Readers who rely on content warnings have no way of knowing a site has disabled them — they will simply
not see any warnings and may encounter content they were not prepared for. This option exists for authors who are philosophically opposed to providing content warnings, but the default should always be warnings on.

If you disable warnings at the publisher level, all project, story, and scene warning declarations are ignored.

---

## Project Level — Umbrella Warnings

Project-level warnings are optional. If set, they act as umbrella warnings that cascade to every story in the project — every story
inherits them and cannot remove them.

Set them in the `[content_warnings]` block in `project.toml`:

```toml
[content_warnings]
required = "graphic-violence"
additional = ["character-death"]
custom = []
```

Use project-level warnings when a theme or content type runs through your entire project and applies to every story within it, so you
don't have to repeat yourself in every `story.toml`.

If the `[content_warnings]` block is omitted entirely from `project.toml`, no umbrella warnings are set and each story manages
its own warnings independently. This is the normal case for projects where stories have different content profiles.

---

## Story Level — The Mandatory Declaration

Story-level warnings are declared in the `[content_warnings]` block in `story.toml`. They apply to the story as a whole and appear on
the story landing page and as a banner on every scene.

```toml
[content_warnings]
required = "character-death"
additional = ["graphic-violence"]
custom = ["prolonged depiction of grief"]
```

### The required field

Choose exactly one value from the required vocabulary. This field is mandatory for every published story (unless warnings have been
disabled at the publisher level).

| Value | Meaning |
|---|---|
| `no-warnings-apply` | No significant warnings apply to this story |
| `graphic-violence` | Significant violent content |
| `character-death` | A named character dies |
| `sexual-content` | Sexual content present — use alongside a Mature or Explicit rating |
| `non-consent` | Non-consensual situations depicted |
| `creator-chose-not-to-warn` | You have chosen not to disclose specific warnings |

`creator-chose-not-to-warn` is a valid choice, consistent with common online reader conventions. It signals to readers that warnings exist but you have chosen not to specify them — which is different from "no warnings apply." Use it deliberately, not as a shortcut.

### The additional field

Zero or more values from the additional vocabulary. These supplement the required declaration with more specific warnings.

| Value | Notes |
|---|---|
| `grief` | |
| `death` | |
| `dying` | |
| `medical-content` | Surgery, illness, medical procedures |
| `mental-health` | |
| `abuse` | Physical, emotional, or psychological |
| `alcohol-drugs` | |
| `strong-language` | |
| `sexual-references` | |
| `body-horror` | |
| `trauma` | |
| `self-harm` | |

### The custom field

Zero or more free-form strings you write yourself. Use these for anything not covered by the additional vocabulary — specific phobias,
particular themes, or content that needs more precise description than the standard vocabulary allows.

```toml
custom = [
  "prolonged depiction of grief",
  "claustrophobia",
  "depiction of a panic attack"
]
```

Custom warnings are specific to your story and are not searchable across the site. They display exactly as written on your story and
scene pages.

---

## Scene Level — Additive Warnings

Individual scenes can carry their own content warnings on top of the story-level warnings. Scene-level warnings are **always additive** — they layer on top of the story-level declaration and never replace it.

Use scene-level warnings for content that appears in a specific scene but doesn't apply to the whole story. A story with `no-warnings-apply` at the story level can still flag a single scene for specific content.

Set scene-level warnings in the scene's `index.md` frontmatter:

```yaml
content_warnings:
  additional:
    - graphic-violence
    - body-horror
  custom:
    - "depiction of a panic attack"
```

Scene-level warnings do not have a `required` field — only `additional` and `custom`. The story-level `required` declaration always stands.

Scene-level warnings appear as an additional note in the content warning banner for that specific scene, beneath the story-level
warnings.

---

## Reader-Facing Display

### The warning banner

Content warnings appear as a dismissible banner at the top of each scene page, before the scene prose. The banner displays:

- The story-level required warning
- Any story-level additional and custom warnings
- Any scene-level additional and custom warnings specific to that scene
- Any project-level umbrella warnings inherited by this story

Readers can dismiss the banner for the current scene by clicking a close button. Dismissal is per-scene and per-session — the banner
reappears on the next scene.

### The reader toggle

Readers can turn content warning banners on or off using a toggle on the scene page itself. Their preference is stored in their browser and persists across all scenes — so a reader who dismisses warnings on one scene won't see the banner again on subsequent scenes until they clear their browser storage or toggle it back on

Turning off the banner does not mean warnings are ignored — it means the reader has chosen to manage their own experience. The warnings
are still declared and still appear on story landing pages.

### Setting the default

The default state of the warning banner — shown or hidden on a reader's first visit — is controlled by `show_content_warnings` in
the `[reader_defaults]` block of `project.toml` or `story.toml`.

```toml
[reader_defaults]
show_content_warnings = true  # recommended default
```

This defaults to `true` if omitted. Setting it to `false` hides warning banners by default for first-time visitors, though readers
can still turn them on manually. This is not recommended — readers who need warnings should not have to go looking for them.

---

## Next Steps

**→ `docs/06_navigation-and-threads.md`** — set up through-line navigation, POV filters, and story threads to give readers control
over how they move through your story.
