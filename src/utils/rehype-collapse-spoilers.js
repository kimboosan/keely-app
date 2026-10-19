// Entity description sections are serialized by the Phase 2 app's editor as
// flat `## Label` markdown headings (src/lib/entityFile.ts's
// parseSections/serializeSections) — there is no structured "spoiler" field,
// just a reserved section label authors can add like any other ("Backstory",
// "History", etc.). This plugin finds a top-level heading whose text is
// exactly "Spoilers" (case-insensitive), and wraps it plus everything up to
// the next heading in a collapsed <details> — moved to the end of the
// content regardless of where the author placed it, since "spoilers last" is
// the expected convention. No match, no change.

function headingText(node) {
  if (node.type === 'text') return node.value;
  if (node.children) return node.children.map(headingText).join('');
  return '';
}

export function rehypeCollapseSpoilers() {
  return (tree) => {
    const children = tree.children;
    let start = -1;
    let end = children.length;

    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (node.type !== 'element' || node.tagName !== 'h2') continue;
      if (start === -1) {
        if (headingText(node).trim().toLowerCase() === 'spoilers') {
          start = i;
        }
        continue;
      }
      end = i;
      break;
    }

    if (start === -1) return;

    const section = children.splice(start, end - start);
    const content = section.slice(1); // drop the heading itself — its text becomes the <summary>

    children.push({
      type: 'element',
      tagName: 'details',
      properties: { className: ['spoiler-section'] },
      children: [
        {
          type: 'element',
          tagName: 'summary',
          properties: {},
          children: [{ type: 'text', value: 'Spoilers' }],
        },
        ...content,
      ],
    });
  };
}
