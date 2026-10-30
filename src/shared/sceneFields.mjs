// Scene frontmatter field names that both the generator and the app need —
// one copy (D-161).
//
// Author's notes on a scene are `author_notes`, the name project.toml and
// story.toml use too (D-162). Scenes used to call them `authors_notes`
// (Keely 0.7 and earlier, and its starter files), and files with that
// spelling keep working: the generator reads them with a build note, and the
// app edits whichever spelling the file already has.

export const SCENE_NOTES_FIELD = 'author_notes';
export const OLD_SCENE_NOTES_FIELD = 'authors_notes';

// The notes field a scene's frontmatter uses: the old spelling only when it's
// the one there. A scene with neither gets the current one.
export function sceneNotesField(data) {
  const has = (key) => data != null && data[key] != null;
  return !has(SCENE_NOTES_FIELD) && has(OLD_SCENE_NOTES_FIELD) ? OLD_SCENE_NOTES_FIELD : SCENE_NOTES_FIELD;
}
