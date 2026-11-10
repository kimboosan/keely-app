// Types for names.mjs, for the app (D-161, D-180, D-181). Keep in step with the file.

export type StoryFormat = 'current' | 'marker' | 'by-position';

export interface StoryNames {
  format: StoryFormat;
  scenes: Map<string, string>;
  containers: Map<string, { kind: 'arc' | 'chapter' | 'interlude'; level: 'arc' | 'chapter'; slug: string; number: number | null }>;
  repeats: { kind: 'scene' | 'container'; slug: string; paths: string[] }[];
}

export function nameStory(scenePaths: string[], containerPaths?: string[]): StoryNames;

export function compareNames(a: string, b: string): number;

export function containerLabel(name: string, title?: string, number?: number, options?: { format?: StoryFormat }): string;
