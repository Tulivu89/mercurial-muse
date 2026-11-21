// The chat lab: one test pack (core/chat/testpack.ts) turned into the same turn under several
// setups, so a weak reply can be pinned on the model or on the setup, and on which part of it.
// Whoever runs it (a person, or a coding agent in another app) plays the model for each variant,
// writes the replies down, and the lab scores them. Pure: the script does the files.
import { XIALONG, addUserMessage, cleanGroupReply, isGroup, makeTestPack, membersOf, messageText, newChat, pickedAlt, newGroupChat, profileFor, rebuild, requestText, samplersFor, type GroupHow, type PackRequest, type TestPack } from '../../../core/chat/index.js';
import type { World } from '../../../core/records/index.js';
import { livesIn } from '../../../core/chat/index.js';
import { catchesIn } from '../content/lint';

export interface Variant { id: string; title: string; what: string; request: PackRequest }

// The turn a pack is about: the last reply, if the chat ends on one (that's the reply someone
// wanted looked at); otherwise the next one. `turn` is a message number counted from 1.
export function turnOf(pack: TestPack, turn?: number): number {
  const messages = pack.chat.messages;
  if (turn && turn >= 1 && turn <= messages.length + 1) return turn - 1;
  return messages.at(-1)?.from === 'character' && messages.length > 1 ? messages.length - 1 : messages.length;
}

// What the chat really got back at that turn, every alternative, when it is a reply already written.
export function originalReplies(pack: TestPack, upTo: number): string[] {
  const message = pack.chat.messages[upTo];
  return message?.from === 'character' ? message.alts.map((alt) => alt.parts.map((part) => part.text).join('\n')) : [];
}

export async function labVariants(pack: TestPack, upTo: number, only?: readonly string[]): Promise<Variant[]> {
  const out: Variant[] = [];
  const add = async (id: string, title: string, what: string, changed: Pick<TestPack, 'settings' | 'needs' | 'chat' | 'world'>, model = pack.settings.model, how?: GroupHow) => {
    if (only && !only.includes(id)) return;
    const request = await rebuild(changed, upTo, model, how);
    if (request) out.push({ id, title, what, request });
  };
  if (isGroup(pack.chat)) { await groupVariants(pack, add); return out; }
  const character = pack.world.records.find((record) => record.id === pack.chat.characterId);
  await add('as-sent', 'As the chat sends it', `Exactly what ${pack.settings.model} is sent for this turn, with today's code.`, pack);
  if (profileFor(pack.settings.model) === 'aetherroom') {
    await add('general', 'The General profile', 'The same chat as every model but Xialong gets it: rules, the character by section, examples, then the moment.', pack, 'general');
  }
  if (character?.examples.length) {
    const world = { ...pack.world, records: pack.world.records.map((record) => (record.id === character.id ? { ...record, examples: [] } : record)) };
    await add('no-examples', 'Without her example chats', 'Her example chats taken out. How much of her voice comes from them?', { ...pack, world });
  }
  // Other chat characters already bring nothing into her chat; anyone else's Named sections can
  // still come in on a key.
  const others = pack.world.records.filter((record) => record.kind === 'character' && record.id !== pack.chat.characterId && !record.chatListed && record.sections.some((section) => section.reach === 'named'));
  if (others.length) {
    const world = { ...pack.world, records: pack.world.records.filter((record) => !others.includes(record)) };
    await add('only-her', 'Without the others', `${others.map((record) => record.name).join(', ')} taken out of the world, so none of their Named sections can come in on a key.`, { ...pack, world });
  }
  if (!pack.chat.scenarioId && character) {
    const scenario = pack.world.records.find((record) => record.kind === 'scenario' && livesIn(character, record))
      ?? pack.world.records.find((record) => record.kind === 'scenario');
    if (scenario) await add('with-scenario', 'With her world\'s scenario', `The chat had no scenario. Here it has ${scenario.name}, so she knows where she is and who lives there.`, { ...pack, chat: { ...pack.chat, scenarioId: scenario.id } });
  }
  return out;
}

// A group chat's turn under the layouts the lab compares (docs/model-jobs.md, The lab test). Xialong
// takes only B.
type Add = (id: string, title: string, what: string, changed: Pick<TestPack, 'settings' | 'needs' | 'chat' | 'world'>, model?: string, how?: GroupHow) => Promise<void>;
async function groupVariants(pack: TestPack, add: Add): Promise<void> {
  await add('as-sent', 'As the chat sends it', `Exactly what ${pack.settings.model} is sent for this turn, with the chat's own group settings and today's code.`, pack);
  await add('group-b', 'Layout B', 'A call per speaker: their rules, sheet and examples first, the others here by their line, the transcript with every reply named, their replies as the model\'s turns.', pack, pack.settings.model, { layout: 'b', others: 'assistant' });
  if (profileFor(pack.settings.model) !== 'aetherroom') {
    await add('group-b-user', 'Layout B, the others as the player\'s turns', 'As B, with every other character\'s reply in the player\'s turn, under their name.', pack, pack.settings.model, { layout: 'b', others: 'user' });
    await add('group-c', 'Layout C', 'One shared prefix for everyone (rules, persona, scenario, who is here, the transcript), then the speaker\'s block at the very end.', pack, pack.settings.model, { layout: 'c', others: 'assistant' });
    await add('group-c-anchor', 'Layout C with an anchor', 'As C, with one line straight after the transcript naming who to write as, before their block.', pack, pack.settings.model, { layout: 'c', others: 'assistant', anchor: true });
    await add('group-c-user', 'Layout C, everyone as the player\'s turns', 'As C, with every character\'s reply in the player\'s turn, under their name.', pack, pack.settings.model, { layout: 'c', others: 'user' });
  }
}

export function variantText(variant: Variant, charName: string): string {
  return requestText(variant.request, `${variant.title}: what ${charName} is sent`);
}

export function labReadme(pack: TestPack, upTo: number, variants: Variant[], replies: number): string {
  const members = isGroup(pack.chat) ? membersOf(pack.chat, pack.world) : [];
  const speakerId = variants[0]?.request.speaker;
  const name = members.find((member) => member.id === speakerId)?.name ?? pack.chat.characterName ?? 'the character';
  const last = pack.chat.messages[upTo - 1];
  const original = originalReplies(pack, upTo);
  return [
    `# Chat lab: ${name}, message ${upTo + 1}`,
    '',
    `From a test pack saved ${new Date(pack.exportedAt).toISOString().slice(0, 16).replace('T', ' ')}: ${pack.settings.model}, ${pack.settings.contextTokens.toLocaleString('en')}-token window, relationship ${pack.chat.relationship}.`,
    '',
    `The turn: ${name} answers this message from ${pack.chat.userName}:`,
    '',
    `> ${(last ? messageText(last) : '(the chat starts here)').replace(/\n/g, '\n> ')}`,
    '',
    original.length ? `What ${pack.settings.model} actually wrote is in \`original.md\` (${original.length} ${original.length === 1 ? 'version' : 'versions'}). Don't read it until your replies are written.` : '',
    '',
    '## The variants',
    '',
    '| Folder | What changes | Tokens |',
    '| --- | --- | ---: |',
    ...variants.map((variant) => `| \`${variant.id}/\` | ${variant.what} | ${variant.request.tokens.toLocaleString('en')} |`),
    '',
    '## How to run it',
    '',
    `1. **Play the model, blind.** For each folder, read only its \`context.md\`. It is the whole request, exactly as the model gets it. Write ${name}'s next message ${replies} times, as separate tries, each in \`reply-1.md\`, \`reply-2.md\` and so on in that folder. Write only the reply, in the form her earlier messages take in the context, and nothing about it. Don't look at the world, the other folders or \`original.md\` first: each variant has to stand on what it sends.`,
    '2. **Score.** Run `npm run chat:lab -- score <this folder>`. It writes `scores.md`: length, the failure list\'s catches, other people named, quotation marks, and phrases lifted from the context.',
    `3. **Judge.** Read every reply beside \`original.md\`, and for each variant answer, one line each: does she sound like her examples? Does she know where she is and who's around? Does she answer what ${pack.chat.userName} said? Does anything of another character's turn up? Write \`findings.md\`: which variant played best, and what that says.`,
    '',
    '## Reading the results',
    '',
    '- **A strong model does well on `as-sent` and the original is weak:** the setup holds; the model is the limit.',
    '- **A strong model is weak on `as-sent` too:** the setup is at fault. The variant that fixes it says which part.',
    '- **`only-her` beats `as-sent`:** other characters\' sections are coming in on loose keys. Tighten those keys in the world file.',
    '- **`with-scenario` beats `as-sent`:** she didn\'t know where she was. Start the chat with a scenario.',
    '- **`no-examples` sounds as much like her as `as-sent`:** her examples aren\'t steering; her sections are.',
    '- **`general` beats `as-sent`:** the AetherRoom layout is costing her, and that\'s worth testing on Xialong itself.',
    ...(members.length ? [
      `- **A group (${members.map((member) => member.name).join(', ')}):** the turn is ${name}'s. *Wrote for* in \`scores.md\` is a hard fail. **C decides it:** if \`group-c\` matches \`group-b\` on bleed (lifted from others, other voices creeping in) and comes close on voice, C becomes the default for General models; if not, B stays. \`-user\` beside its plain variant says whether others' lines read better as the player's turns; \`group-c-anchor\` says whether naming the speaker before the block helps.`,
    ] : []),
    '',
    'Another app\'s model isn\'t Xialong, so this separates the setup from the model. It doesn\'t say how Xialong would do with a better setup: for that, change the world and play it on Xialong again.',
    '',
  ].filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n');
}

export function originalText(pack: TestPack, upTo: number): string {
  const original = originalReplies(pack, upTo);
  const message = pack.chat.messages[upTo];
  if (!message || !original.length) return '';
  const model = pickedAlt(message).model || pack.settings.model;
  return [`# What ${model} wrote`, '', ...original.flatMap((text, index) => [`## Version ${index + 1}${index === message.pick ? ' (the one kept)' : ''}`, '', text, ''])].join('\n');
}

// --- Scoring.

// In a group: `wrote` is whose lines the reply wrote besides the speaker's (a hard fail), and
// `liftedOthers` the runs copied from another present character's sheet or examples.
export interface Score { file: string; words: number; catches: string[]; named: string[]; quotes: number; lifted: string[]; wrote: string[]; liftedOthers: string[] }

const wordsOf = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? [];

// Runs of six words or more that a reply shares with what the model was sent, outside the chat
// itself: the sheet and the examples. One or two is normal; many is parroting.
function liftedFrom(reply: string, source: string): string[] {
  const have = new Set<string>();
  const words = wordsOf(source);
  for (let index = 0; index + 6 <= words.length; index += 1) have.add(words.slice(index, index + 6).join(' '));
  const said = wordsOf(reply);
  const hit = (at: number) => at + 6 <= said.length && have.has(said.slice(at, at + 6).join(' '));
  const found: string[] = [];
  // Overlapping hits are one copied stretch, reported whole.
  for (let index = 0; index + 6 <= said.length; index += 1) {
    if (!hit(index)) continue;
    let end = index;
    while (hit(end + 1)) end += 1;
    found.push(said.slice(index, end + 6).join(' '));
    index = end + 5;
  }
  return found;
}

export function scoreReply(file: string, text: string, request: PackRequest, pack: TestPack): Score {
  const speakerId = request.speaker ?? pack.chat.characterId;
  const others = pack.world.records.filter((record) => record.kind === 'character' && record.id !== speakerId).map((record) => record.name);
  const sheet = request.messages.filter((message) => message.role === 'system').map((message) => message.content).join('\n');
  const group = isGroup(pack.chat) ? membersOf(pack.chat, pack.world) : [];
  const speaker = group.find((member) => member.id === speakerId);
  const present = group.filter((member) => member.id !== speakerId);
  const cleaned = speaker ? cleanGroupReply(`${speaker.name}: ${text.replace(new RegExp(`^\\s*${speaker.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*`, 'i'), '')}`, speaker.name, present.map((member) => member.name), pack.chat.userName) : null;
  const theirs = present.map((member) => [...member.record.sections.map((section) => section.text), ...member.record.examples.flatMap((example) => example.messages.map((message) => message.text))].join('\n')).join('\n');
  return {
    file,
    words: wordsOf(text).length,
    catches: catchesIn(text).map((caught) => `${caught.rule}: "${caught.excerpt}"`),
    named: others.filter((name) => new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text)),
    quotes: (text.match(/["“”]/g) ?? []).length,
    lifted: liftedFrom(text, sheet),
    wrote: cleaned ? [...new Set([...cleaned.skipped, ...cleaned.cut])] : [],
    liftedOthers: present.length ? liftedFrom(text, theirs) : [],
  };
}

export function scoresText(rows: { variant: string; scores: Score[] }[]): string {
  const group = rows.some((row) => row.scores.some((score) => score.wrote.length || score.liftedOthers.length)) || rows.some((row) => row.variant.startsWith('group-'));
  const lines = ['# Scores', '', `| Variant | Reply | Words | Catches | Others named | Quote marks | Lifted runs |${group ? ' Wrote for | Lifted from others |' : ''}`, `| --- | --- | ---: | ---: | --- | ---: | ---: |${group ? ' --- | ---: |' : ''}`];
  for (const row of rows) for (const score of row.scores) lines.push(`| ${row.variant} | ${score.file} | ${score.words} | ${score.catches.length} | ${score.named.join(', ') || '-'} | ${score.quotes} | ${score.lifted.length} |${group ? ` ${score.wrote.join(', ') || '-'} | ${score.liftedOthers.length} |` : ''}`);
  lines.push('', 'The house format has no quotation marks: speech is plain, actions in asterisks. Catches are the content standard\'s failure list. Lifted runs are six words or more copied from the sheet or the examples.', '');
  if (group) lines.push('In a group, *Wrote for* is a hard fail: the reply wrote a line for someone else present. *Lifted from others* is runs of six words or more from another present character\'s sheet or examples: bleed.', '');
  for (const row of rows) {
    for (const score of row.scores.filter((entry) => entry.catches.length || entry.lifted.length || entry.wrote.length || entry.liftedOthers.length)) {
      lines.push(`## ${row.variant}/${score.file}`, '', ...score.wrote.map((entry) => `- wrote for ${entry}`), ...score.catches.map((entry) => `- ${entry}`), ...score.lifted.map((entry) => `- lifted: "${entry}"`), ...score.liftedOthers.map((entry) => `- lifted from another: "${entry}"`), '');
    }
  }
  return lines.join('\n');
}

// --- The standing suite: the same openers against a world's characters, run whenever the
// world or the setup changes, so two runs can be compared. Its file is `inkwyrm-lab-suite/1`.

export const SUITE_FORMAT = 'inkwyrm-lab-suite/1';
export interface SuiteCase {
  id: string;
  character: string;
  // A group case: everyone present (the character first), and a short scripted exchange before the
  // turn, since bleed shows after a few lines of back and forth. `who` is a character's id, or
  // "user". The turn under test is whoever answers what the person says next.
  cast?: string[];
  before?: { who: string; says: string }[];
  scenario: string | null;
  relationship: TestPack['chat']['relationship'];
  // The time of day the chat happens, "HH:MM", on the suite's date.
  at: string;
  userName: string;
  // What the person says after her greeting. Her reply to it is the turn under test.
  says: string;
  // What a judge looks for in her reply.
  watch: string;
}
export interface Suite { format: typeof SUITE_FORMAT; name: string; world: string; date: string; model: string; variants: string[]; replies: number; cases: SuiteCase[] }

export function readSuite(raw: unknown): { ok: true; suite: Suite } | { ok: false; errors: string[] } {
  const top = raw && typeof raw === 'object' ? raw as Partial<Suite> : {};
  if (top.format !== SUITE_FORMAT) return { ok: false, errors: ['This is not a lab suite (inkwyrm-lab-suite/1).'] };
  if (!Array.isArray(top.cases) || !top.cases.length) return { ok: false, errors: ['The suite has no cases.'] };
  const bad = top.cases.filter((entry) => !entry?.id || !entry.character || !entry.says || !/^\d\d:\d\d$/.test(entry.at ?? '')).map((entry) => entry?.id ?? '(no id)');
  if (bad.length) return { ok: false, errors: [`These cases need an id, a character, an "at" time and what the person says: ${bad.join(', ')}.`] };
  return { ok: true, suite: { ...(top as Suite), name: top.name ?? 'Suite', world: top.world ?? '', date: top.date ?? '2026-11-16', model: top.model ?? 'xialong-v1', variants: top.variants ?? ['as-sent', 'general'], replies: top.replies ?? 2 } };
}

// One case as a test pack: a new chat with her first greeting, then what the person says. The
// clock is the machine's local time on the suite's date, which is what the chat itself reads.
export function suitePack(suite: Suite, world: World, entry: SuiteCase): TestPack {
  const record = world.records.find((candidate) => candidate.id === entry.character && candidate.kind === 'character');
  if (!record) throw new Error(`${entry.id}: no character "${entry.character}" in ${world.name}.`);
  const [year, month, day] = suite.date.split('-').map(Number) as [number, number, number];
  const [hour, minute] = entry.at.split(':').map(Number) as [number, number];
  const at = new Date(year, month - 1, day, hour, minute).getTime();
  let n = 0;
  const ids = () => `${entry.id}-${++n}`;
  if (entry.cast && entry.cast.length > 1) {
    const greetings = Object.fromEntries(entry.cast.map((id) => [id, world.records.find((candidate) => candidate.id === id)?.greetings[0] ?? null]));
    let chat = newGroupChat({
      id: entry.id, worldId: world.id, characterId: record.id, characterName: record.name, personaId: null, scenarioId: entry.scenario,
      userName: entry.userName, relationship: entry.relationship, style: 'roleplay', responseLength: 'medium', greeting: null, cast: entry.cast, greetings,
    }, ids, at);
    for (const line of entry.before ?? []) {
      chat = line.who === 'user' ? addUserMessage(chat, line.says, ids(), at) : { ...chat, messages: [...chat.messages, { id: ids(), from: 'character' as const, at, alts: [{ parts: [{ text: line.says, emotion: 'neutral' as const }], at, model: '' }], pick: 0, speaker: line.who }] };
    }
    chat = { ...addUserMessage({ ...chat, group: { ...chat.group, picker: 'quietest' } }, entry.says, ids(), at), updatedAt: at };
    return makeTestPack({
      chat, world, now: at, next: null, last: null,
      settings: { provider: 'suite', model: suite.model, mode: 'chat', format: 'auto', profile: profileFor(suite.model), contextTokens: XIALONG.contextTokens, replyTokens: 1000, samplers: samplersFor(suite.model, 0.8) },
    });
  }
  const start = newChat({
    id: entry.id, worldId: world.id, characterId: record.id, characterName: record.name, personaId: null, scenarioId: entry.scenario,
    userName: entry.userName, relationship: entry.relationship, style: 'roleplay', responseLength: (record.chatDefaults?.responseLength ?? 'medium') as TestPack['chat']['responseLength'], greeting: record.greetings[0] ?? null,
  }, ids, at);
  const chat = { ...addUserMessage(start, entry.says, ids(), at), updatedAt: at };
  return makeTestPack({
    chat, world, now: at, next: null, last: null,
    settings: { provider: 'suite', model: suite.model, mode: 'chat', format: 'auto', profile: profileFor(suite.model), contextTokens: XIALONG.contextTokens, replyTokens: 1000, samplers: samplersFor(suite.model, 0.8) },
  });
}

export function suiteReadme(suite: Suite, cases: { entry: SuiteCase; variants: string[] }[]): string {
  return [
    `# Lab suite: ${suite.name}`,
    '',
    `${cases.length} cases, each a fresh chat: her greeting, then one message from the person. The turn under test is her reply. Built for ${suite.model} on ${suite.date}, with today's code.`,
    '',
    '| Case | Who | Relationship | Time | Watch for |',
    '| --- | --- | --- | --- | --- |',
    ...cases.map(({ entry }) => `| \`${entry.id}/\` | ${entry.character} | ${entry.relationship} | ${entry.at} | ${entry.watch} |`),
    '',
    '## How to run it',
    '',
    `1. **Play the model, blind.** Each case folder has one folder per variant (${cases[0]?.variants.join(', ') ?? ''}). In each, read only \`context.md\` and write her reply ${suite.replies} times, as \`reply-1.md\`, \`reply-2.md\` and so on. Only the reply, in the form her messages take in the context. Don't read the world file or the other folders first.`,
    '2. **Score.** `npm run chat:lab -- score <this folder>` writes `scores.md` for every case.',
    '3. **Judge.** For each case, one line per variant against its *Watch for*, then `findings.md`: what held, what slid toward the same voice in every character, and which variant played better.',
    '',
  ].join('\n');
}
