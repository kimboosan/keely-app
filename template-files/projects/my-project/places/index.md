---
# index.md — Place file
# =====================
# Lives at: projects/my-project/places/my-place/index.md
# The folder name is the place's slug and becomes their URL.
#
# Required fields: name, type.
# Everything else is optional — omit any field you don't need and
# it will not appear on the page.
#
# NOTE (Phase 1): In the current Astro-based setup, this file lives at
# src/data/projects/my-project/places/my-place/index.md
# Phase 2 will move it to your content folder root.
# -----------------------------------------------------------------------


# -----------------------------------------------------------------------
# IDENTITY
# -----------------------------------------------------------------------

# The place's full canonical name. Required.
name: "My Place"

# Short display name used in wiki references throughout the story.
# If omitted, defaults to `name`.
# Example: name is "Moon Base Delta", short_name is "The Station"
short_name: "Place 1"

# Other names this place is known by. Used for auto-linking —
# if a scene mentions "The Station", it can auto-link to this place's page.
# If omitted, only `name` and `short_name` trigger auto-links.
aliases:
  - ""

# Always "place" — tells the generator which template to use.
# Required. Do not change this value.
type: place

# Your own free-form category for this place within the story.
# Examples: facility, city, planet, region, vehicle, building
# If omitted, no subtype appears.
subtype: ""

# Rendering weight — controls visual prominence in listings.
# Controlled vocabulary — choose one:
#   primary | secondary | minor | background
# If omitted, defaults to "minor".
# See REFERENCE.md for how scope affects rendering.
scope: "minor"

# Size descriptor. Optional, free-form.
# Examples: vast, medium, small, cramped, planetary
size: ""

# Current state of the place. Optional, free-form.
# Examples: active, abandoned, destroyed, contested, failing
status: ""


# -----------------------------------------------------------------------
# GEOGRAPHICAL DETAILS
# -----------------------------------------------------------------------

# Free-form prose describing where this place is located.
# Supports plain text or multi-line block (use >).
# If omitted, no location section appears.
location: >
  

# The group that runs or owns this place. Use wiki-link format: "[[group-slug]]"
# If omitted, no operator appears.
operator: ""

# The larger place this place is contained within.
# Use wiki-link format: "[[place-slug]]"
# If omitted, no parent place appears.
parent_place: ""

# Places contained within this place.
# Use wiki-link format for each: "[[place-slug]]"
# The generator computes the reverse relationship automatically —
# you only need to declare it on one side.
# If omitted, no contains list appears.
contains:
  - ""


# -----------------------------------------------------------------------
# IMAGES
# -----------------------------------------------------------------------
# Place image files in the same folder as this index.md.
# Reference them here by filename only.
#
# image     — the place's primary image. Displays in the wiki pane
#             and on the place page. Can be a photo, map, or illustration.
# image_alt — required if image is set. Describes the image for
#             screen readers. Never leave this blank if you use an image.
# gallery   — additional images. Each needs a filename, alt text, and
#             optional caption. If omitted, no gallery appears.

image: ""
image_alt: ""
gallery: []

# Gallery example — uncomment and duplicate for each additional image:
# gallery:
#   - file: "my-place-interior.jpg"
#     alt: "Interior view of My Place"
#     caption: "The main corridor, episode 2"


# -----------------------------------------------------------------------
# TAGS
# -----------------------------------------------------------------------
# Free-form tags for your own categorization and site-wide search.
# If omitted, no tags appear.
tags: []


# -----------------------------------------------------------------------
# PROJECT MEMBERSHIP
# -----------------------------------------------------------------------
# Which project(s) this place belongs to.
# Use the project folder name (slug), not the display title.
# Required for the generator to index this place correctly.
project:
  - "my-project"

---

Write your place description here. This prose appears on the place's
wiki page. Supports full markdown formatting and wiki-links ([[entity-slug]]).

This section is for reader-facing description — history, atmosphere,
physical details, significance to the story. Your private notes belong
in your Obsidian vault, not here.

---


