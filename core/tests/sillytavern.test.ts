// Chats in and out as SillyTavern's chat files (X4).
import { describe, expect, it } from 'vitest';
import { addAlternative, addNote, addReply, addUserMessage, chatToSillyTavern, chatToText, newChat, pickedAlt, readSillyTavernChat, withSillyTavernTurns, type Chat } from '../chat/index.js';

function ids() { let n = 0; return () => `id-${++n}`; }
const NOW = Date.UTC(2026, 10, 18, 12);
const fresh = (): Chat => newChat({ id: 'c', worldId: 'w', characterId: 'ada', characterName: 'Ada Moss', personaId: null, scenarioId: null, userName: 'Sam', relationship: 'stranger', style: 'roleplay', responseLength: 'unspecified', greeting: { text: 'You lost, pal?', emotion: 'bored' } }, ids(), NOW);

describe('SillyTavern chat files', () => {
  it('writes a header, then a line a message, every alternative a swipe', () => {
    let c = addUserMessage(fresh(), 'No.', 'u1', NOW + 1);
    c = addReply(c, [{ text: 'First *She', emotion: 'neutral' }, { text: 'shrugs.*', emotion: 'smug' }], 'r1', NOW + 2);
    c = addAlternative(c, 'r1', [{ text: 'Second.', emotion: 'happy' }], NOW + 3);
    c = addNote(c, '[It starts raining.]', 'n1', NOW + 4);
    const lines = chatToSillyTavern(c).trim().split('\n').map((line) => JSON.parse(line));
    expect(lines[0]).toMatchObject({ user_name: 'Sam', character_name: 'Ada Moss', chat_metadata: {} });
    expect(lines[1]).toMatchObject({ name: 'Ada Moss', is_user: false, mes: 'You lost, pal?', swipes: ['You lost, pal?'], swipe_id: 0 });
    expect(lines[2]).toMatchObject({ name: 'Sam', is_user: true, mes: 'No.' });
    expect(lines[3]).toMatchObject({ mes: 'Second.', swipes: ['First *She shrugs.*', 'Second.'], swipe_id: 1 });
    expect(lines[4]).toMatchObject({ is_user: true, mes: '[It starts raining.]' });
    expect(chatToText(c)).toBe('Ada Moss: You lost, pal?\n\nSam: No.\n\nAda Moss: Second.\n\nNote: [It starts raining.]\n');
  });

  it('reads SillyTavern\'s files, new and old, with swipes and hidden lines', () => {
    const file = [
      { chat_metadata: { integrity: 'x' }, user_name: 'unused', character_name: 'unused' },
      { name: 'Mara', is_user: false, is_system: false, send_date: '2026-11-01T10:00:00.000Z', mes: 'Ferry\'s late.', swipes: ['Ferry\'s late.', 'Ferry\'s gone.'], swipe_id: 0, extra: {} },
      { name: 'Jo', is_user: true, is_system: false, send_date: 'November 1, 2026 10:01am', mes: 'Again?' },
      { name: 'Narrator', is_user: false, is_system: true, mes: 'Fog comes in.' },
      { name: 'Mara', is_user: false, mes: 'Again.', swipes: [{ message: 'Again.' }], swipe_id: 0 },
    ].map((line) => JSON.stringify(line)).join('\n');
    const read = readSillyTavernChat(file);
    if (!read.ok) throw new Error(read.error);
    expect(read).toMatchObject({ characterName: 'Mara', userName: 'Jo' });
    expect(read.turns.map((turn) => turn.from)).toEqual(['character', 'user', 'note', 'character']);
    expect(read.turns[0]).toMatchObject({ texts: ['Ferry\'s late.', 'Ferry\'s gone.'], pick: 0, at: Date.parse('2026-11-01T10:00:00.000Z') });
    expect(read.turns[2]!.texts).toEqual(['[Fog comes in.]']);
    expect(read.turns[3]!.texts).toEqual(['Again.']);
    const chat = withSillyTavernTurns(fresh(), read.turns, ids(), NOW);
    expect(chat.messages).toHaveLength(4);
    expect(chat.messages[0]!.alts).toHaveLength(2);
    expect(pickedAlt(chat.messages[0]!).parts[0]!.text).toBe('Ferry\'s late.');
    const old = readSillyTavernChat([{ user_name: 'Jo', character_name: 'Mara', create_date: 'x' }, { name: 'Mara', is_user: false, mes: 'Hi.' }].map((line) => JSON.stringify(line)).join('\n'));
    expect(old.ok && old.characterName).toBe('Mara');
  });

  it('round-trips its own files, and says when a file is not one', () => {
    let c = addUserMessage(fresh(), 'No.', 'u1', NOW + 1);
    c = addReply(c, [{ text: 'Fine.', emotion: 'neutral' }], 'r1', NOW + 2);
    const read = readSillyTavernChat(chatToSillyTavern(c));
    expect(read.ok && read.turns.map((turn) => turn.texts[turn.pick])).toEqual(['You lost, pal?', 'No.', 'Fine.']);
    expect(readSillyTavernChat('not json')).toMatchObject({ ok: false });
    expect(readSillyTavernChat(JSON.stringify({ chat_metadata: {} }))).toMatchObject({ ok: false });
  });
});
