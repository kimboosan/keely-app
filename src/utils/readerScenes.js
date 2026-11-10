import { getCollection } from 'astro:content';
import { isPublished } from './published.mjs';

// The scenes a page may show (D-168). Only published scenes reach a real
// build; the preview shows every scene, so an author can read work in
// progress. Pages get their scenes here, so a draft can't slip into a list.
export async function getReaderScenes() {
  const scenes = await getCollection('scenes');
  return import.meta.env.DEV ? scenes : scenes.filter((scene) => isPublished(scene.data));
}
