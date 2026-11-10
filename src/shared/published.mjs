// The one rule for what reaches readers (D-168, format spec): a scene whose
// `status` is `published`. Every other status stays on the author's
// computer. Pages, the index steps and the site summary all ask here.
export const isPublished = (frontmatter) => frontmatter?.status === 'published';
