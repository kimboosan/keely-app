// Types for sceneFields.mjs, for the app (D-161). Keep in step with the file.

export const SCENE_NOTES_FIELD: 'author_notes';
export const OLD_SCENE_NOTES_FIELD: 'authors_notes';
export function sceneNotesField(data: Record<string, unknown> | null | undefined): 'author_notes' | 'authors_notes';
