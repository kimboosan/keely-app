// Links to other websites (D-164): written as ordinary markdown,
// `[text](https://…)`, they open in a new tab so readers keep their place in
// the story, and carry rel="external", which reader.css marks with a small ↗.
//
// One rule for both markdown renderers: `renderProse` (marked: scene prose,
// the home page welcome, author bios) and `rehypeExternalLinks` (Astro's
// processor: entity descriptions, src/utils/markdown.mjs).
import { Marked, Renderer } from 'marked';

// Only absolute web addresses; the site's own links are always relative.
export function isExternalHref(href) {
  return /^https?:\/\//i.test(href ?? '');
}

const marked = new Marked({
  renderer: {
    link(token) {
      if (!isExternalHref(token.href)) return false;
      const html = Renderer.prototype.link.call(this, token);
      return html.replace(/^<a /, '<a target="_blank" rel="noopener external" ');
    },
  },
});

// Markdown as HTML, for prose rendered with marked.
export function renderProse(markdown) {
  return marked.parse(markdown);
}

export function rehypeExternalLinks() {
  const visit = (node) => {
    if (node.type === 'element' && node.tagName === 'a' && isExternalHref(node.properties?.href)) {
      node.properties.target = '_blank';
      node.properties.rel = ['noopener', 'external'];
    }
    node.children?.forEach(visit);
  };
  return visit;
}
