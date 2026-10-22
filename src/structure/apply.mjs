// Applying a restructure plan (D-157) — safely.
//
// 1. Refuse a stale plan: the story is read again and must match the
//    fingerprint the plan was made from.
// 2. Two passes: every folder that changes place is first moved into a
//    holding folder (`.keely-restructure`, inside the scenes folder so every
//    move is a same-disk rename), then from there to its final place. No
//    move can land on a folder that hasn't left yet.
// 3. Link rewrites write a temporary file and swap it in, so a scene is
//    never half-written.
// 4. Every completed step is recorded in a journal. On any failure the
//    steps are undone in reverse; a journal left behind by a crash is
//    undone before anything else happens.

import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync, renameSync, rmdirSync, readdirSync } from 'fs';
import { dirname, join } from 'path';
import { createHash } from 'crypto';
import { readStory } from './read.mjs';
import { rewriteLinks } from './plan.mjs';
import { StructureError } from './errors.mjs';

const HOLDING = '.keely-restructure';

function depth(path) {
  return path.split('/').length;
}

// One journal per story, kept outside the vault (computed state is never
// written into the author's files).
export function journalPathFor(journalDir, scenesRoot) {
  const key = createHash('sha256').update(scenesRoot).digest('hex').slice(0, 16);
  return join(journalDir, `restructure-${key}.json`);
}

class Journal {
  constructor(path, scenesRoot) {
    this.path = path;
    this.scenesRoot = scenesRoot;
    this.steps = [];
  }
  record(step) {
    this.steps.push(step);
    writeFileSync(this.path, JSON.stringify({ scenesRoot: this.scenesRoot, steps: this.steps }));
  }
  clear() {
    if (existsSync(this.path)) unlinkSync(this.path);
  }
}

// Undoes recorded steps, newest first. Used after a failure and to recover
// from a crash.
function undo(steps) {
  for (const step of [...steps].reverse()) {
    if (step.type === 'move') {
      mkdirSync(dirname(step.from), { recursive: true });
      renameSync(step.to, step.from);
    } else if (step.type === 'mkdir') {
      if (existsSync(step.path)) rmdirSync(step.path);
    } else if (step.type === 'rmdir') {
      mkdirSync(step.path, { recursive: true });
    } else if (step.type === 'write') {
      writeFileSync(step.path, step.before);
    }
  }
}

// Undoes an interrupted restructure, if one was left behind. Returns true
// when something was rolled back.
export function recoverInterrupted(journalPath) {
  if (!existsSync(journalPath)) return false;
  const { steps } = JSON.parse(readFileSync(journalPath, 'utf-8'));
  undo(steps);
  unlinkSync(journalPath);
  return true;
}

export async function applyPlan(scenesRoot, plan, { journalDir, failAfterSteps } = {}) {
  if (!journalDir) throw new Error('applyPlan needs a journalDir');
  mkdirSync(journalDir, { recursive: true });
  const journalPath = journalPathFor(journalDir, scenesRoot);
  recoverInterrupted(journalPath);

  const story = await readStory(scenesRoot);
  if (story.fingerprint !== plan.fingerprint) {
    throw new StructureError(
      'stale',
      'This story changed since the preview was made. Review the changes again before applying them.'
    );
  }

  const journal = new Journal(journalPath, scenesRoot);
  let stepsDone = 0;
  const abs = (rel) => join(scenesRoot, rel);
  const step = (record, action) => {
    if (failAfterSteps !== undefined && stepsDone >= failAfterSteps) {
      throw new Error(`test: forced failure after ${failAfterSteps} steps`);
    }
    action();
    journal.record(record);
    stepsDone += 1;
  };
  const move = (from, to) => step({ type: 'move', from, to }, () => renameSync(from, to));
  const mkdir = (path) => step({ type: 'mkdir', path }, () => mkdirSync(path));
  const rmdir = (path) => step({ type: 'rmdir', path }, () => rmdirSync(path));

  try {
    const holding = abs(HOLDING);
    if (plan.relocations.length) mkdir(holding);

    const scenes = plan.relocations.filter((r) => r.kind === 'scene');
    const containers = plan.relocations.filter((r) => r.kind !== 'scene');
    const childIds = new Set(plan.relocations.map((r) => r.from));

    // Pass 1a: scenes out to the holding folder.
    scenes.forEach((r, i) => move(abs(r.from), join(holding, `s${i}`)));
    // Pass 1b: containers, deepest first. Their own files (anything that
    // isn't a child scene or container, e.g. _meta.toml) go to the
    // holding folder; the emptied folder is removed.
    const byDepthDesc = containers.map((r, i) => ({ r, i })).sort((a, b) => depth(b.r.from) - depth(a.r.from));
    for (const { r, i } of byDepthDesc) {
      const extras = join(holding, `c${i}`);
      mkdir(extras);
      for (const name of readdirSync(abs(r.from))) {
        if (childIds.has(`${r.from}/${name}`)) continue; // already moved out
        move(join(abs(r.from), name), join(extras, name));
      }
      rmdir(abs(r.from));
    }
    // Pass 2a: containers in at their final places, shallowest first, with
    // their own files.
    const byDepthAsc = containers.map((r, i) => ({ r, i })).sort((a, b) => depth(a.r.to) - depth(b.r.to));
    for (const { r, i } of byDepthAsc) {
      mkdir(abs(r.to));
      const extras = join(holding, `c${i}`);
      for (const name of readdirSync(extras)) move(join(extras, name), join(abs(r.to), name));
      rmdir(extras);
    }
    // Pass 2b: scenes in at their final places.
    scenes.forEach((r, i) => move(join(holding, `s${i}`), abs(r.to)));
    if (plan.relocations.length) rmdir(holding);

    // Links. Each file must still hold exactly what the plan saw.
    const renames = new Map(Object.entries(plan.sceneRenames));
    for (const rewrite of plan.linkRewrites) {
      const file = join(abs(rewrite.scene), 'index.md');
      const before = readFileSync(file, 'utf-8');
      if (before !== story.contents.get(rewrite.was)) {
        throw new StructureError('stale', 'A scene changed while its links were being updated. Nothing was changed.');
      }
      const { text } = rewriteLinks(before, renames);
      const temp = `${file}.keely-tmp`;
      step({ type: 'write', path: file, before }, () => {
        try {
          writeFileSync(temp, text);
          renameSync(temp, file);
        } catch (err) {
          if (existsSync(temp)) unlinkSync(temp);
          throw err;
        }
      });
    }
  } catch (err) {
    try {
      undo(journal.steps);
      journal.clear();
    } catch (undoErr) {
      // The journal stays, so the next run can finish the rollback.
      throw new StructureError(
        'rollback-failed',
        "Keely couldn't finish this change and couldn't fully undo it. Nothing more will change until it's put right; the next attempt will try to undo it again.",
        `${err.stack}\n--- while undoing ---\n${undoErr.stack}`
      );
    }
    if (err instanceof StructureError) throw err;
    throw new StructureError('apply-failed', "Keely couldn't make this change, so it undid everything. Your story is as it was.", err.stack);
  }

  journal.clear();
  return { applied: true, relocations: plan.relocations.length, links: plan.summary.links, newItems: plan.newItems };
}
