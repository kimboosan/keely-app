// migrate-layout.mjs — moves a vault to the project-first layout (D-166).
//
//   npm run migrate-layout                 show every change, touching nothing
//   npm run migrate-layout -- --apply      make them
//
// Add --json for machine-readable output, as the desktop app uses:
// { ok: true, … } or { ok: false, error: { code, message } }.

import { VAULT } from '../utils/vault.mjs';
import { applyLayoutMigration, needsLayoutMigration, planLayoutMigration } from '../migrate/layout.mjs';

const args = process.argv.slice(2);
const json = args.includes('--json');
const doApply = args.includes('--apply');

function finish(result) {
  if (json) process.stdout.write(JSON.stringify({ ok: true, ...result }) + '\n');
}

try {
  if (!needsLayoutMigration(VAULT)) {
    finish({ needed: false });
    if (!json) console.log('This folder already uses the project-first layout. Nothing to do.');
  } else {
    const plan = planLayoutMigration(VAULT);
    if (!json) {
      for (const { from, to } of plan.moves) console.log(`  ${from}  →  ${to}`);
      for (const { file, field } of plan.edits) console.log(`  remove "${field}" from ${file}`);
      for (const note of plan.notes) console.log(`Note: ${note}`);
      for (const problem of plan.problems) console.error(`✗ ${problem}`);
    }
    if (plan.problems.length > 0) {
      if (json) finish({ needed: true, plan });
      process.exitCode = json ? 0 : 1;
    } else if (doApply) {
      const result = applyLayoutMigration(VAULT, plan);
      finish({ needed: true, plan, result });
      if (!json) console.log(`✓ Moved ${result.moved} items and edited ${result.edited} files. The old files are copied to ${result.backup}.`);
    } else {
      finish({ needed: true, plan });
      if (!json) console.log('\nDry run — nothing changed. Add --apply to make these changes.');
    }
  }
} catch (err) {
  console.error(err.stack ?? err);
  const message = "Keely couldn't update this folder, so it put everything back as it was.";
  if (json) process.stdout.write(JSON.stringify({ ok: false, error: { code: 'failed', message } }) + '\n');
  else console.error(`✗ ${message}`);
  process.exit(1);
}
