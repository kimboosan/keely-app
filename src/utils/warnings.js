import { DATA } from './vault.mjs';
import { readFileSync } from 'fs';

const vocabulary = JSON.parse(readFileSync(`${DATA}/warnings-vocabulary.json`, 'utf-8'));

function toLookup(entries) {
  return Object.fromEntries(entries.map(({ slug, label }) => [slug, label]));
}

export const REQUIRED_WARNINGS = toLookup(vocabulary.required);
export const ADDITIONAL_WARNINGS = toLookup(vocabulary.additional);

export function getWarningLabel(slug) {
  return REQUIRED_WARNINGS[slug] ?? ADDITIONAL_WARNINGS[slug] ?? slug.replace(/-/g, ' ');
}
