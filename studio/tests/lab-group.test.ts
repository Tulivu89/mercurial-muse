// The chat lab on a group chat (docs/model-jobs.md, The lab test): the resort's three together, the
// layouts as variants, and the scores a group adds: lines written for someone else, and bleed.
import { describe, expect, it } from 'vitest';
import { XIALONG, makeTestPack, readTestPack, samplersFor, type TestPack } from '../../core/chat/index.js';
import { parseWorld, type World } from '../../core/records/index.js';
import { labReadme, labVariants, readSuite, scoreReply, scoresText, suitePack } from '../src/lab/chatLab';
import file from '../../content/dragons-resort/world.json';

const NOW = Date.UTC(2026, 10, 21, 3, 0);

function resort(): World {
  const read = parseWorld(file);
  if (!read.ok) throw new Error(read.errors.join(' '));
  return read.world;
}

function groupPack(model = 'glm-4-6'): TestPack {
  const suite = readSuite({
    format: 'inkwyrm-lab-suite/1', name: 'Group', world: 'dragons-resort', date: '2026-11-21', model, replies: 2,
    variants: ['as-sent', 'group-b', 'group-b-user', 'group-c', 'group-c-anchor', 'group-c-user'],
    cases: [{
      id: 'evening', character: 'qiulong', cast: ['qiulong', 'errata', 'echydna'], scenario: 'resort-arrival', relationship: 'acquaintance', at: '19:00', userName: 'Sam',
      before: [{ who: 'user', says: 'Evening, all.' }, { who: 'qiulong', says: 'Sit. The pot is still warm.' }],
      says: 'Echydna, what are we watching?', watch: 'Echydna answers in her own voice and writes nobody else.',
    }],
  });
  if (!suite.ok) throw new Error(suite.errors.join(' '));
  const pack = suitePack(suite.suite, resort(), suite.suite.cases[0]!);
  return makeTestPack({ ...pack, now: NOW, next: null, last: null, settings: { ...pack.settings, model, samplers: samplersFor(model, 0.8), contextTokens: XIALONG.contextTokens } });
}

describe('the lab on a group chat', () => {
  it('builds the turn for whoever answers, under every layout, and survives a file', async () => {
    const pack = groupPack();
    expect(readTestPack(JSON.parse(JSON.stringify(pack))).ok).toBe(true);
    const variants = await labVariants(pack, pack.chat.messages.length);
    expect(variants.map((variant) => variant.id)).toEqual(['as-sent', 'group-b', 'group-b-user', 'group-c', 'group-c-anchor', 'group-c-user']);
    expect(variants.every((variant) => variant.request.speaker === 'echydna')).toBe(true);
    expect(variants[0]!.request.stop).toEqual(['\nQiulong:', '\nErrata:', '\nSam:']);
    const readme = labReadme(pack, pack.chat.messages.length, variants, 2);
    expect(readme).toContain("the turn is Echydna's");
  });

  it('gives Xialong layout B only', async () => {
    const variants = await labVariants(groupPack('xialong-v1'), groupPack('xialong-v1').chat.messages.length);
    expect(variants.map((variant) => variant.id)).toEqual(['as-sent', 'group-b']);
  });

  it('scores a line written for someone else, and runs lifted from another character', async () => {
    const pack = groupPack();
    const [asSent] = await labVariants(pack, pack.chat.messages.length);
    const errata = pack.world.records.find((record) => record.id === 'errata')!;
    const borrowed = errata.examples.flatMap((example) => example.messages.filter((message) => message.fromCharacter && message.text.split(/\s+/).length > 8)).at(0)!.text;
    const score = scoreReply('reply-1.md', `Old films, darling. ${borrowed}\nQiulong: More tea?`, asSent!.request, pack);
    expect(score.wrote).toEqual(['Qiulong']);
    expect(score.liftedOthers.length).toBeGreaterThan(0);
    const clean = scoreReply('reply-2.md', 'Old films, darling. *pats the couch*', asSent!.request, pack);
    expect(clean.wrote).toEqual([]);
    const text = scoresText([{ variant: 'group-b', scores: [score, clean] }]);
    expect(text).toContain('| Wrote for | Lifted from others |');
    expect(text).toContain('- wrote for Qiulong');
  });
});
