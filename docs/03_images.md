# Images

## Overview

Keely supports images at every level of your project — your publisher identity, your projects and stories, your entities, and inline within scene prose. Images are optional everywhere, but they add significant visual richness to your reader site.

### Co-location

Images in Keely live alongside the content they belong to. A character's portrait lives in the character's folder. A scene's
inline image lives in the scene's folder. A project's cover image lives in the project folder. This is intentional — keeping images
with their content means your files are self-contained and portable. If you move a project folder, everything moves with it.

```
characters/
  angie-mcdonnell/
    index.md
    angie-portrait.jpg     ← lives here, not in a central images folder
scenes/
  01-the-order/
    index.md
    evacuation-notice.png  ← lives here, alongside the scene
```

### Supported formats

Keely accepts JPEG, PNG, WebP, and GIF. For photographs and portraits, JPEG or WebP are recommended. For illustrations, logos, or images with transparency, PNG or WebP are recommended.

### Image optimization

At build time, Keely processes your images through Astro's image optimizer, which converts them to modern formats and generates
responsive sizes automatically. This means your images will load quickly for readers on any device without any extra work from you.

One thing to be aware of: the optimizer renames image files with a hash in the output (e.g. `angie-portrait.jpg` becomes something like
`angie-portrait.abc123.webp`). This is normal and expected — you reference images in your files by their original filename, and the
generator handles the rest.

### Alt text

Alt text is a plain-language description of an image, used by screen readers and displayed when an image fails to load. It is required
whenever you set an image field in Keely — the build will warn you if it's missing.

Good alt text describes what the image shows, not what it represents. "A woman in a grey spacesuit standing at an airlock" is good alt text. "Angie" is not.

For decorative images with no meaningful content, use an empty string: `portrait_alt: ""` — but use this sparingly. Most images in a story wiki carry meaning worth describing.

---

## Publisher and Author Images

### Publisher logo

Set in `publisher.toml` as `logo`. Place the file in `src/data/` and reference it by filename only.

```toml
logo = "my-press-logo.png"
```

The logo appears in the site header across all pages. If omitted, your publisher `name` appears as text instead.

Recommended size: no taller than 60px for clean header display. Use a PNG with transparency for best results.

### Author portrait

Set in `authors.toml` per author entry as `portrait`. Place the file in `src/data/` and reference it by filename only.

```toml
[[authors]]
name = "My Name"
portrait = "my-portrait.jpg"
```

The portrait appears on your about page alongside your bio. If omitted, no image appears.

Recommended size: 300×300px minimum, square crop.

---

## Project Images

Set in `project.toml`. Place image files in your project folder and reference them by filename only.

```toml
cover = "my-project-cover.jpg"
banner = "my-project-banner.jpg"
```

**Cover image** — portrait orientation. Used in storefront grid cards and project listings. Think book cover. If omitted, the project card displays without an image.

Recommended size: 400×600px (2:3 ratio).

**Banner image** — landscape orientation. Used as a hero image at the top of your project landing page. If omitted, no banner appears.

Recommended size: 1200×400px. Keep important content in the center 50% of the image — edges may be cropped on smaller screens.

---

## Story Images

Set in `story.toml`. Place image files in your story folder alongside `story.toml` and reference them by filename only.

```toml
cover = "my-story-cover.jpg"
banner = "my-story-banner.jpg"
```

**Cover image** — same as project cover, used in story listings and on the story landing page. If omitted, no cover appears.

Recommended size: 400×600px (2:3 ratio).

**Banner image** — same as project banner, used at the top of the story landing page. If omitted, no banner appears.

Recommended size: 1200×400px. Keep important content center-frame.

Story images are independent of project images — setting a cover on a project does not automatically apply it to stories within that
project, and vice versa.

---

## Entity Images

### Character portraits

Set `portrait` in the character's `index.md` frontmatter. Place the image file in the character's folder alongside `index.md`.

```yaml
portrait: "angie-portrait.jpg"
portrait_alt: "A woman with dark curly hair in a grey station uniform"
```

The portrait appears in the wiki sidebar when a reader clicks the character's name in scene prose, and on the character's full wiki
page. If omitted, no portrait appears.

Recommended size: 300×400px (3:4 ratio). Square crops also work well.

`portrait_alt` is required whenever `portrait` is set. See the alt text guidance in the Overview section.

### Place and group images

Set `image` in the place or group's `index.md` frontmatter. Place the image file in the entity's folder.

```yaml
image: "moon-base-delta.jpg"
image_alt: "Exterior view of a lunar base inside a crater, lit by floodlights"
```

For places, this can be a photograph, illustration, or map. For groups, this is typically a logo, banner, or insignia.

Recommended size: 600×400px for landscape images; 400×400px for logos or square images.

`image_alt` is required whenever `image` is set.

### Gallery images

All entity types support a `gallery` field for additional images. Gallery rendering is a deferred feature — the field is parsed and
stored but not yet displayed in the reader site. You can populate gallery entries now and they will display automatically when gallery
support ships.

```yaml
gallery:
  - file: "angie-spacesuit.jpg"
    alt: "Angie in a white EVA suit on the lunar surface"
    caption: "On the lunar surface, episode 3"
```

---

## Inline Scene Images

Images can be embedded directly in scene prose using standard markdown image syntax:

```markdown
![Alt text describing the image](image-filename.jpg)
```

Place the image file in the scene's folder alongside `index.md`:

```
scenes/
  01-the-order/
    index.md
    evacuation-notice.png
```

Reference the image by filename only — not a full path. The build script handles finding and serving the image correctly.

### How scene images are served

Scene images are processed differently from entity images. At build time, a script walks your scene folders and copies image files to
`public/scenes/`, mirroring your source folder structure. The scene template generates the correct URL for each image automatically.

This means:
- You never need to manually move images to `public/`
- Images in `public/scenes/` are build artifacts — they're in   `.gitignore` and regenerated on every build
- The only copy of your image that matters is the one in your scene   folder, alongside your `index.md`

If an inline scene image isn't appearing, run a fresh build (`npm run build`) rather than just the dev server — the copy script
runs as part of the full build pipeline.

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

These are recommendations, not requirements. Keely will display whatever you provide — the sizes above just tend to look best in
the default layout.

---

## Next Steps

Your images are in place. From here:

**→ `docs/04_writing-scenes.md`** — write your first scene, add inline images, and start publishing prose to your reader site.
