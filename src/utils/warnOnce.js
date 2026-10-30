// A build note said once per build, however many pages hit the same thing
// (a shared header, an entity built for every project).
const said = new Set();

export function warnOnce(message) {
  if (said.has(message)) return;
  said.add(message);
  console.warn(message);
}
