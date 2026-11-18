// The evaluator (charter, Next 4; docs/reviews/adventure/decision.md, A1): free text in, a
// proposed check out, chosen only from closed lists the rules give it. The model names an
// approach, a target here and what that approach can do to it; the rules settle it as they do
// any check. Nothing it writes moves a number. Pure: the model's text comes in as a string.
import type { Message } from '../../../core/narration/formats.js';
import { actsOn, chargesOf, subjectsHere, type CheckChoice, type SubjectKind, type Target } from './checks';
import type { PraxisModule } from './module';
import { playerOf, type Save } from './session';
import { playable } from './records';

export interface MenuAct { approach: string; aim: string; label: string }
export interface MenuTarget { id: string; name: string; kind: SubjectKind; acts: MenuAct[] }
export interface EvaluatorMenu { approaches: { id: string; name: string }[]; targets: MenuTarget[] }

// What a check could be right now: every approach, and for each person, thing and place here,
// what each approach can do to it. An aim is a state's id, or `deed` for the approach's deed.
export function evaluatorMenu(module: PraxisModule, save: Save): EvaluatorMenu {
  const world = playable(module, save.local);
  const targets = subjectsHere(world, save).map((subject): MenuTarget => ({
    id: subject.id,
    name: subject.name,
    kind: subject.kind,
    acts: actsOn(world, save, subject).flatMap(({ approach, acts }) => acts.map((act) => (act.kind === 'deed'
      ? { approach: approach.id, aim: 'deed', label: act.deed.label }
      : { approach: approach.id, aim: act.def.id, label: `${act.def.name} (${act.word})` }))),
  })).filter((target) => target.acts.length);
  return { approaches: world.ruleset.approaches.map((approach) => ({ id: approach.id, name: approach.name })), targets };
}

export type EvaluatorMode = 'one' | 'choices';

// The request: the lists, the player's words, and the one line to answer with. "choices" asks
// for up to three options instead, each with a few words for a button.
export function evaluatorRequest(menu: EvaluatorMenu, input: string, playerName: string, mode: EvaluatorMode = 'one', scene = ''): Message[] {
  const lists = [
    'Approaches:',
    ...menu.approaches.map((approach) => `- ${approach.id}: ${approach.name}`),
    '',
    'Who and what is here, and what each approach can do to them:',
    ...menu.targets.map((target) => `- ${target.id} (${target.name}, ${target.kind}): ${target.acts.map((act) => `${act.approach}→${act.aim} ${act.label}`).join('; ')}`),
  ].join('\n');
  const line = 'CHECK approach=<approach id> target=<target id> aim=<aim id> want=<what they want, in a few plain words>';
  const ask = mode === 'one'
    ? [
      `Read what ${playerName} just wrote. If it tries something whose outcome is uncertain and matters, answer with exactly one line:`,
      line,
      'If it doesn\'t (talk, a question, something sure to work, or nothing on the lists fits), answer exactly: NONE',
    ]
    : [
      `Offer ${playerName} up to three different things to try next that fit the scene, one line each:`,
      `${line} | <three to six words for a button>`,
    ];
  return [
    {
      role: 'system',
      content: [
        'You sort a player\'s words into the checks a game\'s rules can settle. You do not narrate and you do not decide outcomes.',
        'Use only ids from the lists below, exactly as written, and only an aim listed for that approach on that target.',
        '',
        lists,
      ].join('\n'),
    },
    { role: 'user', content: [scene ? `The scene: ${scene}\n` : '', mode === 'one' ? `${playerName} wrote: ${input}` : '', '', ...ask].filter((part, index) => index > 0 || part).join('\n').trim() },
  ];
}

export interface Proposal {
  target: Target;
  approach: string;
  intent: string;
  // A few words for a button (choices only).
  label: string;
  // What it is, in plain words: "Flair on Mara: Strain (calm). Wants: she lets me through."
  summary: string;
}

const field = (line: string, name: string) => new RegExp(`${name}\\s*=\\s*("([^"]*)"|[^\\s|]+)`, 'i').exec(line);
const want = (line: string) => /want\s*=\s*"?([^"|\n]*)"?/i.exec(line)?.[1]?.trim() ?? '';

// The lines that came back, checked against the lists. A line with an id that isn't on them is
// refused, with the reason, and never guessed at.
export function readProposals(text: string, menu: EvaluatorMenu): { proposals: Proposal[]; refused: string[] } {
  const proposals: Proposal[] = [];
  const refused: string[] = [];
  const clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  for (const raw of clean.split('\n')) {
    const line = raw.trim().replace(/^[-*\d.)\s]+/, '');
    if (!/^CHECK\b/i.test(line)) continue;
    const approach = (field(line, 'approach')?.[2] ?? field(line, 'approach')?.[1] ?? '').trim();
    const targetId = (field(line, 'target')?.[2] ?? field(line, 'target')?.[1] ?? '').trim();
    const aim = (field(line, 'aim')?.[2] ?? field(line, 'aim')?.[1] ?? '').trim();
    const approachEntry = menu.approaches.find((entry) => entry.id === approach);
    const target = menu.targets.find((entry) => entry.id === targetId);
    const act = target?.acts.find((entry) => entry.approach === approach && entry.aim === aim);
    if (!approachEntry) { refused.push(`"${approach}" is not an approach here.`); continue; }
    if (!target) { refused.push(`"${targetId}" is not here.`); continue; }
    if (!act) { refused.push(`${approachEntry.name} can't do "${aim}" to ${target.name}.`); continue; }
    const intent = want(line).slice(0, 160);
    const label = (line.split('|')[1] ?? '').trim().slice(0, 60);
    const defId = aim === 'deed' ? null : aim;
    if (proposals.some((entry) => entry.target.owner === target.id && entry.approach === approach && entry.target.defId === defId)) continue;
    proposals.push({
      target: { owner: target.id, defId },
      approach,
      intent,
      label,
      summary: `${approachEntry.name} on ${target.name}: ${act.label}.${intent ? ` Wants: ${intent}.` : ''}`,
    });
  }
  return { proposals: proposals.slice(0, 3), refused };
}

// How the player would make it by hand, as the check panel starts: the best charge left, aids on.
export function choiceFor(module: PraxisModule, save: Save, proposal: Proposal): CheckChoice {
  const world = playable(module, save.local);
  const slots = chargesOf(world, save, playerOf(world)).find((entry) => entry.approach === proposal.approach)?.slots ?? [];
  const charge = Math.max(0, ...slots.filter((slot) => !slot.spent).map((slot) => slot.value));
  return { approach: proposal.approach, charge, push: false, storyPoint: false, useAids: true, ...(proposal.intent ? { intent: proposal.intent } : {}) };
}
