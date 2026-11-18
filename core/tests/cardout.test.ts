// Characters out as cards, back whole, and CHARX in (X3).
import { zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { cardFromPng, cardFromRecord, ensureCondition, importCardFile, importCardJson, newRecord, newWorld, parseWorld, pngTextChunks, pngWithCard, putRecord, recordById, type World } from '../records/index.js';

function ids() { let n = 0; return () => `id-${++n}`; }
const NOW = Date.UTC(2026, 10, 18, 12);

function world(): World {
  const next = ids();
  let w = ensureCondition(newWorld('w', 'Low Tide', 1), { id: 'bond-close', label: 'Close or closer' });
  w = putRecord(w, { ...newRecord('character', 'ada', 'Ada Moss', next), keys: ['Ada'], line: 'The voice of KXRT after midnight.', tags: ['radio'], sections: [
    { id: 's1', title: 'Look', reach: 'here', keys: [], when: null, text: 'Broad shoulders.' },
    { id: 's2', title: 'The flood', reach: 'named', keys: ['flood'], also: ['tapes'], when: null, text: 'She lost the tapes.' },
    { id: 's3', title: 'What she admits', reach: 'when', keys: [], when: 'bond-close', text: 'She kept one.' },
    { id: 's4', title: 'Notes', reach: 'never', keys: [], when: null, text: 'Secret.' },
    { id: 's5', title: "Character's note (from the card)", reach: 'here', keys: [], when: null, text: 'Ada never apologises.' },
  ], greetings: [{ id: 'g1', text: 'You lost, pal?', emotion: '' }, { id: 'g2', text: 'Again?', emotion: '' }],
  examples: [{ id: 'e1', name: 'One', userName: 'Caller', messages: [{ fromCharacter: false, text: 'hi', emotion: '' }, { fromCharacter: true, text: 'On air.', emotion: '' }] }],
  cardExtensions: { talkativeness: '0.5' } }, 2);
  return w;
}

// The smallest PNG: the signature, a header, one pixel of data and the end.
const PIXEL = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='), (char) => char.charCodeAt(0));

describe('a character out as a card', () => {
  it('writes a V3 card other apps read, keeping back what is kept back', () => {
    const card = cardFromRecord(world(), 'ada', NOW) as { spec: string; data: Record<string, any> };
    expect(card.spec).toBe('chara_card_v3');
    const data = card.data;
    expect(data.description).toBe('Look: Broad shoulders.');
    expect(data.personality).toBe('The voice of KXRT after midnight.');
    expect(data.first_mes).toBe('You lost, pal?');
    expect(data.alternate_greetings).toEqual(['Again?']);
    expect(data.mes_example).toBe('<START>\n{{user}}: hi\n{{char}}: On air.');
    expect(data.group_only_greetings).toEqual([]);
    expect(JSON.stringify(data.description + data.character_book.entries.map((entry: { content: string }) => entry.content).join())).not.toContain('Secret.');
    const [flood, admits] = data.character_book.entries;
    expect(flood).toMatchObject({ keys: ['flood'], content: 'She lost the tapes.', enabled: true, selective: true, secondary_keys: ['tapes'] });
    expect(admits).toMatchObject({ keys: ['Ada Moss', 'Ada'], enabled: false, comment: 'Only while: Close or closer' });
    expect(data.extensions.depth_prompt).toEqual({ prompt: 'Ada never apologises.', depth: 4, role: 'system' });
    expect(data.extensions.talkativeness).toBe('0.5');
    expect(data.extensions.inkwyrm.record.name).toBe('Ada Moss');
  });

  it('puts the card in a PNG twice, as V2 and V3, with sound chunks, replacing any card it had', () => {
    const card = cardFromRecord(world(), 'ada', NOW)!;
    const once = pngWithCard(PIXEL, card);
    const twice = pngWithCard(once, card);
    const chunks = pngTextChunks(twice);
    expect(Object.keys(chunks).sort()).toEqual(['ccv3', 'chara']);
    const read = cardFromPng(twice);
    expect(read.ok && (read.card as { spec: string }).spec).toBe('chara_card_v3');
    const v2 = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(chunks.chara!), (char) => char.charCodeAt(0))));
    expect(v2.spec).toBe('chara_card_v2');
    // Every chunk's CRC checks out, as strict readers demand.
    const view = new DataView(twice.buffer);
    let at = 8;
    const table = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
    while (at < twice.length) {
      const length = view.getUint32(at);
      let c = 0xffffffff;
      for (const byte of twice.subarray(at + 4, at + 8 + length)) c = table[(c ^ byte) & 0xff]! ^ (c >>> 8);
      expect((c ^ 0xffffffff) >>> 0).toBe(view.getUint32(at + 8 + length));
      at += 12 + length;
    }
  });

  it('comes back whole when brought back unchanged, and as a card when changed elsewhere', () => {
    const card = JSON.parse(JSON.stringify(cardFromRecord(world(), 'ada', NOW)));
    const back = importCardJson(newWorld('x', 'Elsewhere', 1), card, ids(), NOW);
    if (!back.ok) throw new Error('import');
    const ada = recordById(back.result.world, back.result.recordId)!;
    expect(back.result.notes).toContain('It came back whole, as it left Inkwyrm.');
    expect(ada.sections.map((section) => section.title)).toEqual(['Look', 'The flood', 'What she admits', 'Notes', "Character's note (from the card)"]);
    expect(ada.sections[2]!.when).toBe('bond-close');
    expect(back.result.world.conditions.map((condition) => condition.id)).toContain('bond-close');
    expect(ada.cardExtensions).toEqual({ talkativeness: '0.5' });
    expect(parseWorld(JSON.parse(JSON.stringify(back.result.world))).ok).toBe(true);
    card.data.description = 'Changed in SillyTavern.';
    const changed = importCardJson(newWorld('x', 'Elsewhere', 1), card, ids(), NOW);
    expect(changed.ok && changed.result.notes).not.toContain('It came back whole, as it left Inkwyrm.');
  });
});

describe('CHARX in', () => {
  it('reads the card and gives its icon and emotion pictures to the portrait slots', () => {
    const card = { spec: 'chara_card_v3', spec_version: '3.0', data: {
      name: 'Mara', description: 'A ferry pilot.', personality: '', scenario: '', first_mes: 'Hi.', mes_example: '', group_only_greetings: [], extensions: {},
      assets: [
        { type: 'icon', uri: 'embeded://assets/icon/images/main.png', name: 'main', ext: 'png' },
        { type: 'emotion', uri: 'embeded://assets/emotion/images/happy.png', name: 'Happy', ext: 'png' },
      ],
    } };
    const zip = zipSync({
      'card.json': new TextEncoder().encode(JSON.stringify(card)),
      'assets/icon/images/main.png': PIXEL,
      'assets/emotion/images/happy.png': PIXEL,
    });
    const read = importCardFile(newWorld('w', 'W', 1), zip, ids(), NOW);
    if (!read.ok) throw new Error(read.errors.join(' '));
    expect(recordById(read.result.world, read.result.recordId)!.name).toBe('Mara');
    expect(read.result.images?.avatar.startsWith('data:image/png;base64,')).toBe(true);
    expect(Object.keys(read.result.images?.emotions ?? {})).toEqual(['happy']);
    expect(importCardFile(newWorld('w', 'W', 1), zipSync({ 'other.txt': new Uint8Array([1]) }), ids(), NOW)).toMatchObject({ ok: false, errors: ['This CHARX file has no card.json.'] });
  });
});
