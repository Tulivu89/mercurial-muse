import { describe, expect, it } from 'vitest';
import {
  addAlternative, addReply, DEFAULT_PROMPT, rulesText, emotionPick, GENERAL_LENGTHS, generalLengthOf, lengthWords, readEmotionPick, replyTokensFor, setReplyEmotion, trimToSentence, wantsEmotions, endedFrom, joinText, markEnded, mergeParts, thinkingTokens, keyVariants, addUserMessage, buildRequest, budgetFor, deleteMessage, editMessage, editableText, exportChat, newChat, parseReply, pickedAlt, profileFor,
  readChatFile, readReply, remember, replaceMacros, replyText, resolvePortrait, sceneFor, sheetFor, stepAlternative, windowStartFor, type BuildOptions, type Chat,
} from '../chat/index.js';
import { formatPrompt } from '../narration/formats.js';
import { thinkingConfig } from '../narration/gemini.js';
import { CARD_POST_TITLE, CARD_PROMPT_TITLE } from '../records/tavern.js';
import { ensureCondition, newRecord, newWorld, putRecord, type StoryRecord, type World } from '../records/index.js';

function ids() { let n = 0; return () => `id-${++n}`; }
const NOW = Date.UTC(2026, 8, 11, 15, 30);

function world(): World {
  const next = ids();
  let w = ensureCondition(newWorld('w', 'Low Tide', 1), { id: 'bond-close', label: 'Close or closer' });
  const ada: StoryRecord = { ...newRecord('character', 'ada', 'Ada Moss', next), line: 'The voice of KXRT after midnight.', pronouns: 'she/her', tags: ['radio', 'noir'] };
  ada.sections = [
    { id: 's1', title: 'Personality', reach: 'here', keys: [], when: null, text: 'Dry. Calls everyone {{user}} or pal.' },
    { id: 's2', title: 'Appearance', reach: 'here', keys: [], when: null, text: 'Forty, broad in the shoulders.' },
    { id: 's3', title: 'Speech', reach: 'here', keys: [], when: null, text: 'Low and slow.' },
    { id: 's4', title: 'The flood', reach: 'named', keys: ['flood', 'high water'], when: null, text: 'She lost the station tapes in the flood.' },
    { id: 's5', title: 'What she admits', reach: 'when', keys: [], when: 'bond-close', text: 'She still has the last tape.' },
    { id: 's6', title: 'Author notes', reach: 'never', keys: [], when: null, text: 'Based on nobody.' },
  ];
  ada.greetings = [{ id: 'g1', text: '*The ON AIR light is off.*\nYou lost, pal?', emotion: 'bored' }];
  ada.examples = [{ id: 'e1', name: 'Cold open', userName: 'Caller', messages: [{ fromCharacter: false, text: 'hi', emotion: '' }, { fromCharacter: true, text: 'You\'re on the air.\nMake it count.', emotion: 'smug' }] }];
  const sam: StoryRecord = { ...newRecord('persona', 'sam', 'Sam', next), sections: [{ id: 'p1', title: 'Who you are', reach: 'always', keys: [], when: null, text: 'A night-shift cabbie.' }] };
  const booth: StoryRecord = { ...newRecord('scenario', 'booth', 'Booth B', next), tags: ['rain'], sections: [{ id: 'c1', title: 'Environment', reach: 'always', keys: [], when: null, text: 'A radio booth.' }, { id: 'c2', title: 'Scene', reach: 'always', keys: [], when: null, text: 'Three a.m.' }] };
  const other: StoryRecord = { ...newRecord('scenario', 'other', 'The pier', next), sections: [{ id: 'o1', title: 'Scene', reach: 'always', keys: [], when: null, text: 'NOT THIS ONE.' }] };
  const lore: StoryRecord = { ...newRecord('lore', 'kxrt', 'KXRT', next), sections: [{ id: 'l1', title: 'Entry', reach: 'named', keys: [], when: null, text: 'A thousand watts on a good night.' }] };
  const rule: StoryRecord = { ...newRecord('lore', 'rule', 'The curfew', next), sections: [{ id: 'l2', title: 'Entry', reach: 'always', keys: [], when: null, text: 'Nobody is out after two.' }] };
  for (const record of [ada, sam, booth, other, lore, rule]) w = putRecord(w, record, 2);
  return { ...w, premise: 'A harbour town after midnight.' };
}

function chat(over: Partial<Chat> = {}): Chat {
  const base = newChat({ id: 'c', worldId: 'w', characterId: 'ada', characterName: 'Ada Moss', personaId: 'sam', scenarioId: 'booth', userName: 'Sam', relationship: 'stranger', style: 'roleplay', responseLength: 'medium', greeting: { text: '*The ON AIR light is off.*\nYou lost, pal?', emotion: 'bored' } }, ids(), NOW);
  return { ...base, ...over };
}

const options = (model: string, over: Partial<BuildOptions> = {}): BuildOptions => ({ model, canPrefill: true, contextTokens: 16_000, replyTokens: 1000, nowMs: NOW, upTo: 1, continuing: false, firstBuild: true, dryRun: false, rngInt: (min) => min, ...over });

describe('replies', () => {
  it('reads Name: text and Emotion: word, with neutral when there is none', () => {
    expect(parseReply('Mira: Hey.\n    Again.\n  Emotion: smug\n', 'Mira')).toEqual([{ text: 'Hey.\nAgain.', emotion: 'smug' }]);
    expect(parseReply('Mira: Hey.', 'Mira')).toEqual([{ text: 'Hey.', emotion: 'neutral' }]);
    expect(parseReply('Mira: Hey.\n  Emotion: gleeful', 'Mira')[0]!.emotion).toBe('neutral');
  });
  it('splits several turns in one reply and stops where the model starts writing the player', () => {
    const parts = parseReply('Mira: One.\n  Emotion: happy\nMira: Two.\n  Emotion: tired\nSam: I say something\nMira: Three.', 'Mira', 'Sam');
    expect(parts).toEqual([{ text: 'One.', emotion: 'happy' }, { text: 'Two.', emotion: 'tired' }]);
  });
  it('writes a turn back out as CharacterRoom keeps it', () => {
    expect(replyText([{ text: 'Hey.\nAgain.', emotion: 'smug' }], 'Mira', true)).toBe('Mira: Hey.\n    Again.\n  Emotion: smug');
  });
  it('joins a reply to what it continues, whether or not the model wrote the name again', () => {
    expect(readReply(' Fine.\n  Emotion: bored', 'Ada Moss:', 'Ada Moss', 'Sam')).toEqual([{ text: 'Fine.', emotion: 'bored' }]);
    expect(readReply('Ada Moss: Fine.\n  Emotion: bored', 'Ada Moss:', 'Ada Moss', 'Sam')).toEqual([{ text: 'Fine.', emotion: 'bored' }]);
    expect(readReply(' and then some.\n  Emotion: happy', 'Ada Moss: A start', 'Ada Moss', 'Sam')).toEqual([{ text: 'A start and then some.', emotion: 'happy' }]);
  });
  it('keeps a reply in one piece for models other than xialong', () => {
    // Gemini writes the name again when it carries a cut reply on; that is no new piece.
    expect(readReply('Ada Moss: reaches for the dial.\n  Emotion: smug', 'Ada Moss: Not tonight. *She', 'Ada Moss', 'Sam', true))
      .toEqual([{ text: 'Not tonight. *She reaches for the dial.', emotion: 'smug' }]);
    // A chat model's carry-on has no leading space; the join puts one in.
    expect(readReply('and fast.', 'Ada Moss: It\'s clean', 'Ada Moss', 'Sam', true)).toEqual([{ text: 'It\'s clean and fast.', emotion: 'neutral' }]);
    expect(readReply('Ada Moss: One.\n  Emotion: happy\nAda Moss: Two.\n  Emotion: tired', '', 'Ada Moss', 'Sam', true)).toEqual([{ text: 'One.\nTwo.', emotion: 'tired' }]);
    // xialong keeps its pieces.
    expect(readReply('Ada Moss: One.\n  Emotion: happy\nAda Moss: Two.\n  Emotion: tired', '', 'Ada Moss', 'Sam')).toHaveLength(2);
  });
  it('joins two pieces of a reply by how the second one starts', () => {
    expect(joinText('*She', 'reaches')).toBe('*She reaches');
    expect(joinText('Wait', ', what?')).toBe('Wait, what?');
    expect(joinText('Done.', 'Next.')).toBe('Done.\nNext.');
    expect(joinText('Done.\n', 'Next.')).toBe('Done.\nNext.');
    expect(mergeParts([{ text: 'A *She', emotion: 'neutral' }, { text: 'grins.*', emotion: 'smug' }])).toEqual([{ text: 'A *She grins.*', emotion: 'smug' }]);
  });
  it('reads why a reply stopped, and marks it on the reply', () => {
    expect(endedFrom('length')).toBe('limit');
    expect(endedFrom('MAX_TOKENS')).toBe('limit');
    expect(endedFrom('content_filter')).toBe('filter');
    expect(endedFrom('SAFETY')).toBe('filter');
    expect(endedFrom('stop')).toBeUndefined();
    expect(endedFrom(null)).toBeUndefined();
    expect(thinkingTokens({ completion_tokens: 900, completion_tokens_details: { reasoning_tokens: 700 } })).toBe(700);
    expect(thinkingTokens({ completion_tokens: 900 })).toBeUndefined();
    let c = addReply(chat(), [{ text: 'Half', emotion: 'neutral' }], 'r1', NOW + 1);
    c = markEnded(c, 'r1', 'limit', 700);
    expect(pickedAlt(c.messages.at(-1)!)).toMatchObject({ ended: 'limit', thinking: 700 });
    c = markEnded(c, 'r1', undefined, 700);
    expect(pickedAlt(c.messages.at(-1)!)).not.toHaveProperty('ended');
    expect(pickedAlt(c.messages.at(-1)!)).not.toHaveProperty('thinking');
    // It survives a round trip through the chat file.
    const marked = markEnded(c, 'r1', 'filter', undefined);
    const back = readChatFile(JSON.parse(JSON.stringify(exportChat(marked, NOW))));
    expect(back.ok && pickedAlt(back.chat.messages.at(-1)!).ended).toBe('filter');
  });
  it('asks for a length in words, with an allowance to match', () => {
    expect(lengthWords('roleplay', 'unspecified')).toBe('two to four paragraphs');
    expect(lengthWords('novel', 'short')).toBe('one paragraph');
    expect(lengthWords('chat', 'long')).toBe('several lines');
    expect(lengthWords('roleplay', 'spammy very long')).toBe('six paragraphs or more');
    expect(replyTokensFor('long', 300)).toBe(1100);
    expect(replyTokensFor('short', 1000)).toBe(1000);
    expect(GENERAL_LENGTHS).toContain(generalLengthOf('medium'));
    expect(generalLengthOf('spammy long')).toBe('long');
  });
  it('picks an emotion after the reply only where something shows it', () => {
    expect(wantsEmotions(['avatar'], false)).toBe(false);
    expect(wantsEmotions(['avatar', 'neutral'], false)).toBe(false);
    expect(wantsEmotions(['avatar', 'happy'], false)).toBe(true);
    expect(wantsEmotions([], true)).toBe(true);
    const ask = emotionPick('*She laughs.*', 'Ada Moss', ['smug', 'neutral', 'smug']);
    expect(ask[0]!.content).toContain('one word from this list');
    expect(ask[0]!.content).toContain('has just shown smug');
    expect(ask[1]!.content).toBe('*She laughs.*');
    expect(readEmotionPick('Laughing.')).toBe('laughing');
    expect(readEmotionPick('<think>maybe sad</think> playful')).toBe('playful');
    expect(readEmotionPick('She seems lovestruck')).toBe('love');
    expect(readEmotionPick('dunno')).toBeNull();
    let c = addReply(chat(), [{ text: 'A', emotion: 'neutral' }, { text: 'b', emotion: 'neutral' }], 'r1', NOW + 1);
    c = setReplyEmotion(c, 'r1', 'happy');
    expect(pickedAlt(c.messages.at(-1)!).parts.map((part) => part.emotion)).toEqual(['neutral', 'happy']);
  });
  it('trims a cut-off reply back to its last sentence end', () => {
    expect(trimToSentence('She laughs. Then she turns and the')).toBe('She laughs.');
    expect(trimToSentence('*She laughs.* Then she')).toBe('*She laughs.*');
    expect(trimToSentence('Done.')).toBe('Done.');
    expect(trimToSentence('no end at all')).toBe('no end at all');
  });
  it('finds a stand-in portrait for an empty slot', () => {
    expect(resolvePortrait('laughing', ['happy', 'avatar'])).toBe('happy');
    expect(resolvePortrait('angry', ['neutral', 'avatar'])).toBe('neutral');
    expect(resolvePortrait('angry', ['avatar'])).toBe('avatar');
    expect(resolvePortrait('angry', [])).toBeNull();
  });
  it('replaces macros', () => {
    expect(replaceMacros('{{char}} and {{user}}, $c and $user. {{date}} {{time24}}', 'Ada', 'Sam', NOW)).toBe('Ada and Sam, Ada and Sam. 2026-09-11 15:30');
  });
});

describe('a chat', () => {
  it('starts with the greeting, keeps every alternative, and edits and deletes in place', () => {
    let c = chat();
    expect(c.messages).toHaveLength(1);
    c = addUserMessage(c, 'Looking for the flood tapes.', 'u1', NOW + 1);
    c = addReply(c, [{ text: 'No.', emotion: 'bored' }], 'a1', NOW + 2, 'm');
    c = addAlternative(c, 'a1', [{ text: 'Maybe.', emotion: 'thinking' }], NOW + 3, 'm');
    expect(c.messages[2]!.alts).toHaveLength(2);
    expect(pickedAlt(c.messages[2]!).parts[0]!.text).toBe('Maybe.');
    c = stepAlternative(c, 'a1', -1, NOW + 4);
    expect(pickedAlt(c.messages[2]!).parts[0]!.text).toBe('No.');
    expect(editableText(c.messages[2]!, 'Ada Moss')).toBe('No.\n  Emotion: bored');
    c = editMessage(c, 'a1', 'No, pal.\n  Emotion: irritated', 'Ada Moss', NOW + 5);
    expect(pickedAlt(c.messages[2]!).parts).toEqual([{ text: 'No, pal.', emotion: 'irritated' }]);
    expect(c.messages[2]!.alts[1]!.parts[0]!.text).toBe('Maybe.');
    c = deleteMessage(c, 'u1', NOW + 6);
    expect(c.messages.map((message) => message.id)).not.toContain('u1');
    c = remember(c, '  Sam drives   nights. ', 'j1', NOW + 7);
    expect(c.journal[0]!.text).toBe('Sam drives nights.');
    const back = readChatFile(JSON.parse(JSON.stringify(exportChat(c, NOW))));
    expect(back.ok && back.chat).toEqual(c);
    expect(readChatFile({ format: 'nope' }).ok).toBe(false);
  });
});

describe('the General profile', () => {
  it('picks the profile by model', () => {
    expect(profileFor('xialong-v1')).toBe('aetherroom');
    expect(profileFor('glm-4-6')).toBe('general');
    expect(profileFor('deepseek/deepseek-chat')).toBe('general');
  });

  it('lays out rules, character, persona, scenario, examples, journal, transcript, then the moment', async () => {
    let c = addUserMessage(chat(), 'Tell me about the flood.', 'u1', NOW + 1);
    c = remember(c, '{{user}} drives nights.', 'j1', NOW + 2);
    const built = (await buildRequest(c, world(), options('glm-4-6', { upTo: 2 })))!;
    expect(built.profile).toBe('general');
    expect(built.messages.map((message) => message.role)).toEqual(['system', 'system', 'user', 'assistant', 'user']);
    const system = built.messages[0]!.content;
    const order = ['You are Ada Moss', '## Ada Moss', 'Personality: Dry. Calls everyone Sam or pal.', 'Ada Moss doesn\'t know Sam yet.', '## Sam, who Ada Moss is talking to', 'A night-shift cabbie.', '## The scenario', 'Environment: A radio booth.', 'Nobody is out after two.', '## How Ada Moss writes', 'Caller: hi', 'Ada Moss: You\'re on the air.\nMake it count.'];
    expect(system).not.toContain('Emotion');
    let at = -1;
    for (const needle of order) { const found = system.indexOf(needle, at + 1); expect(found, needle).toBeGreaterThan(at); at = found; }
    // Nothing behind a key, a condition that doesn't hold, a Never, or another scenario.
    for (const absent of ['lost the station tapes', 'last tape', 'Based on nobody', 'NOT THIS ONE', 'harbour town']) expect(system).not.toContain(absent);
    expect(built.messages[1]!.content).toContain('- Sam drives nights.');
    expect(built.messages[2]!.content).toBe('[The chat begins.]');
    expect(built.messages[3]!.content).toBe('Ada Moss: *The ON AIR light is off.*\nYou lost, pal?');
    const last = built.messages[4]!.content;
    expect(last.startsWith('Tell me about the flood.\n\n[Style: roleplay. Length: two to four paragraphs.')).toBe(true);
    expect(last).toContain('Ada Moss, The flood: She lost the station tapes in the flood.');
    expect(last.endsWith('Reply as Ada Moss only.]')).toBe(true);
    expect(built.prefill).toBe('Ada Moss:');
  });

  it('sends a reply that came in pieces back as one turn, with no emotion line', async () => {
    let c = addUserMessage(chat(), 'Go on.', 'u1', NOW + 1);
    c = addReply(c, [{ text: 'Not tonight. *She', emotion: 'neutral' }, { text: 'reaches for the dial.*', emotion: 'smug' }], 'r1', NOW + 2);
    c = addUserMessage(c, 'And?', 'u2', NOW + 3);
    const built = (await buildRequest(c, world(), options('glm-4-6', { upTo: 4 })))!;
    const reply = built.messages.find((message) => message.role === 'assistant' && message.content.includes('dial'))!;
    expect(reply.content).toContain('Ada Moss: Not tonight. *She reaches for the dial.*');
    expect(reply.content).not.toContain('Emotion:');
  });

  it('builds the rules from the player\'s prompt setup, mature content on by default', () => {
    const plain = rulesText(DEFAULT_PROMPT, 'Ada Moss', 'Sam');
    expect(plain).toContain('You are Ada Moss, in a private one-on-one chat with Sam.');
    expect(plain).toContain('This is fiction between adults.');
    const changed = rulesText({ ...DEFAULT_PROMPT, off: ['content', 'voice'], texts: { format: 'Write in plain prose, {{user}}.' } }, 'Ada Moss', 'Sam');
    expect(changed).not.toContain('fiction between adults');
    expect(changed).not.toContain('example chats');
    expect(changed).toContain('Write in plain prose, Sam.');
    expect(changed).toContain('Styles and lengths');
  });

  it('sends a card\'s own prompt and post-history line only when the player asks', async () => {
    let w = world();
    const ada = w.records.find((record) => record.id === 'ada')!;
    w = putRecord(w, { ...ada, sections: [...ada.sections, { id: 'cp', title: CARD_PROMPT_TITLE, reach: 'never', keys: [], when: null, text: 'Stay noir, {{user}}.' }, { id: 'ph', title: CARD_POST_TITLE, reach: 'never', keys: [], when: null, text: 'Short lines.' }] }, 3);
    const c = addUserMessage(chat(), 'Hi.', 'u1', NOW + 1);
    const off = (await buildRequest(c, w, options('glm-4-6', { upTo: 2 })))!;
    expect(JSON.stringify(off.messages)).not.toContain('Stay noir');
    const on = (await buildRequest(c, w, options('glm-4-6', { upTo: 2, prompt: { ...DEFAULT_PROMPT, cardPrompt: true, after: 'Mind the clock.' } })))!;
    expect(on.messages[0]!.content).toContain('Stay noir, Sam.');
    const note = on.messages.at(-1)!.content;
    expect(note).toContain('Short lines.');
    expect(note.indexOf('Mind the clock.')).toBeLessThan(note.indexOf('Reply as Ada Moss only.'));
  });

  it('sets Gemini\'s thinking where the player asked for less', () => {
    expect(thinkingConfig('models/gemini-3.8-flash', 'off')).toEqual({ thinkingConfig: { thinkingLevel: 'minimal' } });
    expect(thinkingConfig('gemini-3-pro', 'off')).toEqual({ thinkingConfig: { thinkingLevel: 'low' } });
    expect(thinkingConfig('gemini-2.5-flash', 'off')).toEqual({ thinkingConfig: { thinkingBudget: 0 } });
    expect(thinkingConfig('gemini-2.5-pro', 'low')).toEqual({ thinkingConfig: { thinkingBudget: 1024 } });
    expect(thinkingConfig('gemini-3.8-flash', 'default')).toEqual({});
    expect(thinkingConfig('gemma-3-27b', 'low')).toEqual({});
  });

  it('keeps the prefix the same from one turn to the next', async () => {
    const first = addUserMessage(chat(), 'Evening.', 'u1', NOW + 1);
    const a = (await buildRequest(first, world(), options('glm-4-6', { upTo: 2 })))!;
    const second = addUserMessage(addReply(first, [{ text: 'Is it.', emotion: 'bored' }], 'a1', NOW + 2), 'It is.', 'u2', NOW + 3);
    const b = (await buildRequest(second, world(), options('glm-4-6', { upTo: 4, nowMs: NOW + 60_000 })))!;
    expect(b.messages[0]).toEqual(a.messages[0]);
    expect(b.messages.slice(1, 3)).toEqual(a.messages.slice(1, 3));
    const promptA = formatPrompt('glm', a.messages, a.prefill).prompt;
    const promptB = formatPrompt('glm', b.messages, b.prefill).prompt;
    const shared = promptA.indexOf('Evening.') + 'Evening.'.length;
    expect(promptB.slice(0, shared)).toBe(promptA.slice(0, shared));
  });

  it('brings a bonded section in once the relationship reaches it, and drops lore the chat switched off', async () => {
    const close = (await buildRequest(chat({ relationship: 'romantic' }), world(), options('glm-4-6')))!;
    expect(close.messages[0]!.content).toContain('Ada Moss and Sam are romantic partners.');
    expect(close.messages.at(-1)!.content).toContain('What she admits: She still has the last tape.');
    const off = (await buildRequest(chat({ loreOff: ['rule'] }), world(), options('glm-4-6')))!;
    expect(off.messages[0]!.content).not.toContain('Nobody is out after two.');
  });

  it('keeps another chat character\'s brains out, and nobody else\'s bond-gated section reads this chat\'s bond', async () => {
    const next = ids();
    const notes = (who: string) => [
      { id: `${who}-n`, title: 'Background', reach: 'named' as const, keys: ['where are you from'], when: null, text: `${who.toUpperCase()} BACKGROUND.` },
      { id: `${who}-w`, title: 'In Bed', reach: 'when' as const, keys: ['kiss'], when: 'bond-close', text: `${who.toUpperCase()} IN BED.` },
    ];
    let w = world();
    w = putRecord(w, { ...newRecord('character', 'lux', 'Lux', next), chatListed: true, sections: notes('lux') }, 3);
    w = putRecord(w, { ...newRecord('character', 'bram', 'Bram', next), sections: notes('bram') }, 3);
    const asked = chat({ relationship: 'romantic', draft: 'Where are you from? Kiss me.' });
    for (const model of ['glm-4-6', 'xialong-v1']) {
      const built = (await buildRequest(asked, w, options(model, { draft: asked.draft })))!;
      const sent = built.messages.map((message) => message.content).join('\n');
      expect(sent).not.toContain('LUX');
      expect(sent).not.toContain('BRAM IN BED.');
      expect(sent).toContain('BRAM BACKGROUND.');
    }
  });

  it('carries a message on with a prefill, or asks for it where there is none', async () => {
    const withPrefill = (await buildRequest(chat(), world(), options('glm-4-6', { continuing: true })))!;
    expect(withPrefill.prefill).toBe('Ada Moss: *The ON AIR light is off.*\nYou lost, pal?');
    expect(withPrefill.messages.at(-1)!.role).toBe('user');
    expect(withPrefill.messages.some((message) => message.role === 'assistant')).toBe(false);
    const without = (await buildRequest(chat(), world(), options('deepseek-chat', { continuing: true, canPrefill: false })))!;
    expect(without.prefill).toBe('');
    expect(without.messages.at(-2)!.content).toBe('Ada Moss: *The ON AIR light is off.*\nYou lost, pal?');
    expect(without.messages.at(-1)!.content).toContain('Carry on Ada Moss\'s last message');
  });

  it('moves the window a piece at a time and lets go when everything fits again', () => {
    const costs = new Array<number>(40).fill(100);
    expect(windowStartFor(costs, 0, 5000, 3000)).toBe(0);
    expect(windowStartFor(costs, 0, 3500, 2000)).toBe(20);
    expect(windowStartFor(costs, 20, 3500, 2000)).toBe(20);
    expect(windowStartFor([...costs, ...new Array<number>(16).fill(100)], 20, 3500, 2000)).toBe(36);
    expect(windowStartFor(costs.slice(0, 10), 20, 3500, 2000)).toBe(0);
    const budget = budgetFor(16_000, 1000, 2000);
    expect(budget.high).toBe(11_800);
    expect(budget.low).toBeLessThan(budget.high);
  });

  it('cuts a long chat to the window and says so', async () => {
    let c = chat();
    for (let turn = 0; turn < 60; turn += 1) {
      c = addUserMessage(c, `Message ${turn} ${'x'.repeat(400)}`, `u${turn}`, NOW + turn);
      c = addReply(c, [{ text: `Reply ${turn} ${'y'.repeat(400)}`, emotion: 'neutral' }], `a${turn}`, NOW + turn);
    }
    const built = (await buildRequest(c, world(), options('glm-4-6', { upTo: c.messages.length, contextTokens: 8000 })))!;
    expect(built.windowStart).toBeGreaterThan(0);
    expect(built.tokens).toBeLessThan(8000 - 1000);
    expect(built.messages[1]!.role).toBe('user');
    expect(built.messages.some((message) => message.content.includes('Message 0 '))).toBe(false);
    expect(built.messages.at(-2)!.content).toContain('Reply 59 ');
    expect(built.notes[0]).toContain('The window starts at message');
    const again = (await buildRequest({ ...c, windowStart: built.windowStart }, world(), options('glm-4-6', { upTo: c.messages.length, contextTokens: 8000 })))!;
    expect(again.windowStart).toBe(built.windowStart);
  });
});

describe('the AetherRoom profile from records', () => {
  it('fires a lower-case key on a capitalised word, since the kernel matches case-sensitively', async () => {
    expect(keyVariants(['flood', 'high water', 'Flood'])).toEqual(['flood', 'Flood', 'high water', 'High water']);
    expect(keyVariants(['$directives', '#tag here'])).toEqual(['directives', 'Directives', 'tag here', 'Tag here']);
    const said = addUserMessage(chat(), 'Flood took it all.', 'u1', NOW);
    const built = (await buildRequest(said, world(), options('xialong-v1', { upTo: 2 })))!;
    expect(built.messages.some((message) => message.content.includes('She lost the station tapes in the flood.'))).toBe(true);
  });

  it('reads records as CharacterRoom cards', () => {
    const scene = sceneFor(world(), chat({ relationship: 'close' }), NOW)!;
    const sheet = sheetFor(scene);
    expect(sheet.char.persona).toBe('Dry. Calls everyone {{user}} or pal.');
    expect(sheet.char.appearance).toBe('Forty, broad in the shoulders.');
    expect(sheet.char.brains!.map((brain) => brain.name)).toEqual(['Speech', 'What she admits']);
    expect(sheet.char.brainsConditional!.map((brain) => brain.name)).toEqual(['The flood', 'KXRT']);
    expect(sheet.char.brainsConditional![1]!.keys).toEqual(['KXRT']);
    expect(sheet.user.persona).toBe('A night-shift cabbie.');
    expect(sheet.scenario).toMatchObject({ environment: 'A radio booth.', scene: 'Three a.m.', tags: 'rain' });
    expect(sheet.floaty.map((entry) => entry.entry.name)).toEqual(['The curfew']);
    expect(sheetFor(sceneFor(world(), chat(), NOW)!).char.brains!.map((brain) => brain.name)).toEqual(['Speech']);
  });

  it('builds CharacterRoom\'s context for xialong', async () => {
    let c = addUserMessage(chat(), 'Tell me about the flood.\nAll of it.', 'u1', NOW + 1);
    c = remember(c, '{{user}} drives nights.', 'j1', NOW + 2);
    const built = (await buildRequest(c, world(), options('xialong-v1', { upTo: 2, contextTokens: 28_672 })))!;
    expect(built.profile).toBe('aetherroom');
    expect(built.prefill).toBe('');
    expect(built.messages[0]!.content).toBe([
      'AetherRoom', '----', 'Ada Moss', 'Type: contact', 'Pronouns: she/her', 'Personality: Dry. Calls everyone Sam or pal.', 'Appearance: Forty, broad in the shoulders.',
      'Opinion of Sam: Doesn\'t know Sam.', 'Categories: radio, noir', 'Example quotes:', '1.', ' Caller: hi', ' Ada Moss: You\'re on the air.', '     Make it count.', '   Emotion: smug',
      '----', 'Sam', 'Type: user', 'Personality: A night-shift cabbie.', '----', 'Environment: A radio booth.', 'Scene: Three a.m.', 'Tags: rain', '----', 'Speech', 'Low and slow.', '',
    ].join('\n'));
    expect(built.messages.slice(1).map((message) => [message.role, message.content])).toEqual([
      ['system', 'Start of chat.'],
      ['system', '----\nThe curfew\nNobody is out after two.'],
      ['system', '----\nFacts About Sam\nAda Moss knows the following about Sam and feels comfortable referencing this information in interactions.\n- Sam drives nights.'],
      ['system', '----\nThe flood\nShe lost the station tapes in the flood.'],
      ['assistant', 'Ada Moss: *The ON AIR light is off.*\n    You lost, pal?\n  Emotion: bored\n'],
      ['user', 'Sam: Tell me about the flood.\n    All of it.'],
      ['system', '[ Style: roleplay; Response length: medium ]'],
    ]);
  });

  it('sends the open turn when a message is carried on', async () => {
    const built = (await buildRequest(chat({ style: 'novel', responseLength: 'unspecified' }), world(), options('xialong-v1', { continuing: true })))!;
    expect(built.messages.at(-1)).toEqual({ role: 'assistant', content: 'Ada Moss: *The ON AIR light is off.*\n    You lost, pal?' });
    expect(built.messages.at(-2)!.content).toBe('[ Style: roleplay, novel style ]');
    expect(built.lead).toBe('Ada Moss: *The ON AIR light is off.*\n    You lost, pal?');
  });
});
