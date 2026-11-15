// The test pack (core/chat/testpack.ts) and the chat lab (src/lab/chatLab.ts), on the dragon's
// resort: a pack survives a file, rebuilds the same request, and the lab's variants change only
// what they say they change.
import { describe, expect, it } from 'vitest';
import { TEST_PACK_FORMAT, XIALONG, buildRequest, makeTestPack, newChat, packOptions, readTestPack, requestText, samplersFor, type Chat, type TestPack } from '../../core/chat/index.js';
import { parseWorld, type World } from '../../core/records/index.js';
import { labReadme, labVariants, originalReplies, scoreReply, turnOf } from '../src/lab/chatLab';
import file from '../../content/dragons-resort/world.json';

const NOW = Date.UTC(2026, 10, 15, 3, 0);

function resort(): World {
  const read = parseWorld(file);
  if (!read.ok) throw new Error(read.errors.join(' '));
  return read.world;
}

// Errata, with no scenario, where someone says "want" and her greeting says "horns": the chat
// the owner played on Nov 15.
function chat(): Chat {
  const world = resort();
  const errata = world.records.find((record) => record.id === 'errata')!;
  let n = 0;
  const start = newChat({ id: 'c1', worldId: world.id, characterId: 'errata', characterName: 'Errata', personaId: null, scenarioId: null, userName: 'Sam', relationship: 'acquaintance', style: 'roleplay', responseLength: 'medium', greeting: errata.greetings[0]! }, () => `m${++n}`, NOW);
  const said = (from: 'user' | 'character', text: string): Chat['messages'][number] => ({ id: `m${++n}`, from, at: NOW, alts: [{ parts: [{ text, emotion: 'neutral' as const }], at: NOW, model: from === 'user' ? '' : 'xialong-v1' }], pick: 0 });
  return { ...start, updatedAt: NOW, messages: [...start.messages, said('user', 'What do you want here?'), said('character', '*She laughs.* Skimming money off fools. Want in?')] };
}

function pack(model = 'xialong-v1'): TestPack {
  return makeTestPack({
    chat: chat(), world: resort(), now: NOW, next: null, last: null,
    settings: { provider: 'novelai', model, mode: 'chat', format: 'auto', profile: 'aetherroom', contextTokens: XIALONG.contextTokens, replyTokens: 1000, samplers: samplersFor(model, 0.8) },
  });
}

describe('the test pack', () => {
  it('survives being saved and read back, and rebuilds the request it would send', async () => {
    const read = readTestPack(JSON.parse(JSON.stringify(pack())));
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.pack.format).toBe(TEST_PACK_FORMAT);
    const built = await buildRequest(read.pack.chat, read.pack.world, packOptions(read.pack, 2));
    const again = await buildRequest(chat(), resort(), packOptions(pack(), 2));
    expect(built!.messages).toEqual(again!.messages);
  });

  it('turns away a file that isn\'t one, and never carries a key', () => {
    expect(readTestPack({ format: 'inkwyrm-chat-export/1' }).ok).toBe(false);
    expect(Object.keys(pack().settings).sort()).toEqual(['contextTokens', 'format', 'mode', 'model', 'profile', 'provider', 'replyTokens', 'samplers']);
  });

  it('writes a request as text with every message in order', async () => {
    const built = (await buildRequest(chat(), resort(), packOptions(pack(), 2)))!;
    const text = requestText({ ...built, model: 'xialong-v1' }, 'What Errata is sent');
    expect(text).toContain('# What Errata is sent');
    expect(text).toContain(`## ${built.messages.length} · ${built.messages.at(-1)!.role}`);
    for (const message of built.messages) expect(text).toContain(message.content.slice(0, 60));
  });
});

describe('the chat lab', () => {
  it('looks at the last reply when the chat ends on one, and keeps what the model wrote', () => {
    expect(turnOf(pack())).toBe(2);
    expect(turnOf(pack(), 2)).toBe(1);
    expect(originalReplies(pack(), 2)).toEqual(['*She laughs.* Skimming money off fools. Want in?']);
  });

  it('builds each variant, changing only what it says', async () => {
    const variants = await labVariants(pack(), 2);
    expect(variants.map((variant) => variant.id)).toEqual(['as-sent', 'general', 'no-examples', 'only-her', 'with-scenario']);
    const text = (id: string) => variants.find((variant) => variant.id === id)!.request.messages.map((message) => message.content).join('\n');
    // "want" brings in the other women's Wants: the leak the owner's chat had.
    expect(text('as-sent')).toContain('Qiulong: Wants');
    expect(text('only-her')).not.toContain('Qiulong: Wants');
    expect(text('only-her')).toContain('Tastes and Strays');
    expect(text('as-sent')).toContain('Example quotes');
    expect(text('no-examples')).not.toContain('Example quotes');
    expect(text('as-sent')).not.toContain('Scene:');
    expect(text('with-scenario')).toContain('Scene: Guests arrive');
    expect(variants.find((variant) => variant.id === 'general')!.request.profile).toBe('general');
  });

  it('writes a README that keeps the original out of sight until the replies are in', async () => {
    const readme = labReadme(pack(), 2, await labVariants(pack(), 2), 3);
    expect(readme).toContain('What do you want here?');
    expect(readme).toContain('Don\'t read it until your replies are written');
    expect(readme).not.toContain('Skimming money');
  });

  it('scores a reply: catches, other people named, quote marks, and copied stretches as one', async () => {
    const [asSent] = await labVariants(pack(), 2);
    const score = scoreReply('reply-1.md', '*She taps the stool.* "Ask Qiulong," she says, as if it were obvious. Plays dirty eight-ball and rushdown fighters just to rattle opponents.', asSent!.request, pack());
    expect(score.named).toEqual(['Qiulong']);
    expect(score.quotes).toBe(2);
    expect(score.catches.length).toBeGreaterThan(0);
    expect(score.lifted).toEqual(['plays dirty eight ball and rushdown fighters just to rattle opponents']);
  });
});
