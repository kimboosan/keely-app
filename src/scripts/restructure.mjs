// restructure.mjs — command-line front door to the story restructure
// engine (D-157). The desktop app runs it with --json; authors who work in
// files run it directly.
//
//   npm run restructure -- show <story>                 the story's current structure
//   npm run restructure -- tidy <story> [--apply]       renumber cleanly in the current order
//   npm run restructure -- plan <story> <request|->     preview a new order (JSON request)
//   npm run restructure -- apply <story> <plan|->       apply a previewed plan (JSON)
//   npm run restructure -- recover <story>              undo an interrupted change
//
// Add --json for machine-readable output: { ok: true, … } or
// { ok: false, error: { code, message } }. `-` reads the JSON from stdin.

import { readFileSync } from 'fs';
import { join } from 'path';
import { CONTENT, CACHE } from '../utils/vault.mjs';
import { readStory } from '../structure/read.mjs';
import { readOutline } from '../structure/outline.mjs';
import { planRestructure } from '../structure/plan.mjs';
import { applyPlan, journalPathFor, recoverInterrupted } from '../structure/apply.mjs';
import { StructureError } from '../structure/errors.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const doApply = args.includes('--apply');
const [command, storySlug, source] = args.filter((a) => !a.startsWith('--'));

function out(result) {
  if (json) process.stdout.write(JSON.stringify({ ok: true, ...result }) + '\n');
}

function fail(err) {
  const known = err instanceof StructureError;
  const error = {
    code: known ? err.code : 'unexpected',
    message: known ? err.message : "Keely couldn't complete this change.",
  };
  if (json) process.stdout.write(JSON.stringify({ ok: false, error }) + '\n');
  else console.error(`✗ ${error.message}`);
  const detail = known ? err.detail : err.stack;
  if (detail) console.error(detail);
  process.exit(1);
}

function readInput(src) {
  const text = src === '-' ? readFileSync(0, 'utf-8') : readFileSync(src, 'utf-8');
  try {
    return JSON.parse(text);
  } catch {
    throw new StructureError('bad-request', 'The request for this change was unreadable.');
  }
}

// The current order, as a request: every item in place.
function asRequest(tree) {
  return tree.map((node) => (node.children ? { id: node.id, children: asRequest(node.children) } : { id: node.id }));
}

function printTree(tree, indent = '') {
  for (const node of tree) {
    console.log(`${indent}${node.label ?? node.title}   (${node.name})`);
    if (node.children) printTree(node.children, `${indent}  `);
  }
}

function printPlan(plan) {
  console.log(plan.summary.text);
  for (const r of plan.relocations) console.log(`  ${r.from}  →  ${r.to}`);
  for (const item of plan.newItems) console.log(`  (new ${item.kind})  →  ${item.path}`);
  for (const f of plan.linkRewrites) {
    console.log(`  links in ${f.scene}: ${f.changes.map(([a, b]) => `[[${a}]] → [[${b}]]`).join(', ')}`);
  }
}

try {
  const USAGE = 'Usage: npm run restructure -- <show|tidy|plan|apply|recover> <story> [file|-] [--apply] [--json]';
  if (!command || !storySlug) throw new StructureError('bad-request', USAGE);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(storySlug)) {
    throw new StructureError('bad-request', `"${storySlug}" isn't a story folder name.`);
  }
  const scenesRoot = join(CONTENT, 'stories', storySlug, 'scenes');

  if (command === 'recover') {
    const undone = recoverInterrupted(journalPathFor(CACHE, scenesRoot));
    if (json) out({ recovered: undone });
    else console.log(undone ? '✓ Undid an interrupted change.' : 'Nothing to recover.');
  } else if (command === 'show') {
    const outline = await readOutline(scenesRoot);
    if (json) out(outline);
    else {
      printTree(outline.tree);
      if (outline.legacy) console.log('\nThis story uses the older folder names. `npm run renumber -- <story> --apply` updates them.');
    }
  } else if (command === 'tidy' || command === 'plan') {
    const story = await readStory(scenesRoot);
    const request = command === 'tidy' ? asRequest(story.tree) : readInput(source ?? '-');
    const plan = planRestructure(story, request, { storySlug });
    if (command === 'tidy' && doApply && plan.relocations.length) {
      const result = await applyPlan(scenesRoot, plan, { journalDir: CACHE });
      if (json) out({ plan, result });
      else {
        printPlan(plan);
        console.log('✓ Applied.');
      }
    } else if (json) out({ plan });
    else {
      printPlan(plan);
      if (command === 'tidy' && plan.relocations.length) console.log('\nDry run — nothing changed. Add --apply to apply.');
    }
  } else if (command === 'apply') {
    const plan = readInput(source ?? '-');
    const result = await applyPlan(scenesRoot, plan, { journalDir: CACHE });
    if (json) out({ result });
    else console.log(`✓ ${plan.summary.text}`);
  } else {
    throw new StructureError('bad-request', USAGE);
  }
} catch (err) {
  fail(err);
}
