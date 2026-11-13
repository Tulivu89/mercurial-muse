// The draft checker for content (docs/content/standard.md): what a world's records cost in
// context, which are over the provisional budgets, which lack a line, and which lines a reader
// should look at twice against the failure list. Pure.
//
// Nothing here is a verdict. Budgets are provisional until the pilot measures play; the
// failure-list catches are flags for a human or a reviewing model, because a regex can't tell a
// simile that works from one that doesn't. What it can do is make every draft cost the same
// two minutes of attention instead of a full read.
import { checkWorld } from '../../../core/convert/index.js';
import { ancestors, contextFor, roughTokens, type RecordKind, type StoryRecord, type World } from '../../../core/records/index.js';

export type Tier = 'lead' | 'person' | Exclude<RecordKind, 'character'>;

// Provisional budgets, in tokens (roughly four characters each), set from what was measured on
// Bogwater, Port Covenant and the owner's Qiulong and Errata cards (docs/content/standard.md,
// *Measured*). Each is roughly twice the measured typical size, so a flag means "unusually
// heavy", not "wrong".
export const BUDGETS: Record<Tier, { here?: number; named?: number; always?: number; chat?: number }> = {
  lead: { here: 1400, named: 300, chat: 2400 },
  person: { here: 200, named: 250 },
  place: { here: 120, named: 200 },
  group: { here: 120, named: 150 },
  item: { here: 80, named: 120 },
  lore: { named: 200 },
  thread: { always: 40 },
  scenario: { always: 300 },
  persona: { here: 150, named: 200 },
};
export const PREMISE_BUDGET = 150;
export const LINE_WORDS = 25;
// What a moment may cost before a 28,000-token model starts losing transcript to it.
export const MOMENT_BUDGET = 4000;

// A featured chat partner is a lead: it carries greetings or example chats, or the author tagged
// it "lead". Everyone else in a world is a person.
export function tierOf(record: StoryRecord): Tier {
  if (record.kind !== 'character') return record.kind;
  return record.greetings.length || record.examples.length || record.tags.some((tag) => tag.toLowerCase() === 'lead') ? 'lead' : 'person';
}

export interface RecordCost {
  id: string; name: string; kind: RecordKind; tier: Tier;
  lineWords: number; here: number; named: number; when: number; always: number; never: number;
  // Greetings and example chats: chat only, the narrator never gets them.
  chat: number;
}

export interface Finding {
  recordId: string | null;
  record: string;
  where: string;
  kind: 'missing' | 'over' | 'catch' | 'check';
  rule: string;
  excerpt: string;
}

// The failure list's catches a pattern can find (docs/content/standard.md, *The failure list*).
// Each names the rule it points at. Applied to lines and to every section that reaches the model.
export const CATCHES: { rule: string; pattern: RegExp }[] = [
  { rule: '2 comparison as description', pattern: /\b(?:like an?|like the|as if|as though)\b/gi },
  { rule: 'slop word', pattern: /\b(?:tapestry|testament to|palpable|symphony of|dance of|echoes? of|a sense of|the air (?:was )?thick|sends? shivers|ministrations|orbs)\b/gi },
  { rule: '4 significance by announcement', pattern: /\b(?:noticed|never mentioned|never once|nobody has ever|neither of them)\b/gi },
  { rule: '5 contrast framing', pattern: /\bnot (?:just |only |simply )?\w+(?: \w+)?,? but\b|\brather than\b/gi },
  { rule: '9 hedging', pattern: /\b(?:perhaps|maybe|seemingly|somehow|seems to|appears to)\b/gi },
  { rule: '13 litotes', pattern: /\bnot un\w{3,}/gi },
  { rule: '14 the kind of', pattern: /\bthe (?:kind|sort|type) of (?:\w+ )?(?:who|that|which)\b/gi },
  { rule: '17 stock micro-expression', pattern: /corner of (?:his|her|their) mouth|(?:smile|grin) (?:that )?(?:doesn't|didn't|never) reach/gi },
  { rule: '18 analyst vocabulary', pattern: /\b(?:precise(?:ly)?|deliberate(?:ly)?|careful(?:ly)?|texture|earned)\b/gi },
  { rule: 'stock composure', pattern: /\b(?:unhurried|glacial|serene|watchful|near-silent|goes still|economy of motion)\b/gi },
  { rule: 'stock senses and names', pattern: /\b(?:woodsmoke|petrichor|ozone|amber light|Mira|Kael|Vess)\b/g },
];

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

function excerptAround(text: string, at: number, length: number): string {
  const start = Math.max(0, at - 40);
  const end = Math.min(text.length, at + length + 40);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${end < text.length ? '…' : ''}`;
}

export function catchesIn(text: string): { rule: string; excerpt: string }[] {
  const found: { rule: string; excerpt: string }[] = [];
  for (const { rule, pattern } of CATCHES) {
    pattern.lastIndex = 0;
    for (let match = pattern.exec(text); match; match = pattern.exec(text)) found.push({ rule, excerpt: excerptAround(text, match.index, match[0].length) });
  }
  return found;
}

export function costOf(record: StoryRecord): RecordCost {
  const sum = (reach: string) => record.sections.filter((section) => section.reach === reach && section.text.trim()).reduce((total, section) => total + roughTokens(section.text) + roughTokens(section.title), 0);
  const sets = record.sets.reduce((total, set) => total + Math.max(0, ...set.members.map((member) => roughTokens(member.text))), 0);
  const chat = record.greetings.reduce((total, greeting) => total + roughTokens(greeting.text), 0)
    + record.examples.reduce((total, example) => total + example.messages.reduce((sum, message) => sum + roughTokens(message.text), 0), 0);
  return {
    id: record.id, name: record.name, kind: record.kind, tier: tierOf(record), lineWords: words(record.line),
    here: sum('here') + sets, named: sum('named'), when: sum('when'), always: sum('always'), never: sum('never'), chat,
  };
}

export interface Moment { placeId: string; place: string; tokens: number }

export interface Report {
  world: string;
  records: number;
  premise: number;
  // A who's-who of every record's line: what a region list costs at most.
  lines: number;
  costs: RecordCost[];
  findings: Finding[];
  // The heaviest moments: each place with its parent, and the four heaviest people in the world
  // standing in it. An upper bound, since nobody's schedule is consulted.
  moments: Moment[];
}

export function lintWorld(world: World): Report {
  const findings: Finding[] = [];
  const costs = world.records.map(costOf);
  const premise = roughTokens(world.premise);
  if (!world.premise.trim()) findings.push({ recordId: null, record: world.name, where: 'premise', kind: 'missing', rule: 'a world needs a premise', excerpt: '' });
  else if (premise > PREMISE_BUDGET) findings.push({ recordId: null, record: world.name, where: 'premise', kind: 'over', rule: `premise ${premise} t, budget ${PREMISE_BUDGET}`, excerpt: '' });

  for (const record of world.records) {
    const cost = costs.find((entry) => entry.id === record.id)!;
    const budget = BUDGETS[cost.tier];
    if (!record.line.trim()) findings.push({ recordId: record.id, record: record.name, where: 'line', kind: 'missing', rule: 'every record needs a line: in a big world it is all most records send', excerpt: '' });
    else if (cost.lineWords > LINE_WORDS) findings.push({ recordId: record.id, record: record.name, where: 'line', kind: 'over', rule: `line ${cost.lineWords} words, budget ${LINE_WORDS}`, excerpt: record.line });
    for (const [reach, spent] of [['here', cost.here], ['named', cost.named], ['always', cost.always], ['chat', cost.chat]] as const) {
      const most = budget[reach];
      if (most && spent > most) findings.push({ recordId: record.id, record: record.name, where: reach, kind: 'over', rule: `${cost.tier} ${reach} ${spent} t, budget ${most}`, excerpt: '' });
    }
    // Named sections are judged one by one: each arrives on its own key.
    for (const section of record.sections) {
      if (section.reach === 'named' && budget.named && roughTokens(section.text) > budget.named && cost.named <= budget.named) {
        findings.push({ recordId: record.id, record: record.name, where: section.title, kind: 'over', rule: `one named section ${roughTokens(section.text)} t, budget ${budget.named}`, excerpt: '' });
      }
    }
    const read = [{ where: 'line', text: record.line }, ...record.sections.filter((section) => section.reach !== 'never').map((section) => ({ where: section.title, text: section.text })), ...record.sets.flatMap((set) => set.members.map((member) => ({ where: `${set.title}: ${member.name}`, text: member.text })))];
    for (const part of read) for (const caught of catchesIn(part.text)) findings.push({ recordId: record.id, record: record.name, where: part.where, kind: 'catch', rule: caught.rule, excerpt: caught.excerpt });
  }

  // The adventure's own checks: stops that aren't places, more than four in a place, and the rest.
  for (const problem of checkWorld(world)) findings.push({ recordId: problem.recordId ?? null, record: problem.where, where: 'checks', kind: 'check', rule: problem.text, excerpt: '' });

  const heaviest = [...costs].filter((cost) => cost.kind === 'character').sort((a, b) => b.here - a.here).slice(0, 4).map((cost) => cost.id);
  const moments = world.records.filter((record) => record.kind === 'place').map((place) => ({
    placeId: place.id,
    place: [place.name, ...ancestors(world, place.id).slice(0, 1).map((parent) => `in ${parent.name}`)].join(' '),
    tokens: contextFor(world, { hereIds: [place.id, ...heaviest], recentText: '', conditionIds: [] }).tokens,
  })).sort((a, b) => b.tokens - a.tokens);
  for (const moment of moments.filter((entry) => entry.tokens > MOMENT_BUDGET)) findings.push({ recordId: moment.placeId, record: moment.place, where: 'moment', kind: 'over', rule: `a moment here costs about ${moment.tokens} t, budget ${MOMENT_BUDGET}`, excerpt: '' });

  const lines = world.records.reduce((total, record) => total + roughTokens(record.name) + roughTokens(record.line) + 2, 0);
  return { world: world.name, records: world.records.length, premise, lines, costs, findings, moments: moments.slice(0, 5) };
}

const average = (list: number[]) => (list.length ? Math.round(list.reduce((sum, value) => sum + value, 0) / list.length) : 0);
const most = (list: number[]) => (list.length ? Math.max(...list) : 0);

// The report as Markdown, for a terminal or a pull request.
export function reportText(report: Report): string {
  const out: string[] = [`# ${report.world}: ${report.records} records`, '', `Premise ${report.premise} t · every line together ${report.lines} t`, ''];
  out.push('| Tier | Count | Line words avg/max | Here avg/max | Named avg/max | Chat avg/max |', '| --- | ---: | ---: | ---: | ---: | ---: |');
  const tiers = [...new Set(report.costs.map((cost) => cost.tier))];
  for (const tier of tiers) {
    const list = report.costs.filter((cost) => cost.tier === tier);
    const pair = (pick: (cost: RecordCost) => number) => `${average(list.map(pick))} / ${most(list.map(pick))}`;
    out.push(`| ${tier} | ${list.length} | ${pair((cost) => cost.lineWords)} | ${pair((cost) => cost.here)} | ${pair((cost) => cost.named)} | ${pair((cost) => cost.chat)} |`);
  }
  out.push('', '**Heaviest moments** (a place, its parent, the four heaviest people):', ...report.moments.map((moment) => `- ${moment.place}: about ${moment.tokens} t`), '');
  const groups: [Finding['kind'], string][] = [['missing', 'Missing'], ['over', 'Over budget'], ['check', 'Checks'], ['catch', 'Look twice (failure-list catches)']];
  for (const [kind, title] of groups) {
    const list = report.findings.filter((finding) => finding.kind === kind);
    out.push(`## ${title}: ${list.length}`);
    for (const finding of list.slice(0, 200)) out.push(`- **${finding.record}** · ${finding.where} · ${finding.rule}${finding.excerpt ? `: ${finding.excerpt}` : ''}`);
    if (list.length > 200) out.push(`- and ${list.length - 200} more`);
    out.push('');
  }
  return out.join('\n');
}
