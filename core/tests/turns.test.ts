// Branches, Write my turn and reading aloud (feature sweep, F1).
import { describe, expect, it } from 'vitest';
import { addAlternative, addNote, addReply, addUserMessage, branchChat, chapterWritten, myTurnRequest, newChat, queueChapters, readMyTurn, speakableText, type Chat } from '../chat/index.js';

function ids(prefix = 'id') { let n = 0; return () => `${prefix}-${++n}`; }
const NOW = Date.UTC(2026, 10, 18, 12);
const base = (): Chat => newChat({ id: 'c', worldId: 'w', characterId: 'ada', characterName: 'Ada Moss', personaId: null, scenarioId: null, userName: 'Sam', relationship: 'stranger', style: 'roleplay', responseLength: 'unspecified', greeting: null }, ids(), NOW);

describe('branches', () => {
  it('copies the chat up to a message, alternatives and memory kept, and remembers where it came from', () => {
    let c = addUserMessage(base(), 'One.', 'u1', NOW);
    c = addReply(c, [{ text: 'A.', emotion: 'neutral' }], 'r1', NOW);
    c = addAlternative(c, 'r1', [{ text: 'B.', emotion: 'neutral' }], NOW);
    c = addUserMessage(c, 'Two.', 'u2', NOW);
    c = addReply(c, [{ text: 'C.', emotion: 'neutral' }], 'r2', NOW);
    c = { ...c, journal: [{ id: 'j', text: 'Sam drives.', at: 1, active: true }] };
    c = queueChapters(c, 2, ids('ch'), NOW);
    c = queueChapters(c, 4, ids('ch2'), NOW);
    c = chapterWritten(c, c.chapters[0]!.id, { text: 'They met.', keys: [] }, NOW);
    const branch = branchChat(c, 'r1', 'b', NOW + 5)!;
    expect(branch.id).toBe('b');
    expect(branch.messages.map((message) => message.id)).toEqual(['u1', 'r1']);
    expect(branch.messages[1]!.alts).toHaveLength(2);
    expect(branch.journal).toEqual(c.journal);
    expect(branch.chapters.map((chapter) => chapter.text)).toEqual(['They met.']);
    expect(branch.branchOf).toEqual({ chatId: 'c', messageId: 'r1' });
    expect(branchChat(c, 'missing', 'b', NOW)).toBeNull();
  });
});

describe('Write my turn', () => {
  it('turns the reply request to the player\'s next message, started on their name', () => {
    const turn = myTurnRequest([{ role: 'system', content: 'Rules.' }, { role: 'user', content: 'Hi.\n\n[Reply as Ada Moss only.]' }], 'Ada Moss', 'Sam');
    expect(turn.messages.at(-1)!.content).toContain("[This time, write Sam's next message instead of Ada Moss's");
    expect(turn.lead).toBe('Sam:');
    expect(turn.stop).toEqual(['\nAda Moss:']);
    expect(readMyTurn('Sam: *I lean in.* Tell me.\nAda Moss: No.', 'Ada Moss', 'Sam')).toBe('*I lean in.* Tell me.');
    expect(readMyTurn(' Fine, fine.\n  Emotion: bored', 'Ada Moss', 'Sam')).toBe('Fine, fine.');
  });
});

describe('reading aloud', () => {
  it('says the words, not the markup or the notes', () => {
    let c = addReply(base(), [{ text: '*She leans back.* Not tonight. (Maybe tomorrow.) [ignore this]', emotion: 'neutral' }], 'r1', NOW);
    c = addNote(c, '[It rains.]', 'n1', NOW);
    expect(speakableText(c, 'r1')).toBe('She leans back. Not tonight. Maybe tomorrow.');
    expect(speakableText(c, 'n1')).toBe('');
  });
});
