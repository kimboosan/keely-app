---
# index.md — Group file
# =====================
# Lives at: projects/my-project/groups/my-group/index.md
# The folder name is the group's slug and becomes their URL.
#
# Required fields: name, type.
# Everything else is optional — omit any field you don't need and
# it will not appear on the page.
#
# NOTE (Phase 1): In the current Astro-based setup, this file lives at
# src/data/projects/my-project/groups/my-group/index.md
# Phase 2 will move it to your content folder root.
# -----------------------------------------------------------------------


# -----------------------------------------------------------------------
# IDENTITY
# -----------------------------------------------------------------------

# The group's canonical name. Required.
name: "My Group"

# The group's full unabbreviated name, if different from `name`.
# Example: name is "Mizmo", full_name is "Mizmo Lunar Operations Corporation"
# If omitted, no full name appears.
full_name: ""

# Short display name used in wiki references throughout the story.
# If omitted, defaults to `name`.
short_name: "Group 1"

# Other names this group is known by. Used for auto-linking.
# If omitted, only `name` and `short_name` trigger auto-links.
aliases:
  - ""

# Always "group" — tells the generator which template to use.
# Required. Do not change this value.
type: group

# Your own free-form category for this group within the story.
# Examples: corporation, faction, family, crew, government, cult
# If omitted, no subtype appears.
subtype: ""

# Current state of the group. Optional, free-form.
# Examples: active, dissolved, underground, contested
status: ""


# -----------------------------------------------------------------------
# ORGANIZATIONAL DETAILS
# -----------------------------------------------------------------------

# Where the group is based. Free-form text.
# If omitted, no headquarters appears.
headquarters: ""

# When the group was founded. Free-form text or a year.
# If omitted, no founded date appears.
founded: ""

# The character who leads this group.
# Use wiki-link format: "[[character-slug]]"
# If omitted, no leader appears.
leader: ""


# -----------------------------------------------------------------------
# INTER-GROUP RELATIONSHIPS
# -----------------------------------------------------------------------
# Use wiki-link format for each entry: "[[group-slug]]"
# The generator computes the reverse relationship automatically —
# you only need to declare it on one side.
# If omitted, no relationships appear.

opposed_to:
  - ""

allied_with:
  - ""


# -----------------------------------------------------------------------
# IMAGES
# -----------------------------------------------------------------------
# Place image files in the same folder as this index.md.
# Reference them here by filename only.
#
# image     — the group's primary image (logo, banner, insignia, etc.).
#             Displays in the wiki pane and on the group page.
# image_alt — required if image is set. Describes the image for
#             screen readers. Never leave this blank if you use an image.
# gallery   — additional images. Each needs a filename, alt text, and
#             optional caption. If omitted, no gallery appears.

image: ""
image_alt: ""
gallery: []

# Gallery example — uncomment and duplicate for each additional image:
# gallery:
#   - file: "my-group-headquarters.jpg"
#     alt: "Exterior of My Group headquarters"
#     caption: "As seen in episode 4"


# -----------------------------------------------------------------------
# TAGS
# -----------------------------------------------------------------------
# Free-form tags for your own categorization and site-wide search.
# If omitted, no tags appear.
tags: []


# -----------------------------------------------------------------------
# PROJECT MEMBERSHIP
# -----------------------------------------------------------------------
# Which project(s) this group belongs to.
# Use the project folder name (slug), not the display title.
# Required for the generator to index this group correctly.
project:
  - "my-project"

---

Write your group description here. This prose appears on the group's
wiki page. Supports full markdown formatting and wiki-links ([[entity-slug]]).

This section is for reader-facing description — history, purpose,
structure, significance to the story. Your private notes belong
in your Obsidian vault, not here.
