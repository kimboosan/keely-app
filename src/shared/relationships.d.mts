// Types for the app (D-161, D-176). The rules are in relationships.mjs.

export interface SceneInput {
  storySlug: string;
  slug: string;
  path?: string;
  data: Record<string, unknown> | null | undefined;
  body?: string;
}

export interface EntityInput {
  type: string;
  slug: string;
  data: Record<string, unknown> | null | undefined;
  body?: string;
}

export interface StoryInput {
  slug: string;
  data: Record<string, unknown> | null | undefined;
  containers?: { path: string; data: Record<string, unknown> | null | undefined; slug?: string; number?: number | null; format?: string }[];
}

export interface FeaturedInStory {
  storySlug: string;
  title: string;
  /** The story itself features it. */
  story: boolean;
  /** Arcs and chapters that feature it. */
  containers: { path: string; slug?: string; label: string }[];
  /** Scenes that feature it themselves. */
  scenes: SceneRef[];
}

export interface SceneRef {
  storySlug: string;
  slug: string;
  path: string;
  title: string;
}

export interface EntityMention {
  type: string;
  slug: string;
  name: string;
}

export interface Relationships {
  appearsIn: Record<string, SceneRef[]>;
  atLocation: Record<string, SceneRef[]>;
  mentionedIn: Record<string, SceneRef[]>;
  mentionedBy: Record<string, EntityMention[]>;
  groupMembers: Record<string, { slug: string; name: string }[]>;
  groupRelations: Record<string, { opposed_to: string[]; allied_with: string[] }>;
  featuredIn: Record<string, Record<string, FeaturedInStory[]>>;
}

export function computeRelationships(input: {
  scenes?: SceneInput[];
  stories?: StoryInput[];
  entities?: EntityInput[];
  includeDrafts?: boolean;
  autoLink?: boolean;
  onClash?: (shortName: string, slugs: string[]) => void;
}): Relationships;

export function entityLists(
  relationships: Relationships,
  type: string,
  slug: string,
): {
  appearsIn: SceneRef[];
  atLocation: SceneRef[];
  mentionedIn: SceneRef[];
  mentionedBy: EntityMention[];
  members: { slug: string; name: string }[];
  opposedTo: string[];
  alliedWith: string[];
  featuredIn: FeaturedInStory[];
};
