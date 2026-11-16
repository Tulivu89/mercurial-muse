// npm run content:check -- <file> [--json]
// Checks a world file (studio-world/1) or an adventure module against the content standard
// (docs/content/standard.md) and prints what it costs and what to look at twice.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { isModule, moduleToWorld } from '../../core/convert/index.js';
import { parseWorld, type World } from '../../core/records/index.js';
import { lintWorld, reportText } from '../src/content/lint';

declare const process: { argv: string[]; exit: (code: number) => never; cwd: () => string; env: Record<string, string | undefined> };

// npm runs this from studio/; a path is read from where the command was typed, as chat:lab does.
const from = process.env.INIT_CWD ?? '.';

const args = process.argv.slice(2);
const files = args.filter((arg) => !arg.startsWith('--'));
if (!files.length) {
  console.log('Usage: npm run content:check -- <world.json or module.json> [--json]');
  process.exit(1);
}
for (const file of files) {
  const raw: unknown = JSON.parse(readFileSync(resolve(from, file), 'utf8'));
  let world: World;
  if (isModule(raw)) {
    const read = moduleToWorld(raw, Date.now());
    if (!read.ok) { console.log(`${file}: ${read.errors.join(' ')}`); process.exit(1); }
    world = read.world;
  } else {
    const read = parseWorld(raw);
    if (!read.ok) { console.log(`${file}: ${read.errors.join(' ')}`); process.exit(1); }
    world = read.world;
  }
  const report = lintWorld(world);
  console.log(args.includes('--json') ? JSON.stringify(report, null, 2) : reportText(report));
}
