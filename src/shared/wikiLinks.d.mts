// Types for wikiLinks.mjs, for the app (D-161). Keep in step with the file.

export interface EntityIndexEntry {
  name: string;
  short_name?: string | null;
  type?: string;
  urlPrefix: string;
}

export function resolveWikiLinks(
  text: string,
  options: {
    project: string;
    entityIndex: Record<string, EntityIndexEntry>;
    otherProject?: ((projectSlug: string) => { title?: string; entityIndex: Record<string, EntityIndexEntry> } | null) | null;
    scenes?: { id: string; title: string }[] | null;
    storySlug?: string | null;
    imageBase?: string | null;
  },
): string;

export function autoLinkShortNames(
  text: string,
  entityIndex: Record<string, EntityIndexEntry>,
  options?: { onClash?: (shortName: string, slugs: string[]) => void },
): string;

export interface AliasTarget {
  slug: string;
  name: string;
  shortName?: string | null;
  aliases?: string[];
}

export interface AliasSuggestion {
  from: number;
  to: number;
  alias: string;
  slugs: string[];
}

export function findAliasSuggestions(
  text: string,
  targets: AliasTarget[],
  options?: { plainNames?: string[] },
): AliasSuggestion[];
