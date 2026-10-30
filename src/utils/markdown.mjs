// Markdown for entity pages (characters, places, groups, custom types): the
// author's description, and custom types' `text` fields, with Keely's [[…]]
// links resolved, rendered with the same options Astro uses for the site
// (astro.config.mjs imports `markdownOptions` from here, so the two can't
// drift apart).
//
// Entity pages render this way, not with astro:content's render(), because
// links need resolving before markdown runs — render() gives no way in —
// and their URLs depend on which project's page is being built.
// @astrojs/markdown-remark is pinned to the version Astro itself uses.
//
// Scene prose is rendered separately, with `marked` (scene page), through
// the same link rules (wikiLinks.mjs, and externalLinks.mjs for web links).
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { rehypeCollapseSpoilers } from './rehype-collapse-spoilers.js';
import { rehypeExternalLinks } from './externalLinks.mjs';
import { resolveWikiLinks } from '../shared/wikiLinks.mjs';
import { readEntityIndex, readOtherProject } from './projectIndex.mjs';

export const markdownOptions = {
  rehypePlugins: [rehypeCollapseSpoilers, rehypeExternalLinks],
};

let processor;

// Markdown from an entity — its description, or a custom type's multi-line
// (`text`) field — as HTML, for `<Fragment set:html={…} />`.
export async function renderEntityMarkdown(markdown, project) {
  processor ??= await createMarkdownProcessor(markdownOptions);
  const { code } = await processor.render(resolveWikiLinks(markdown, { project, entityIndex: readEntityIndex(project), otherProject: readOtherProject }));
  return code;
}
