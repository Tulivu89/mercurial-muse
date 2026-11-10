import { describe, expect, it } from 'vitest';
import { bondConditionsFor, cardFromPng, importCardFile, importCardJson, newWorld, parseExampleChats, parseWorld, pngTextChunks, recordById, type World } from '../records/index.js';
import { readStreamChunk, sseReader, thinkingFilter } from '../narration/stream.js';
import { buildUpstream, narrationRequestSchema } from '../narration/upstream.js';
import { BUILT_IN_PROVIDERS } from '../narration/providers.js';

function ids() { let n = 0; return () => `id-${++n}`; }
const empty = (): World => newWorld('w', 'Imported', 1);
const bytesOf = (text: string) => new TextEncoder().encode(text);

// A PNG with only what a card needs: the signature, a text chunk and the end. No checksums are
// read, so none are computed.
function png(chunks: [string, Uint8Array][]): Uint8Array {
  const parts: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (const [type, data] of [...chunks, ['IEND', new Uint8Array()] as [string, Uint8Array]]) {
    parts.push((data.length >>> 24) & 255, (data.length >>> 16) & 255, (data.length >>> 8) & 255, data.length & 255);
    parts.push(...bytesOf(type), ...data, 0, 0, 0, 0);
  }
  return new Uint8Array(parts);
}
const textChunk = (keyword: string, json: unknown): [string, Uint8Array] => ['tEXt', bytesOf(`${keyword}\0${Buffer.from(JSON.stringify(json), 'utf8').toString('base64')}`)];

const v2 = {
  spec: 'chara_card_v2', spec_version: '2.0',
  data: {
    name: 'Seraphine', description: 'A lighthouse keeper.\nTalks to the lamp.', personality: 'gruff, patient', scenario: 'A storm is coming in.',
    first_mes: '*She doesn\'t turn around.* Door\'s open, {{user}}.', alternate_greetings: ['You again.', ''],
    mes_example: '<START>\n{{user}}: Is it always this loud?\n{{char}}: Only when it matters.\nIt matters tonight.\n<START>\n{{char}}: Mind the stairs.',
    creator_notes: 'Play her slow.', system_prompt: 'Write as {{char}}.', post_history_instructions: 'Stay in character.',
    tags: ['lighthouse', 'slow burn'], creator: 'someone', character_version: '1.2',
    character_book: { entries: [
      { keys: ['lamp', 'the light'], content: 'The lamp is older than the tower.', name: 'The lamp', enabled: true },
      { keys: [], content: 'She never leaves the rock.', comment: 'Always', constant: true },
      { keys: ['gone'], content: 'Switched off.', enabled: false },
    ] },
  },
};

describe('Character Card import', () => {
  it('maps a V2 card onto the record model', () => {
    const read = importCardJson(empty(), v2, ids(), 5);
    if (!read.ok) throw new Error(read.errors.join(' '));
    const { world, recordId, scenarioId, notes } = read.result;
    expect(parseWorld(JSON.parse(JSON.stringify(world))).ok).toBe(true);
    const record = recordById(world, recordId)!;
    expect(record).toMatchObject({ kind: 'character', name: 'Seraphine', line: 'gruff, patient', tags: ['lighthouse', 'slow burn'] });
    expect(record.sections.map((section) => [section.title, section.reach, section.keys])).toEqual([
      ['Description', 'here', []],
      ['Personality', 'here', []],
      ['The lamp', 'named', ['lamp', 'the light']],
      ['Always', 'here', []],
      ['gone', 'never', ['gone']],
      ['Creator notes', 'never', []],
      ['System prompt (from the card)', 'never', []],
      ['Post-history instructions (from the card)', 'never', []],
    ]);
    expect(record.greetings.map((greeting) => greeting.text)).toEqual(['*She doesn\'t turn around.* Door\'s open, {{user}}.', 'You again.']);
    expect(record.examples).toHaveLength(2);
    expect(record.examples[0]!.messages).toEqual([
      { fromCharacter: false, text: 'Is it always this loud?', emotion: '' },
      { fromCharacter: true, text: 'Only when it matters.\nIt matters tonight.', emotion: '' },
    ]);
    const scenario = recordById(world, scenarioId)!;
    expect(scenario).toMatchObject({ kind: 'scenario', name: 'Seraphine: scenario' });
    expect(scenario.sections[0]).toMatchObject({ title: 'Scene', reach: 'always', text: 'A storm is coming in.' });
    expect(notes.join(' ')).toContain('not sent');
  });

  it('reads V3, V1 and the older Pygmalion shape', () => {
    const v3 = importCardJson(empty(), { spec: 'chara_card_v3', spec_version: '3.0', data: { ...v2.data, nickname: 'Sera', group_only_greetings: [] } }, ids(), 5);
    expect(v3.ok && recordById(v3.result.world, v3.result.recordId)!.keys).toEqual(['Sera']);
    const v1 = importCardJson(empty(), { name: 'Old', description: 'A V1 card.', personality: '', scenario: '', first_mes: 'Hi.', mes_example: '' }, ids(), 5);
    expect(v1.ok && recordById(v1.result.world, v1.result.recordId)!.greetings[0]!.text).toBe('Hi.');
    const legacy = importCardJson(empty(), { char_name: 'Pyg', char_persona: 'Sharp.', world_scenario: 'A bar.', char_greeting: 'Evening.', example_dialogue: 'You: hi\nPyg: no.' }, ids(), 5);
    if (!legacy.ok) throw new Error('legacy');
    const record = recordById(legacy.result.world, legacy.result.recordId)!;
    expect(record.sections[0]).toMatchObject({ title: 'Description', text: 'Sharp.' });
    expect(record.examples[0]!.messages.map((message) => message.fromCharacter)).toEqual([false, true]);
    expect(importCardJson(empty(), { hello: 'world' }, ids(), 5).ok).toBe(false);
  });

  it('turns a big lorebook into Lore records', () => {
    const entries = Array.from({ length: 70 }, (_, index) => ({ keys: [`key${index}`], content: `Entry ${index}.`, constant: index === 0 }));
    const read = importCardJson(empty(), { ...v2, data: { ...v2.data, character_book: { entries } } }, ids(), 5);
    if (!read.ok) throw new Error('book');
    const lore = read.result.world.records.filter((record) => record.kind === 'lore');
    expect(lore).toHaveLength(70);
    expect(lore[0]!.sections[0]!.reach).toBe('always');
    expect(lore[1]).toMatchObject({ keys: ['key1'] });
    expect(lore[1]!.sections[0]!.reach).toBe('named');
  });

  it('finds the card in a PNG, V3 before V2', () => {
    const file = png([['IHDR', new Uint8Array(13)], textChunk('chara', v2), textChunk('ccv3', { spec: 'chara_card_v3', data: { ...v2.data, name: 'Three' } })]);
    expect(Object.keys(pngTextChunks(file))).toEqual(['chara', 'ccv3']);
    const card = cardFromPng(file);
    expect(card.ok && (card.card as { data: { name: string } }).data.name).toBe('Three');
    const read = importCardFile(empty(), png([textChunk('chara', v2)]), ids(), 5);
    expect(read.ok && read.fromPng && recordById(read.result.world, read.result.recordId)!.name).toBe('Seraphine');
    const bare = importCardFile(empty(), png([['IHDR', new Uint8Array(13)]]), ids(), 5);
    expect(!bare.ok && bare.errors[0]).toContain('no character card');
    expect(importCardFile(empty(), bytesOf(JSON.stringify(v2)), ids(), 5).ok).toBe(true);
    expect(importCardFile(empty(), bytesOf('not json'), ids(), 5).ok).toBe(false);
  });

  it('parses example chats with either name for each side', () => {
    const chats = parseExampleChats('<START>\nYou: hi\nSeraphine: hello\n<START>\n<USER>: one\n<BOT>: two', 'Seraphine', ids());
    expect(chats.map((chat) => chat.messages.map((message) => message.fromCharacter))).toEqual([[false, true], [false, true]]);
  });
});

describe('CharacterRoom cards', () => {
  const contact = {
    cardType: 'contact', name: 'Mira', alias: 'Mimi', description: 'A dock clerk.', gndr: 'female', pronouns: 'she/her', species: 'Human', tags: 'drama',
    persona: 'Wry.', appearance: 'Silver hair.', greeting: 'Hey.', greetingEmotion: 'happy',
    avatarUri: 'data:image/png;base64,AAAA', emotions: { Happy: 'data:image/png;base64,BBBB', sad: 'not an image' },
    exampleMessages: [{ name: 'Ex', userName: 'Sam', messages: [{ isContact: true, text: 'Oh.', emotion: 'smug' }] }],
    brains: [{ name: 'Background', content: 'Grew up by the docks.' }],
    brainsConditional: [{ name: 'Water', content: 'Cannot swim.', keys: ['swim'], requiredIntimacy: 'romantic' }],
    schedule: { Daily: [{ id: 'd', startTime: 1380, endTime: 120, text: 'Asleep.', requiredIntimacy: 'none' }], Friday: [], bogus: 3 },
  };

  it('keeps the gender, the schedule and the pictures of a contact card', () => {
    const read = importCardJson(empty(), contact, ids(), 5);
    if (!read.ok) throw new Error(read.errors.join(' '));
    const record = recordById(read.result.world, read.result.recordId)!;
    expect(record).toMatchObject({ gender: 'female', keys: ['Mimi'], line: 'A dock clerk.' });
    expect(record.schedule!.Daily).toEqual([{ id: 'd', startTime: 1380, endTime: 120, text: 'Asleep.', requiredIntimacy: 'none', sets: {}, rooms: {}, spots: {}, needs: {} }]);
    expect(record.schedule!.Monday).toEqual([]);
    expect(read.result.images).toEqual({ avatar: 'data:image/png;base64,AAAA', emotions: { happy: 'data:image/png;base64,BBBB' } });
    expect(record.sections.find((section) => section.title === 'Water')).toMatchObject({ reach: 'when', when: 'bond-romantic' });
    expect(parseWorld(JSON.parse(JSON.stringify(read.result.world))).ok).toBe(true);
  });

  it('brings a user card in as a persona and a scenario card as a scenario', () => {
    const user = importCardJson(empty(), { cardType: 'user', name: 'Sam', gender: 'male', pronouns: 'he/him', persona: 'Curious.', appearance: 'Tall.', tags: 'student', brains: [{ name: 'Notes', content: 'Likes tea.' }] }, ids(), 5);
    if (!user.ok) throw new Error('user');
    const persona = recordById(user.result.world, user.result.recordId)!;
    expect(user.result.kind).toBe('persona');
    expect(persona.sections.map((section) => [section.title, section.reach])).toEqual([['Who you are', 'always'], ['Appearance', 'here'], ['Notes', 'here']]);
    const scenario = importCardJson(empty(), { cardType: 'scenario', name: 'Cafe', environment: 'A small cafe.', scene: 'Late afternoon.', tags: 'cozy, rain', brains: [{ name: 'Rules', content: 'No phones.' }] }, ids(), 5);
    if (!scenario.ok) throw new Error('scenario');
    const record = recordById(scenario.result.world, scenario.result.recordId)!;
    expect(record.kind).toBe('scenario');
    expect(record.tags).toEqual(['cozy', 'rain']);
    expect(record.sections.map((section) => [section.title, section.reach])).toEqual([['Environment', 'always'], ['Scene', 'always'], ['Rules', 'always']]);
  });

  it('holds each bond condition at its tier and above', () => {
    expect(bondConditionsFor('stranger')).toEqual([]);
    expect(bondConditionsFor('close')).toEqual(['bond-acquaintance', 'bond-close']);
    expect(bondConditionsFor('romantic')).toEqual(['bond-acquaintance', 'bond-close', 'bond-romantic']);
  });
});

describe('streaming', () => {
  it('reads events split across chunks', () => {
    const reader = sseReader();
    expect(reader.push('data: {"a":1}\n\ndata: {"b"')).toEqual(['{"a":1}']);
    expect(reader.push(':2}\r\n\r\nevent: x\ndata: [DONE]')).toEqual(['{"b":2}']);
    expect(reader.rest()).toEqual(['[DONE]']);
  });
  it('finds the text wherever a provider puts it', () => {
    expect(readStreamChunk('{"choices":[{"delta":{"content":"Hi"}}],"model":"m"}')).toMatchObject({ text: 'Hi', model: 'm' });
    expect(readStreamChunk('{"choices":[{"text":"Hi","finish_reason":"stop"}]}')).toMatchObject({ text: 'Hi', finishReason: 'stop' });
    expect(readStreamChunk('{"choices":[{"delta":{"reasoning_content":"hm"}}]}')).toMatchObject({ text: '', reasoning: 'hm' });
    expect(readStreamChunk('[DONE]')).toBeNull();
    expect(readStreamChunk('{"error":{"message":"nope"}}')!.error).toBe('nope');
  });
  it('keeps thinking out of what is shown, even when the tags arrive in pieces', () => {
    const filter = thinkingFilter();
    const shown = ['<thi', 'nk>plan', 'ning</th', 'ink>Hel', 'lo <', 'b>'].map((piece) => filter.push(piece)).join('');
    expect(shown).toBe('Hello <b>');
    expect(filter.text()).toBe('Hello <b>');
    const late = thinkingFilter();
    late.push('secret plan');
    late.push('</think>Hi');
    expect(late.text()).toBe('Hi');
  });
  it('asks for a stream and passes samplers through only when given', () => {
    const novelai = BUILT_IN_PROVIDERS.find((provider) => provider.id === 'novelai')!;
    const request = narrationRequestSchema.parse({ provider: 'novelai', model: 'xialong-v1', mode: 'chat', messages: [{ role: 'system', content: 'AetherRoom' }, { role: 'assistant', content: 'Mira: so' }], temperature: 0.85, top_p: 0.95, top_k: 250, min_p: 0 });
    const upstream = buildUpstream(request, novelai, true);
    expect(upstream.path).toBe('/chat/completions');
    expect(upstream.body).toMatchObject({ stream: true, top_p: 0.95, top_k: 250, min_p: 0, temperature: 0.85 });
    // With no prefill, the messages go exactly as built, an open assistant turn included.
    expect(upstream.body.messages).toEqual(request.messages);
    const plain = buildUpstream(narrationRequestSchema.parse({ provider: 'novelai', model: 'glm-4-6', messages: [{ role: 'user', content: 'Hi' }], stop: ['\nSam:'] }), novelai);
    expect(plain.body).not.toHaveProperty('top_p');
    expect(plain.body.stream).toBe(false);
    expect(plain.body.stop).toContain('\nSam:');
  });
});
