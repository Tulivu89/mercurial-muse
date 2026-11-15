// npm run chat:lab -- <test-pack.json> [--out <folder>] [--turn <message number>] [--replies <n>]
// npm run chat:lab -- suite <suite.json> [--out <folder>]
// npm run chat:lab -- score <folder>
// Turns a test pack from Chat (What was sent › Save for a test › Everything) into the same turn
// under several setups, each a folder with the exact request; then scores the replies written
// into those folders. How to run it is in the README it writes, and in docs/testing/chat-lab.md.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { readTestPack, type TestPack } from '../../core/chat/index.js';
import { parseWorld } from '../../core/records/index.js';
import { labReadme, labVariants, originalText, readSuite, scoreReply, scoresText, suitePack, suiteReadme, turnOf, variantText, type Score } from '../src/lab/chatLab';

declare const process: { argv: string[]; exit: (code: number) => never; env: Record<string, string | undefined> };

// npm runs a workspace's script in its own folder; paths given on the command line are the caller's.
const from = process.env.INIT_CWD ?? '.';
const here = (path: string) => resolve(from, path);
const args = process.argv.slice(2);
const option = (name: string) => { const at = args.indexOf(`--${name}`); return at >= 0 ? args[at + 1] : undefined; };
const positional = args.filter((arg, index) => !arg.startsWith('--') && !args[index - 1]?.startsWith('--'));

function readPack(file: string): TestPack {
  const read = readTestPack(JSON.parse(readFileSync(file, 'utf8')));
  if (!read.ok) { console.log(`${file}: ${read.errors.join(' ')}`); process.exit(1); }
  return read.pack;
}

// One lab folder: the variants of one turn, the original if there is one, and the README.
async function writeLab(pack: TestPack, upTo: number, out: string, replies: number, only?: string[]) {
  const variants = await labVariants(pack, upTo, only);
  if (!variants.length) { console.log('Nothing could be built from this pack: is its character still in its world?'); process.exit(1); }
  mkdirSync(out, { recursive: true });
  const name = pack.chat.characterName || 'the character';
  for (const variant of variants) {
    mkdirSync(join(out, variant.id), { recursive: true });
    writeFileSync(join(out, variant.id, 'context.md'), variantText(variant, name));
    writeFileSync(join(out, variant.id, 'context.json'), `${JSON.stringify(variant.request, null, 2)}\n`);
  }
  const original = originalText(pack, upTo);
  if (original) writeFileSync(join(out, 'original.md'), original);
  writeFileSync(join(out, 'pack.json'), `${JSON.stringify(pack, null, 2)}\n`);
  writeFileSync(join(out, 'lab.json'), `${JSON.stringify({ upTo, variants: variants.map((variant) => variant.id) }, null, 2)}\n`);
  writeFileSync(join(out, 'README.md'), labReadme(pack, upTo, variants, replies));
  return variants;
}

async function make(file: string) {
  const pack = readPack(here(file));
  const turnArg = Number(option('turn'));
  const upTo = turnOf(pack, Number.isFinite(turnArg) && turnArg > 0 ? turnArg : undefined);
  const replies = Math.max(1, Math.min(10, Number(option('replies')) || 3));
  const out = here(option('out') ?? file.replace(/\.json$/i, '') + '.lab');
  const variants = await writeLab(pack, upTo, out, replies);
  console.log(`Wrote ${variants.length} variants of message ${upTo + 1} to ${out}`);
  for (const variant of variants) console.log(`- ${variant.id}: about ${variant.request.tokens} tokens`);
  if (pack.next && variants[0]) {
    const same = pack.next.messages.length === variants[0].request.messages.length && pack.next.messages.every((message, index) => message.content === variants[0]!.request.messages[index]?.content);
    if (upTo === pack.chat.messages.length && !same) console.log('Note: today\'s code builds this turn differently from what the pack recorded as the next request.');
  }
  console.log('Next: read README.md in that folder.');
}

async function suite(file: string) {
  const path = here(file);
  const read = readSuite(JSON.parse(readFileSync(path, 'utf8')));
  if (!read.ok) { console.log(`${file}: ${read.errors.join(' ')}`); process.exit(1); }
  const worldPath = resolve(dirname(path), read.suite.world);
  const world = parseWorld(JSON.parse(readFileSync(worldPath, 'utf8')));
  if (!world.ok) { console.log(`${read.suite.world}: ${world.errors.join(' ')}`); process.exit(1); }
  const out = here(option('out') ?? join('lab', `suite-${new Date().toISOString().slice(0, 10)}`));
  const built: { entry: typeof read.suite.cases[number]; variants: string[] }[] = [];
  for (const entry of read.suite.cases) {
    const pack = suitePack(read.suite, world.world, entry);
    const variants = await writeLab(pack, pack.chat.messages.length, join(out, entry.id), read.suite.replies, read.suite.variants);
    built.push({ entry, variants: variants.map((variant) => variant.id) });
  }
  writeFileSync(join(out, 'suite.json'), `${JSON.stringify({ cases: built.map(({ entry }) => entry.id) }, null, 2)}\n`);
  writeFileSync(join(out, 'README.md'), suiteReadme(read.suite, built));
  console.log(`Wrote ${built.length} cases to ${out}. Next: read README.md in that folder.`);
}

async function score(folder: string) {
  const dir = here(folder);
  let rows: Row[] = [];
  let empty: string[] = [];
  if (existsSync(join(dir, 'suite.json'))) {
    // A suite: one table across every case, each row named case/variant.
    const { cases } = JSON.parse(readFileSync(join(dir, 'suite.json'), 'utf8')) as { cases: string[] };
    for (const id of cases) {
      const scored = await scoreLab(join(dir, id));
      rows = [...rows, ...scored.rows.map((row) => ({ ...row, variant: `${id}/${row.variant}` }))];
      empty = [...empty, ...scored.empty.map((variant) => `${id}/${variant}`)];
    }
  } else if (existsSync(join(dir, 'lab.json'))) {
    ({ rows, empty } = await scoreLab(dir));
  } else {
    console.log(`${dir} is not a lab or suite folder (no lab.json or suite.json).`);
    process.exit(1);
  }
  const text = `${scoresText(rows)}${empty.length ? `\nNo replies yet in: ${empty.join(', ')}.\n` : ''}`;
  writeFileSync(join(dir, 'scores.md'), text);
  console.log(text);
}

type Row = { variant: string; scores: Score[] };

async function scoreLab(dir: string): Promise<{ rows: Row[]; empty: string[] }> {
  const pack = readPack(join(dir, 'pack.json'));
  const { upTo, variants: ids } = JSON.parse(readFileSync(join(dir, 'lab.json'), 'utf8')) as { upTo: number; variants?: string[] };
  const variants = await labVariants(pack, upTo, ids);
  const rows: Row[] = [];
  const replyFiles = (path: string) => (existsSync(path) ? readdirSync(path).filter((entry) => /^reply.*\.(md|txt)$/i.test(entry)).sort() : []);
  for (const variant of variants) {
    const files = replyFiles(join(dir, variant.id));
    rows.push({ variant: variant.id, scores: files.map((entry) => scoreReply(entry, readFileSync(join(dir, variant.id, entry), 'utf8'), variant.request, pack)) });
  }
  const original = pack.chat.messages[upTo];
  if (original?.from === 'character' && variants[0]) {
    rows.push({ variant: 'original', scores: original.alts.map((alt, index) => scoreReply(`version ${index + 1}`, alt.parts.map((part) => part.text).join('\n'), variants[0]!.request, pack)) });
  }
  const empty = rows.filter((row) => row.variant !== 'original' && !row.scores.length).map((row) => row.variant);
  return { rows, empty };
}

if (!positional.length) {
  console.log('Usage: npm run chat:lab -- <test-pack.json> [--out <folder>] [--turn <n>] [--replies <n>]\n       npm run chat:lab -- suite <suite.json> [--out <folder>]\n       npm run chat:lab -- score <lab or suite folder>');
  process.exit(1);
}
if (positional[0] === 'score') await score(positional[1] ?? '.');
else if (positional[0] === 'suite') await suite(positional[1] ?? 'content/dragons-resort/lab-suite.json');
else await make(positional[0]!);
