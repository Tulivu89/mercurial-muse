import { describe, expect, it } from 'vitest';
import {
  act, contextPlan, followThread, followedThread, loadModule, markMilestone, parseSave, read, say, startSave, stateDefFor, threadsOf, undoLastTurn,
  type PraxisModule, type Save,
} from '../src/engine';
import raw from '../modules/abernys-bogwater.json';

function load(change?: (raw: Record<string, any>) => void): ReturnType<typeof loadModule> {
  const copy = structuredClone(raw) as Record<string, any>;
  change?.(copy);
  return loadModule(copy);
}
const loaded = load();
if (!loaded.ok) throw new Error(loaded.errors.join('\n'));
const module: PraxisModule = loaded.module;

function must<T extends { ok: boolean }>(result: T): Extract<T, { ok: true }> {
  if (!result.ok) throw new Error((result as unknown as { reason: string }).reason);
  return result as Extract<T, { ok: true }>;
}

const DAY1 = 243;
const minuteOf = (day: number, hour: number) => (DAY1 + day - 1) * 1440 + hour * 60;
const waitUntil = (save: Save, day: number, hour: number) => must(act(module, save, `w${day}-${hour}`, { type: 'wait', minutes: minuteOf(day, hour) - save.clock })).save;
const xp = (save: Save) => read(save.values, stateDefFor(module, 'experience', 'the-runaway')!, 'the-runaway');
const lore = (save: Save) => contextPlan(module, must(say(module, save, 'look', 'I look around.')).save).messages[1]!.content;
const statusOf = (save: Save, threadId: string) => threadsOf(module, save).find((view) => view.thread.id === threadId)!.milestones.map((entry) => entry.status);

describe('threads', () => {
  it('start with the first thread followed and its first milestone as the next beat', () => {
    const save = startSave(module);
    const views = threadsOf(module, save);
    expect(views.map((view) => view.thread.id)).toEqual(['the-ink', 'the-spark', 'tamecap', 'the-barrels', 'the-bend-fence']);
    expect(views.filter((view) => view.followed).map((view) => view.thread.id)).toEqual(['the-ink']);
    expect(followedThread(module, save)?.beat.id).toBe('still-free');
    expect(save.thread).toBeNull();
  });

  it('give the narrator the next beat of the thread followed, and nothing of the rest', () => {
    const text = lore(startSave(module));
    expect(text).toContain("[ What you are after, The ink: Stay in the fen and out of the patrol's hands until it leaves to fetch Orlo. ]");
    expect(text).not.toContain('experience');
    expect(text).not.toContain('Tamecap');
    expect(text).not.toContain(module.threads[0]!.opposition);
  });

  it('reach a milestone when its day comes, pay its experience by the rules, and move the beat on', () => {
    const save = waitUntil(startSave(module), 4, 7);
    expect(statusOf(save, 'the-ink')).toEqual(['reached', 'open', 'open']);
    expect(xp(save)).toBe(5);
    expect(save.ledger).toContainEqual(expect.objectContaining({ kind: 'state', defId: 'experience', owner: 'the-runaway', from: 0, to: 5, source: 'rule' }));
    expect(followedThread(module, save)?.beat.id).toBe('the-standoff');
    // Nothing pays twice.
    expect(xp(waitUntil(save, 4, 12))).toBe(5);
  });

  it('take a milestone back with the turn that reached it', () => {
    const waited = waitUntil(startSave(module), 4, 7);
    const undone = must(undoLastTurn(waited)).save;
    expect(statusOf(undone, 'the-ink')[0]).toBe('open');
    expect(xp(undone)).toBe(0);
  });

  it('miss a milestone once its last day is over, and move on to the next', () => {
    const save = waitUntil(startSave(module), 9, 7);
    expect(statusOf(save, 'tamecap')).toEqual(['missed', 'open']);
    expect(threadsOf(module, save).find((view) => view.thread.id === 'tamecap')!.milestones.find((entry) => entry.next)?.milestone.id).toBe('lowri-settled');
  });

  it('never reach a milestone with no condition by the rules, but let the player mark it', () => {
    const late = waitUntil(startSave(module), 12, 7);
    expect(statusOf(late, 'the-barrels')[1]).toBe('open');
    const before = xp(late);
    const marked = must(markMilestone(module, late, 'the-barrels', 'strongbox')).save;
    expect(statusOf(marked, 'the-barrels')[1]).toBe('reached');
    expect(xp(marked)).toBe(before + 5);
    expect(marked.ledger.at(-1)).toMatchObject({ kind: 'state', defId: 'experience', source: 'player' });
    expect(markMilestone(module, marked, 'the-barrels', 'strongbox')).toEqual({ ok: false, reason: 'That is already reached.' });
  });

  it('follow another thread, and fall back to the next once the one followed is done', () => {
    const save = must(followThread(module, startSave(module), 'tamecap')).save;
    expect(save.thread).toBe('tamecap');
    expect(lore(save)).toContain('[ What you are after, Tamecap: Bring tamecap from the Woed');
    let done = must(markMilestone(module, save, 'tamecap', 'tamecap-delivered')).save;
    done = must(markMilestone(module, done, 'tamecap', 'lowri-settled')).save;
    expect(threadsOf(module, done).find((view) => view.followed)?.thread.id).toBe('the-ink');
    expect(followThread(module, done, 'tamecap')).toEqual({ ok: false, reason: 'Tamecap has nothing left to reach.' });
  });

  it('opens saves from before threads, following the first', () => {
    const { thread: _thread, ...old } = startSave(module);
    const parsed = parseSave(module, JSON.parse(JSON.stringify(old)));
    expect(parsed.ok && parsed.save.thread).toBeNull();
  });

  it('refuse a module whose milestones point at nothing', () => {
    const refused = load((copy) => {
      copy.threads[0].milestones[2].when[0].stateId = 'no-such-state';
      copy.threads[1].milestones[0].targetId = 'nobody';
      copy.threads[2].milestones[0].fromDay = 300;
      copy.threads[3].milestones[1].id = copy.threads[3].milestones[0].id;
    });
    expect(refused.ok).toBe(false);
    if (refused.ok) return;
    expect(refused.errors.join('\n')).toMatch(/threads\.0\.milestones\.2\.when\.0\.stateId/);
    expect(refused.errors.join('\n')).toMatch(/threads\.1\.milestones\.0\.targetId/);
    expect(refused.errors.join('\n')).toMatch(/threads\.2\.milestones\.0\.byDay/);
    expect(refused.errors.join('\n')).toMatch(/Duplicate id "barrels-past"/);
  });
});
