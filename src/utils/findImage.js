// Looks up an image from an `import.meta.glob('@vault/...')` result by its
// path *within the vault* (e.g. `content/characters/li/li.png`).
//
// Glob keys depend on where the vault sits relative to the generator — a
// vault inside it yields `/src/content/...`, one outside yields
// `../other/src/content/...` — so matching on the vault-relative ending is
// the only lookup that works for both (D-148).
export function findImage(images, vaultRelativePath) {
  const suffix = `/src/${vaultRelativePath}`;
  const entry = Object.entries(images).find(([key]) => key.endsWith(suffix));
  return entry?.[1]?.default;
}
