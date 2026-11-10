// Where the finished site will live on the web (D-168), from the `address`
// in `keely-hosting.toml` beside the vault's `src/`. A host may put the site
// in a subfolder (`https://example.com/stories/`), so every address the site
// writes is under `base` (src/utils/url.js). With no file, or no address,
// the site sits at the top of whatever address it's served from.
import { existsSync, readFileSync } from 'fs';
import { parse } from 'smol-toml';
import { HOSTING } from './vault.mjs';

const TOP = { site: undefined, base: '/' };

export function siteAddress() {
  if (!existsSync(HOSTING)) return TOP;
  let address;
  try {
    address = parse(readFileSync(HOSTING, 'utf-8')).address;
  } catch {
    throw new Error('Keely couldn’t read keely-hosting.toml, so it doesn’t know where your site will live.');
  }
  if (address === undefined || String(address).trim() === '') return TOP;

  let url = null;
  try {
    url = new URL(String(address).trim());
  } catch {
    // Not an address at all; reported below.
  }
  if (!url || !/^https?:$/.test(url.protocol)) {
    throw new Error(`The site address “${address}” in keely-hosting.toml isn’t a web address. It should start with https://`);
  }
  return { site: url.origin, base: url.pathname.replace(/\/+$/, '') || '/' };
}
