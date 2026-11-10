// The site's own addresses (D-168). Every link, script and image a page
// writes goes through `url()`, so the site works in a subfolder (`base`,
// from siteAddress.mjs). `BASE` has no trailing slash: '' at the top of an
// address. Outside a page (astro.config.mjs loading markdown.mjs) there's no
// BASE_URL, and nothing there writes links.
export const BASE = (import.meta.env?.BASE_URL ?? '/').replace(/\/$/, '');
export const url = (path) => `${BASE}${path}`;
