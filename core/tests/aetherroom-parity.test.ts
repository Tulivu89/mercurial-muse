// The AetherRoom profile against CharacterRoom's own kernel. The fixtures are CharacterRoom's
// parity set (tests/cr-parity-harness.js, engine 1.0.20, commit 39f4153): each step's input
// and what CharacterRoom's kernel returned for it, recorded in UTC. CharacterRoom tests that
// kernel byte for byte against AnotherRoom 1.1.5, so matching it here matches AnotherRoom.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { brainEntries, contextBuilt, recentEmotionsFromSections, rollDefault, type KernelContext, type KernelDeps, type KernelMessage, type KernelPlan } from '../chat/aetherroom.js';

interface Step { hook: 'built' | 'before' | 'genEnd'; model: string; messages?: KernelMessage[]; storyText?: string; now?: number; seed?: number; dryRun?: boolean; sections?: { section: { text: string } }[] }
interface Fixture {
  name: string; now: number; systemPrompt: string; maxTokens: number; rolloverTokens: number;
  storage: Record<string, any>; storyStorage: Record<string, any>; steps: Step[]; out: unknown[];
}

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/aetherroom-parity.json', import.meta.url), 'utf8')) as Fixture[];
const clone = <T>(value: T): T => (value === undefined ? value : JSON.parse(JSON.stringify(value)));

// The harness's seeded generator and token count, unchanged.
function makeRng(seed: number) {
  let a = (seed >>> 0) || 1;
  const calls: unknown[] = [];
  const next = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return { calls, int(min: number, max: number) { const value = min + Math.floor(next() * (max - min + 1)); calls.push([min, max, value]); return value; } };
}
const fakeEncode = (text: string) => new Array<number>(text ? Math.max(1, Math.ceil(String(text).length / 4)) : 0).fill(0);

async function run(fx: Fixture) {
  const S = clone(fx.storage) || {};
  const SS = clone(fx.storyStorage) || {};
  const chat = SS.chatSettingsKey || { intimacy: 'stranger', style: 'chat', responseLength: 'unspecified' };
  const plansRec: Record<string, KernelPlan[]> = SS.actionPlansRecordKey || {};
  const lastRec: Record<string, number> = SS.trackRealTimeRecordKey || {};
  const roll = rollDefault();
  const out: unknown[] = [];
  for (const st of fx.steps) {
    const now = st.now != null ? st.now : fx.now;
    const rng = makeRng(st.seed || 1);
    const saves: unknown[] = [];
    const cid = chat.char && chat.user ? chat.char.id + chat.user.id : '';
    const ctx: KernelContext = {
      char: chat.char, user: chat.user, scenario: chat.scenario,
      chat: { tags: chat.tags, intimacy: chat.intimacy, style: chat.style, responseLength: chat.responseLength },
      includeGameStats: S.includeGameStatsKey, gameRecord: S.gameRecordKey || { RPS: {}, NumberGuess: {} },
      floaty: SS.floatyBrainsKey || [],
      jots: (SS.rememberMeKey || {})[cid],
      diary: (SS.diaryBrainsRecordKey || {})[cid],
      process: (SS.emotionalMemoryRecordKey || {})[cid],
      plans: plansRec[cid],
      trackRealTime: SS.trackRealTimeKey,
      lastContactMs: lastRec[cid],
      useEmotionalModes: S.useEmotionalModesKey,
      nowMs: now,
    };
    const deps: KernelDeps = {
      rngInt: (a, b) => rng.int(a, b),
      encode: (text) => fakeEncode(text),
      maxTokens: () => fx.maxTokens,
      rolloverTokens: () => fx.rolloverTokens,
      naiSystemPrompt: () => fx.systemPrompt,
      recentEmotions: (n) => recentEmotionsFromSections(clone(st.sections || []), n),
      log: () => {},
    };
    let ret: unknown = null;
    let err: string | null = null;
    try {
      if (st.hook === 'before') {
        ret = brainEntries(st.model, st.storyText || '', ctx);
      } else if (st.hook === 'built') {
        if (ctx.char && ctx.user) {
          const result = await contextBuilt(clone(st.messages!), st.model, !!st.dryRun, ctx, deps, roll);
          if (cid && result.plans !== plansRec[cid] && result.plans !== undefined) plansRec[cid] = result.plans;
          if (result.planSave) saves.push(['story', 'actionPlansRecordKey', clone(plansRec)]);
          ret = result.messages ? { messages: result.messages } : null;
        }
      } else if (st.hook === 'genEnd') {
        if (st.model === 'xialong-v1' && chat.char && chat.user && SS.trackRealTimeKey === true) {
          lastRec[cid] = now;
          saves.push(['story', 'trackRealTimeRecordKey', clone(lastRec)]);
        }
        if (roll.checkInitialTrim === true) roll.checkInitialTrim = false;
      }
    } catch (error) { err = String((error as Error)?.message || error); }
    out.push(clone({
      ret, err, rng: rng.calls, saves, plans: plansRec,
      roll: { startIndex: roll.startIndex, pathIdList: roll.pathIdList, checkInitialTrim: roll.checkInitialTrim, trimmed: roll.trimmed },
      lastContact: lastRec,
    }));
  }
  return out;
}

describe('the AetherRoom profile matches CharacterRoom\'s kernel byte for byte', () => {
  it('has the whole fixture set', () => {
    expect(fixtures.length).toBe(21);
    expect(fixtures.reduce((count, fx) => count + fx.steps.length, 0)).toBe(52);
  });
  for (const fx of fixtures) {
    it(fx.name, async () => {
      const got = await run(fx);
      for (let index = 0; index < fx.steps.length; index++) expect(got[index], `${fx.name} step ${index} (${fx.steps[index]!.hook})`).toEqual(fx.out[index]);
      expect(JSON.stringify(got)).toBe(JSON.stringify(fx.out));
    });
  }
});
