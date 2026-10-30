// Types for entityTypes.mjs, for the app (D-161). Keep in step with the file.

export const BUILT_IN_ENTITY_TYPES: string[];
export const RESERVED_TYPE_NAMES: Set<string>;

export interface CustomTypeDeclaration {
  name: string;
  singular?: string;
  plural?: string;
  [key: string]: unknown;
}

export function customTypesOf(projectConfig: { entity_types?: CustomTypeDeclaration[] }): CustomTypeDeclaration[];
export function customTypeDeclaration(
  typeName: string,
  projectConfig: { entity_types?: CustomTypeDeclaration[] },
  allProjectConfigs: { entity_types?: CustomTypeDeclaration[] }[],
): CustomTypeDeclaration | null;
export function entityProject(projectField: unknown): string | null;
