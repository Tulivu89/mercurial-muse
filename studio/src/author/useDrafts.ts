// A record's drafts as the page holds them: loaded from this browser, written by a call, kept,
// dropped. One call per target at a time, so a second tap never starts a second paid call.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { StoryRecord, World } from '../../../core/records/index.js';
import { newId } from '../../../kit/src/util';
import type { Author } from './context';
import { buildFieldWrite } from './prompts';
import { runFieldWrite } from './run';
import { currentText, shapeFor, targetKey, type Target } from './shapes';
import { deleteDraft, draftsFor, putDraft, type Draft } from './store';

export const MOST_DRAFTS = 3;

export interface Running { key: string; text: string; stop: () => void }

export interface DraftsApi {
  drafts: Draft[];
  running: Map<string, Running>;
  errors: Map<string, string>;
  write: (target: Target, extra?: { settled?: string[]; direction?: string }) => Promise<void>;
  edit: (draft: Draft, text: string) => void;
  drop: (draft: Draft) => void;
}

export function useDrafts(world: World, record: StoryRecord | undefined, author: Author | null): DraftsApi {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [running, setRunning] = useState<Map<string, Running>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());
  const recordRef = useRef(record);
  recordRef.current = record;
  const worldRef = useRef(world);
  worldRef.current = world;
  const saving = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const recordId = record?.id ?? '';
  useEffect(() => {
    let live = true;
    setDrafts([]);
    if (!recordId) return undefined;
    // Stored drafts join any written while they loaded, never replace them.
    void draftsFor(world.id, recordId).then((list) => {
      if (live) setDrafts((now) => [...list.filter((stored) => !now.some((entry) => entry.id === stored.id)), ...now].sort((a, b) => a.at - b.at));
    }).catch(() => undefined);
    return () => { live = false; };
  }, [world.id, recordId]);

  const setIn = <T,>(set: (update: (map: Map<string, T>) => Map<string, T>) => void, key: string, value: T | null) =>
    set((map) => { const next = new Map(map); if (value === null) next.delete(key); else next.set(key, value); return next; });

  const write = useCallback(async (target: Target, extra: { settled?: string[]; direction?: string } = {}) => {
    const now = recordRef.current;
    if (!author || !now) return;
    const key = targetKey(target);
    if (running.has(key)) return;
    const shape = shapeFor(now, target);
    const built = buildFieldWrite({ world: worldRef.current, record: now, target, window: author.window, prefill: author.prefill, ...extra });
    if (!shape || !built.ok) { setIn(setErrors, key, built.ok ? 'That part is gone from the record.' : built.reason); return; }
    const controller = new AbortController();
    setIn(setErrors, key, null);
    setIn<Running>(setRunning, key, { key, text: '', stop: () => controller.abort() });
    try {
      let streamed = '';
      const outcome = await runFieldWrite(built.built, shape, author.generate, controller.signal, (piece) => {
        streamed = piece === '' ? '' : streamed + piece;
        setIn<Running>(setRunning, key, { key, text: streamed, stop: () => controller.abort() });
      });
      const draft: Draft = {
        id: newId(), worldId: worldRef.current.id, recordId: now.id, target,
        base: currentText(now, target) ?? '', text: outcome.text, state: outcome.state,
        ...(outcome.question ? { question: outcome.question } : {}), ...(outcome.fault ? { fault: outcome.fault } : {}),
        calls: outcome.calls, model: outcome.model, at: Date.now(), sent: outcome.sent, parts: built.built.parts, tokens: built.built.tokens,
      };
      setDrafts((list) => {
        // A question replaces an earlier question for the same field; drafts pile up to three.
        const same = list.filter((entry) => targetKey(entry.target) === key);
        const dropped = draft.state === 'needs' ? same.filter((entry) => entry.state === 'needs') : same.slice(0, Math.max(0, same.length - (MOST_DRAFTS - 1)));
        dropped.forEach((entry) => void deleteDraft(entry.id));
        return [...list.filter((entry) => !dropped.includes(entry)), draft];
      });
      await putDraft(draft).catch(() => undefined);
    } catch (error) {
      const message = (error as Error).name === 'AbortError' ? 'Stopped.' : (error as Error).message || 'The model did not answer.';
      setIn(setErrors, key, message);
    } finally {
      setIn<Running>(setRunning, key, null);
    }
  }, [author, running]);

  const edit = useCallback((draft: Draft, text: string) => {
    // An edited draft is the author's: an unfinished one can be kept once it has been touched.
    const next: Draft = { ...draft, text, state: draft.state === 'unfinished' ? 'ready' : draft.state, fault: undefined };
    setDrafts((list) => list.map((entry) => (entry.id === draft.id ? next : entry)));
    const timers = saving.current;
    const pending = timers.get(draft.id);
    if (pending) clearTimeout(pending);
    timers.set(draft.id, setTimeout(() => { timers.delete(draft.id); void putDraft(next).catch(() => undefined); }, 400));
  }, []);

  const drop = useCallback((draft: Draft) => {
    const pending = saving.current.get(draft.id);
    if (pending) { clearTimeout(pending); saving.current.delete(draft.id); }
    setDrafts((list) => list.filter((entry) => entry.id !== draft.id));
    void deleteDraft(draft.id).catch(() => undefined);
  }, []);

  return { drafts, running, errors, write, edit, drop };
}
