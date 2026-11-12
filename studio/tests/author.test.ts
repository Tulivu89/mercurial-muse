// The W1 reading code against canned replies: these test the code, not the prompts. The prompts
// are tested live, by how a model behaves (studio/live/).
import { describe, expect, it } from 'vitest';
import { newRecord, newWorld, putRecord, type StoryRecord, type World } from '../../core/records/index.js';
import { buildFieldWrite, buildNames, examplesFor } from '../src/author/prompts';
import { clean, flagsIn, needsOf, readNames } from '../src/author/reading';
import { runFieldWrite, runNames, type Generate } from '../src/author/run';
import { cutOff, sentences, shapeFor } from '../src/author/shapes';

function setup(): { world: World; dee: StoryRecord } {
  let n = 0;
  const ids = () => `s-${++n}`;
  let world = { ...newWorld('w', 'Low Water', 1), premise: 'A ferry town in winter, 1979. The night boat runs twice. Everyone knows the clerk.', genre: 'Coastal crime' };
  const booth = { ...newRecord('place', 'booth', 'The Ticket Booth', ids), line: 'A glass box at the top of the ramp.' };
  const dee = { ...newRecord('character', 'dee', 'Dee Harlow', ids), line: 'The night clerk in the ferry ticket booth.', parentId: null, keys: ['Dee'] };
  dee.sections = [
    ...dee.sections.map((section) => (section.title === 'Appearance' ? { ...section, text: 'Tall for the booth and stooped with it. Nicotine on two fingers.' } : section)),
    { id: 'kept', title: 'What she knows', reach: 'never', keys: [], when: null, text: 'The van carries guns for her brother.' },
  ];
  const ray = { ...newRecord('character', 'ray', 'Ray Harlow', ids), line: 'Dee\'s brother, who drives the Thursday van.' };
  ray.sections = ray.sections.map((section) => (section.title === 'Personality' ? { ...section, text: 'Pays in exact change and never waits for a receipt.' } : section));
  world = putRecord(putRecord(putRecord(world, booth, 2), { ...dee, sections: dee.sections.map((section) => (section.title === 'Background' ? { ...section, text: 'She works The Ticket Booth six nights a week.' } : section)) }, 2), ray, 2);
  return { world, dee: world.records.find((record) => record.id === 'dee')! };
}

const personality = (record: StoryRecord) => ({ field: 'section' as const, sectionId: record.sections.find((section) => section.title === 'Personality')!.id });

// A model that answers from a list, and remembers what it was sent.
function canned(...replies: string[]) {
  const sent: Parameters<Generate>[0][] = [];
  const generate: Generate = async (messages) => {
    sent.push(messages);
    return { text: replies[Math.min(sent.length - 1, replies.length - 1)], model: 'canned' };
  };
  return { generate, sent };
}

describe('counting', () => {
  it('counts sentences by their ends, past short forms and closing quotes', () => {
    expect(sentences('Sells first and asks nothing.')).toBe(1);
    expect(sentences('Sells first. Asks nothing.')).toBe(2);
    expect(sentences('Dr. Vale checks it twice. "Again," she says.')).toBe(2);
    expect(sentences('No full stop at the end')).toBe(1);
    expect(sentences('')).toBe(0);
  });
  it('knows a reply that stopped mid-sentence', () => {
    expect(cutOff('She keeps the roll under her palm and')).toBe(true);
    expect(cutOff('She keeps the roll under her palm.')).toBe(false);
    expect(cutOff('"Ask twice."')).toBe(false);
  });
});

describe('reading a reply', () => {
  it('ignores decoration: a preface, the title, Markdown, tags and wrapping quotes', () => {
    expect(clean('Sure, here is the section:\nKeeps the roll under her palm.', 'Personality')).toBe('Keeps the roll under her palm.');
    expect(clean('**Personality:** Keeps the roll under her palm.', 'Personality')).toBe('Keeps the roll under her palm.');
    expect(clean('<draft>Keeps the roll under her palm.</draft>', 'Personality')).toBe('Keeps the roll under her palm.');
    expect(clean('"Keeps the roll under her palm."', 'Personality')).toBe('Keeps the roll under her palm.');
    expect(clean('```\nKeeps the roll.\n```', 'Personality')).toBe('Keeps the roll.');
    expect(clean('Personality:\nKeeps the roll.', 'Personality')).toBe('Keeps the roll.');
  });
  it('keeps quotes that belong to the text', () => {
    expect(clean('"Ask twice," she says. Then she waits.', 'Speech')).toBe('"Ask twice," she says. Then she waits.');
  });
  it('reads a NEEDS reply as a question', () => {
    expect(needsOf('NEEDS: Does she know what the van carries?')).toBe('Does she know what the van carries?');
    expect(needsOf('needs : Is it 1979 or later?\nmore')).toBe('Is it 1979 or later?');
    expect(needsOf('She needs the work.')).toBeNull();
  });
  it('underlines flagged words, whole words only', () => {
    expect(flagsIn('A tapestry of smells, palpable.').map((flag) => flag.word)).toEqual(['tapestry', 'palpable']);
    expect(flagsIn('A testamentary clause.')).toEqual([]);
  });
});

describe('a field write', () => {
  it('sends the record, its kept-back notes and the shape, with no Errata in it', () => {
    const { world, dee } = setup();
    const result = buildFieldWrite({ world, record: dee, target: personality(dee), prefill: true });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [system, user] = result.built.messages;
    expect(system.content).toContain('Personality, the narrator reads it while this is in the scene. Two to four sentences.');
    expect(system.content).toContain('show them as something a person could notice');
    expect(system.content).not.toMatch(/Errata|tapestry/i);
    expect(user.content).toContain('Kept back:\nWhat she knows: The van carries guns for her brother.');
    expect(user.content).toContain('Already written:\nAppearance: Tall for the booth');
    expect(user.content).toContain('Near it:\nThe Ticket Booth (place)');
    expect(user.content.trim().endsWith('Write Personality.')).toBe(true);
    expect(result.built.prefill).toBe('Personality:\n');
    expect(result.built.parts.find((part) => part.note?.startsWith('Kept back'))?.note).toBe('Kept back: What she knows');
  });

  it('leaves the kept-back rule out when writing a Never section itself', () => {
    const { world, dee } = setup();
    const result = buildFieldWrite({ world, record: dee, target: { field: 'section', sectionId: 'kept' }, prefill: false });
    expect(result.ok && result.built.messages[0].content).not.toContain('show them as something');
    expect(result.ok && result.built.prefill).toBe('');
  });

  it('takes examples from records of the same kind, shortest first', () => {
    const { world, dee } = setup();
    expect(examplesFor(world, dee, personality(dee), 2)).toEqual(['Pays in exact change and never waits for a receipt.']);
    expect(examplesFor(world, dee, { field: 'line' }, 2)).toEqual(['Dee\'s brother, who drives the Thursday van.']);
  });

  it('leaves out what is near it first, and stops when the record alone will not fit', () => {
    const { world, dee } = setup();
    const long = { ...dee, sections: dee.sections.map((section) => (section.title === 'Background' ? { ...section, text: `${'She works the booth. '.repeat(330)}She works The Ticket Booth.` } : section)) };
    const wide = buildFieldWrite({ world, record: long, target: personality(long), prefill: false, window: 100000 });
    if (!wide.ok) throw new Error(wide.reason);
    const near = wide.built.parts.find((part) => part.label === 'Near it')!.tokens;
    // Room for everything but what's near it: the reply's 250 and the margin's 1,000 on top.
    const tight = buildFieldWrite({ world, record: long, target: personality(long), prefill: false, window: wide.built.tokens - near + 250 + 1000 + 2 });
    expect(tight.ok).toBe(true);
    if (tight.ok) expect(tight.built.parts.find((part) => part.label === 'Near it')?.left).toBe(true);
    const tooSmall = buildFieldWrite({ world, record: long, target: personality(long), prefill: false, window: 2000 });
    expect(tooSmall.ok).toBe(false);
  });

  it('keeps a reply that fits in one call', async () => {
    const { world, dee } = setup();
    const result = buildFieldWrite({ world, record: dee, target: personality(dee), prefill: true });
    if (!result.ok) throw new Error(result.reason);
    const model = canned('Sure, here it is:\nKeeps the ticket roll under her palm and makes some drivers ask twice.');
    const outcome = await runFieldWrite(result.built, shapeFor(dee, personality(dee))!, model.generate);
    expect(outcome).toMatchObject({ state: 'ready', calls: 1, text: 'Keeps the ticket roll under her palm and makes some drivers ask twice.' });
  });

  it('sends a wrong answer back once with the fix', async () => {
    const { world, dee } = setup();
    const result = buildFieldWrite({ world, record: dee, target: { field: 'line' }, prefill: false });
    if (!result.ok) throw new Error(result.reason);
    const model = canned('Dee sells tickets. She works nights. She has a brother.', 'The night clerk who makes some drivers ask twice.');
    const outcome = await runFieldWrite(result.built, shapeFor(dee, { field: 'line' })!, model.generate);
    expect(outcome).toMatchObject({ state: 'ready', calls: 2, text: 'The night clerk who makes some drivers ask twice.' });
    expect(model.sent[1].at(-1)!.content).toBe('That was 3 sentences. Write the line as one sentence under 25 words. Write only Line.');
    expect(model.sent[1].at(-2)!.role).toBe('assistant');
  });

  it('comes back unfinished after a second wrong answer, and never tries a third time', async () => {
    const { world, dee } = setup();
    const result = buildFieldWrite({ world, record: dee, target: personality(dee), prefill: false });
    if (!result.ok) throw new Error(result.reason);
    const model = canned('Keeps the roll under her palm and', 'Keeps the roll under her palm and makes them');
    const outcome = await runFieldWrite(result.built, shapeFor(dee, personality(dee))!, model.generate);
    expect(outcome.state).toBe('unfinished');
    expect(outcome.calls).toBe(2);
    expect(outcome.fault).toContain('stopped mid-sentence');
    expect(model.sent).toHaveLength(2);
  });

  it('turns NEEDS into a question, not a draft', async () => {
    const { world, dee } = setup();
    const result = buildFieldWrite({ world, record: dee, target: personality(dee), prefill: false });
    if (!result.ok) throw new Error(result.reason);
    const outcome = await runFieldWrite(result.built, shapeFor(dee, personality(dee))!, canned('NEEDS: Does she know what the van carries?').generate);
    expect(outcome).toMatchObject({ state: 'needs', question: 'Does she know what the van carries?', calls: 1 });
  });

  it('never resends a fault on the connection side', async () => {
    const { world, dee } = setup();
    const result = buildFieldWrite({ world, record: dee, target: personality(dee), prefill: false });
    if (!result.ok) throw new Error(result.reason);
    let calls = 0;
    const failing: Generate = async () => { calls += 1; throw new Error('Your key was refused.'); };
    await expect(runFieldWrite(result.built, shapeFor(dee, personality(dee))!, failing)).rejects.toThrow('refused');
    expect(calls).toBe(1);
  });
});

describe('names', () => {
  it('reads names past numbers, bullets and notes, and marks the ones in use', () => {
    const { world, dee } = setup();
    const ideas = readNames('1. Ray Harlow\n2. Nell Cotter - a dock name\n- "Joan Pike"\n* Dee\nNell Cotter', world, { ...dee, id: 'new' });
    expect(ideas).toEqual([
      { name: 'Ray Harlow', taken: true },
      { name: 'Nell Cotter', taken: false },
      { name: 'Joan Pike', taken: false },
      { name: 'Dee', taken: true },
    ]);
  });

  it('lists the names in use to the model, and asks once more when too few are usable', async () => {
    const { world } = setup();
    const fresh = { ...newRecord('character', 'new', 'New character', () => 'x') };
    const result = buildNames({ world, record: fresh });
    if (!result.ok) throw new Error(result.reason);
    expect(result.built.messages[1].content).toContain('Names already used here: Dee Harlow, Ray Harlow, The Ticket Booth');
    const model = canned('Dee Harlow\nRay Harlow', 'Nell Cotter\nJoan Pike\nSid Marr');
    const outcome = await runNames(result.built, world, fresh, model.generate);
    expect(outcome.calls).toBe(2);
    expect(outcome.ideas.filter((idea) => !idea.taken).map((idea) => idea.name)).toEqual(['Nell Cotter', 'Joan Pike', 'Sid Marr']);
  });
});
