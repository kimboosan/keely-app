---
# index.md — Character file
# ==========================
# Lives at: projects/my-project/characters/my-character/index.md
# The folder name is the character's slug and becomes their URL.
#
# Required fields: name, type.
# Everything else is optional — omit any field you don't need and
# it will not appear on the page.
#
# NOTE (Phase 1): In the current Astro-based setup, this file lives at
# src/data/projects/my-project/characters/my-character/index.md
# Phase 2 will move it to your content folder root.
# -----------------------------------------------------------------------


# -----------------------------------------------------------------------
# IDENTITY
# -----------------------------------------------------------------------

# The character's full canonical name. Required.
name: "My Character"

# Short display name used in wiki references throughout the story.
# If omitted, defaults to `name`.
# Example: name is "Angela McDonnell", short_name is "Angie"
short_name: "Character 1"

# Other names this character is known by. Used for auto-linking —
# if a scene mentions "Exec", it can auto-link to this character's page.
# If omitted, only `name` and `short_name` trigger auto-links.
aliases:
  - ""

# Always "character" — tells the generator which template to use.
# Required. Do not change this value.
type: character

# Your own free-form category for this character within the story.
# Examples: crew, antagonist, love-interest, minor, suspect
# If omitted, no subtype appears.
subtype: ""

# Rendering weight — controls visual prominence in listings.
# Controlled vocabulary — choose one:
#   main | secondary | minor | background
# If omitted, defaults to "minor".
# See REFERENCE.md for how role affects rendering.
role: "minor"

# Narrative function — free-form, for your own reference.
# Examples: protagonist, antagonist, mentor, comic-relief, foil
# If omitted, no function appears on the page.
function: ""


# -----------------------------------------------------------------------
# BIOGRAPHICAL DETAILS
# -----------------------------------------------------------------------

# Age — a number or a string ("mid-thirties", "unknown"). Optional.
age: ""

# Job title or occupation. Optional.
occupation: ""

# Formal title (Captain, Dr., etc.). Optional.
title: ""

# Physical description. Supports plain text or multi-line block (use >).
# If omitted, no appearance section appears.
appearance: >
  


# -----------------------------------------------------------------------
# IMAGES
# -----------------------------------------------------------------------
# Place image files in the same folder as this index.md.
# Reference them here by filename only.
#
# portrait     — the character's primary image. Displays in the wiki pane
#                and on the character page.
# portrait_alt — required if portrait is set. Describes the image for
#                screen readers. Never leave this blank if you use a portrait.
# gallery      — additional images. Each needs a filename, alt text, and
#                optional caption. If omitted, no gallery appears.

portrait: ""
portrait_alt: ""
gallery: []

# Gallery example — uncomment and duplicate for each additional image:
# gallery:
#   - file: "my-character-2.jpg"
#     alt: "My Character in a spacesuit"
#     caption: "On the lunar surface, episode 3"


# -----------------------------------------------------------------------
# RELATIONSHIPS
# -----------------------------------------------------------------------

# Groups this character belongs to. Use wiki-link format: "[[group-slug]]"
# The group's page will automatically list this character as a member.
# If omitted, this character appears in no group rosters.
group:
  - ""

# Relationships with other characters or entities.
# entity   — wiki-link to the related entity: "[[character-slug]]"
# relationship — free-form description: sibling, mentor, rival, ally
# If omitted, no relationships section appears.
related_to:
  - entity: ""
    relationship: ""

# -----------------------------------------------------------------------
# TAGS
# -----------------------------------------------------------------------
# Free-form tags for your own categorization and site-wide search.
# If omitted, no tags appear.
tags: []


# -----------------------------------------------------------------------
# PROJECT MEMBERSHIP
# -----------------------------------------------------------------------
# Which project(s) this character belongs to.
# Use the project folder name (slug), not the display title.
# Required for the generator to index this character correctly.
project:
  - "my-project"

---

Write your character description here. This prose appears on the character's
wiki page. Supports full markdown formatting and wiki-links ([[entity-slug]]).

This section is for reader-facing description — background, personality,
role in the story. Your private notes belong in your Obsidian vault,
not here.

---

