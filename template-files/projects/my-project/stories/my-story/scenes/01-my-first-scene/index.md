---
# index.md — Scene file
# =====================
# Lives at: projects/my-project/stories/my-story/scenes/my-first-scene/index.md
# The folder name is the scene's slug and becomes part of its URL.
#
# IMPORTANT: The numeric prefix on the folder name (e.g. 01-my-first-scene)
# determines reading order. The generator reads folders alphanumerically,
# so 01- comes before 02-, and so on. See REFERENCE.md for folder naming
# conventions and how to renumber scenes.
#
# Required fields: type, status, narrative_mode.
# Additional required fields when status is "published":
#   first_published_date, last_published_date, word_count
# Everything else is optional.
#
# NOTE (Phase 1): In the current Astro-based setup, this file lives at
# src/data/projects/my-project/stories/my-story/scenes/my-first-scene/index.md
# Phase 2 will move it to your content folder root.
# -----------------------------------------------------------------------


# -----------------------------------------------------------------------
# IDENTITY & WORKFLOW
# -----------------------------------------------------------------------

# Display title of the scene. Optional.
# If omitted, the generator humanizes the folder name
# (e.g. "01-my-first-scene" becomes "My First Scene").
title: "My First Scene"

# Always "scene" — tells the generator which template to use.
# Required. Do not change this value.
type: scene

# Publication status. Required.
# Controlled vocabulary — choose exactly one:
#   drafting | revising | in-beta | finalized | published
#
# Only "published" scenes appear on the reader site.
# All other statuses are treated as drafts and are not built.
status: drafting


# -----------------------------------------------------------------------
# DATES & WORD COUNT
# -----------------------------------------------------------------------
# These three fields are required when status is "published".
# You can leave them blank while drafting — the build will warn you
# if they are missing when you publish.
#
# first_published_date — set once, on first publication. Never change it.
# last_published_date  — update every time you re-publish after revisions.
#                        Equals first_published_date on first publication.
# word_count           — enter manually in Phase 1. The Phase 2 editor
#                        app will fill this in automatically.

first_published_date: ""
last_published_date: ""
word_count: ""


# -----------------------------------------------------------------------
# READER-FACING
# -----------------------------------------------------------------------

# A one or two sentence summary shown at the top of the scene page,
# before the prose. Plain text only — no markdown or wiki-links.
# If omitted, no summary appears.
summary: ""

# Content warnings for this scene specifically. Optional and additive —
# these layer on top of the story-level warnings set in story.toml.
# They do not replace the story-level warnings.
# See REFERENCE.md for the full additional vocabulary list.
content_warnings:
  additional: []
  custom: []

# Author's notes for this scene. Optional. Supports markdown and
# wiki-links ([[entity-slug]]).
# top    — appears above the scene prose, after any warning banner.
# bottom — appears after the scene prose, before prev/next navigation.
# If omitted or left empty, neither appears.
authors_notes:
  top: ""
  bottom: ""


# -----------------------------------------------------------------------
# NARRATIVE METADATA
# -----------------------------------------------------------------------

# How the scene is narrated. Required.
# Controlled vocabulary — choose exactly one:
#   first-person | third-limited | third-omniscient | second-person |
#   third-objective | epistolary | unreliable
# See REFERENCE.md for descriptions of each mode.
narrative_mode: third-limited

# The character whose perspective drives this scene. Optional.
# Use wiki-link format: "[[character-slug]]"
# Omit for omniscient, ensemble, or non-POV scenes.
# Only scenes with pov_character set are visible to readers following
# a POV-filtered through-line for that character.
pov_character: ""

# All characters who appear in this scene. Optional but recommended —
# this is how the generator builds "appears in" lists on character pages.
# Use wiki-link format for each. Include the POV character if set.
characters_in_scene:
  - ""

# The primary location of this scene. Optional but recommended —
# this is how the generator builds "scenes at this location" lists
# on place pages.
# Use wiki-link format: "[[place-slug]]"
scene_location: ""

# Secondary locations, if the scene moves between places. Optional.
# Use wiki-link format for each.
also_at:
  - ""


# -----------------------------------------------------------------------
# THREADS
# -----------------------------------------------------------------------
# Story threads let readers follow a subset of scenes — a subplot,
# a character's storyline, or a parallel narrative strand.
#
# "main" is implicit and should NOT be listed here — every scene is
# automatically part of the main reading order.
# Only list threads this scene belongs to beyond the main order.
# Threads are free-form — invent names that make sense for your story.
# Maximum 50 thread values across the whole story.
#
# If omitted, the scene appears only in the main reading order.
threads: []


# -----------------------------------------------------------------------
# TAGS
# -----------------------------------------------------------------------
# Free-form tags for your own categorization and site-wide search.
# If omitted, no tags appear.
tags: []


# -----------------------------------------------------------------------
# CYOA HOOKS (future feature — Phase 1 safe to ignore)
# -----------------------------------------------------------------------
# These fields are reserved for future choose-your-own-adventure
# branching navigation. The Phase 1 generator reads but ignores them.
# Leave as-is unless you want to plan your branches in advance.
#
# choice_point        — marks this scene as a reader branching point.
# next_scene_branches — the choices offered to the reader, each with
#                       a label and a destination scene wiki-link.
#
# Example when active:
#   choice_point: true
#   next_scene_branches:
#     - label: "Follow Peter"
#       scene: "[[02-peters-office]]"
#     - label: "Stay with Angie"
#       scene: "[[02-angie-waits]]"

choice_point: false
next_scene_branches: []

---

Write your scene prose here. This is what readers see.

Supports full markdown formatting. Wiki-links ([[entity-slug]]) in your
prose are clickable — readers can click a character or place name and
see their wiki entry in the sidebar without leaving the scene.

Delete this placeholder text before publishing.
