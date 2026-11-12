// Errata's talk on one record, as the Studio holds it (phase W2): rounds and picks, the talk,
// Settled, and writing fields from them. Saved in this browser after every change.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { StoryRecord, World } from '../../../core/records/index.js';
import { newId } from '../../../kit/src/util';
import type { Author } from './context';
import { buildFieldWrite } from './prompts';
import { DEFAULT_QUESTIONS, nextQuestions, roundSize } from './questions';
import { generateOnce, runChecked } from './run';
import { currentText, type Target } from './shapes';
import { getTalk, putTalk } from './store';
import { buildRound, buildTalkTurn, emptyTalk, readRound, readTalk, recentTalk, settledFrom, talkId, type Round, type Talk } from './talk';
import type { DraftsApi } from './useDrafts';

export interface TalkApi {
  talk: Talk;
  busy: string | null;
  error: string;
  stop: () => void;
  askRound: () => Promise<void>;
  otherAnswers: (round: Round) => Promise<void>;
  pick: (round: Round, item: number, answer: number) => void;
  own: (round: Round, item: number, text: string) => void;
  takeRound: (round: Round) => void;
  skipRound: (round: Round) => void;
  send: (words: string) => Promise<void>;
  takeOffer: (turnId: string, offer: string) => void;
  editTurn: (turnId: string, text: string) => void;
  removeTurn: (turnId: string) => void;
  addSettled: (text: string) => void;
  editSettled: (id: string, text: string) => void;
  removeSettled: (id: string) => void;
  // The fields a Write can fill, empty ones first.
  targets: () => { target: Target; label: string; empty: boolean }[];
  write: (target: Target) => Promise<void>;
  // What Write all empty would cost: how many calls, and about how many tokens in all.
  allEmptyCost: () => { calls: number; tokens: number };
  writeAllEmpty: () => Promise<void>;
}

export function writeTargets(record: StoryRecord): { target: Target; label: string; empty: boolean }[] {
  const list = [
    { target: { field: 'line' } as Target, label: 'Line', empty: !record.line.trim() },
    ...record.sections.map((section) => ({ target: { field: 'section', sectionId: section.id } as Target, label: section.title || 'Untitled section', empty: !section.text.trim() })),
  ];
  return [...list.filter((entry) => entry.empty), ...list.filter((entry) => !entry.empty)];
}

export function useTalk(world: World, record: StoryRecord | undefined, author: Author | null, drafts: DraftsApi): TalkApi {
  const recordId = record?.id ?? '';
  const [talk, setTalk] = useState<Talk>(() => emptyTalk(world.id, recordId));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const live = useRef({ world, record, talk });
  live.current = { world, record, talk };

  useEffect(() => {
    let current = true;
    setTalk(emptyTalk(world.id, recordId));
    setError('');
    if (!recordId) return undefined;
    void getTalk(world.id, recordId).then((found) => {
      if (current && found) setTalk((now) => (now.updatedAt > found.updatedAt ? now : { ...emptyTalk(world.id, recordId), ...found }));
    }).catch(() => undefined);
    return () => { current = false; };
  }, [world.id, recordId]);

  // Every change is saved at once; a talk is small.
  const change = useCallback((update: (talk: Talk) => Talk) => {
    setTalk((now) => {
      const next = { ...update(now), id: talkId(now.worldId, now.recordId), updatedAt: Date.now() };
      void putTalk(next).catch(() => undefined);
      return next;
    });
  }, []);

  const begin = (what: string) => {
    controller.current = new AbortController();
    setBusy(what);
    setError('');
    return controller.current.signal;
  };
  const fail = (failure: unknown) => setError((failure as Error).name === 'AbortError' ? 'Stopped.' : (failure as Error).message || 'The model did not answer.');
  const settings = () => ({ world: live.current.world, record: live.current.record!, talk: live.current.talk, window: author!.window, plain: author!.plain });

  const askRound = useCallback(async () => {
    const now = live.current;
    if (!author || !now.record) return;
    const questions = nextQuestions(now.record, now.talk.asked, roundSize(author.window), DEFAULT_QUESTIONS[now.record.kind]);
    if (!questions.length) { setError('Every question that\'s switched on has been asked. Talk instead, or Write.'); return; }
    const built = buildRound(settings(), questions);
    if (!built.ok) { setError(built.reason); return; }
    const signal = begin('Thinking of answers…');
    try {
      const result = await runChecked(built.built, (raw) => { const read = readRound(raw, questions.length); return { value: read, fault: read.fault }; }, author.generate, signal);
      const round: Round = {
        id: newId(), at: Date.now(), lead: result.value.lead, reading: result.value.reading, done: false,
        items: questions.map((question, index) => ({ questionId: question.id, question: question.text, answers: result.value.answers[index] ?? [], picked: [], own: '' })),
      };
      change((talk) => ({ ...talk, rounds: [...talk.rounds, round] }));
    } catch (failure) { fail(failure); } finally { setBusy(null); }
  }, [author, change]);

  const otherAnswers = useCallback(async (round: Round) => {
    const now = live.current;
    if (!author || !now.record) return;
    const questions = round.items.map((item) => ({ id: item.questionId, text: item.question, feeds: '', on: true }));
    const passed = Object.fromEntries(round.items.map((item) => [item.questionId, item.answers.map((answer) => answer.text)]));
    const built = buildRound(settings(), questions, passed);
    if (!built.ok) { setError(built.reason); return; }
    const signal = begin('Thinking of other answers…');
    try {
      const result = await runChecked(built.built, (raw) => { const read = readRound(raw, questions.length); return { value: read, fault: read.fault }; }, author.generate, signal);
      change((talk) => ({ ...talk, rounds: talk.rounds.map((entry) => (entry.id === round.id ? { ...entry, lead: result.value.lead || entry.lead, items: entry.items.map((item, index) => ({ ...item, answers: result.value.answers[index]?.length ? result.value.answers[index] : item.answers, picked: [] })) } : entry)) }));
    } catch (failure) { fail(failure); } finally { setBusy(null); }
  }, [author, change]);

  const edit = (round: Round, item: number, update: (entry: Round['items'][number]) => Round['items'][number]) =>
    change((talk) => ({ ...talk, rounds: talk.rounds.map((entry) => (entry.id === round.id ? { ...entry, items: entry.items.map((existing, index) => (index === item ? update(existing) : existing)) } : entry)) }));

  const pick = useCallback((round: Round, item: number, answer: number) => edit(round, item, (entry) => ({ ...entry, picked: entry.picked.includes(answer) ? entry.picked.filter((index) => index !== answer) : [...entry.picked, answer] })), [change]);
  const own = useCallback((round: Round, item: number, text: string) => edit(round, item, (entry) => ({ ...entry, own: text })), [change]);

  // Picks and the author's own words become Settled, written by the Studio.
  const takeRound = useCallback((round: Round) => change((talk) => {
    const lines = round.items.flatMap((item) => [
      ...item.picked.map((index) => item.answers[index]).filter(Boolean).map((answer) => settledFrom(item.question, answer)),
      ...(item.own.trim() ? [`${item.question.replace(/\?$/, '')}: ${item.own.trim()}`] : []),
    ]);
    return {
      ...talk,
      settled: [...talk.settled, ...lines.map((text) => ({ id: newId(), text }))],
      asked: [...new Set([...talk.asked, ...round.items.map((item) => item.questionId)])],
      rounds: talk.rounds.map((entry) => (entry.id === round.id ? { ...entry, done: true } : entry)),
    };
  }), [change]);

  const skipRound = useCallback((round: Round) => change((talk) => ({
    ...talk,
    asked: [...new Set([...talk.asked, ...round.items.map((item) => item.questionId)])],
    rounds: talk.rounds.filter((entry) => entry.id !== round.id),
  })), [change]);

  const send = useCallback(async (words: string) => {
    const now = live.current;
    if (!author || !now.record || !words.trim()) return;
    const built = buildTalkTurn(settings(), words.trim());
    if (!built.ok) { setError(built.reason); return; }
    const mine = { id: newId(), from: 'author' as const, text: words.trim(), at: Date.now() };
    change((talk) => ({ ...talk, turns: [...talk.turns, mine] }));
    const signal = begin('Errata is reading…');
    try {
      const reply = await generateOnce(built.built, author.generate, signal);
      const read = readTalk(reply.text);
      if (!read.text && !read.offers.length) throw new Error('The model sent back nothing. Try again.');
      change((talk) => ({ ...talk, turns: [...talk.turns, { id: newId(), from: 'errata', text: read.text, at: Date.now(), offers: read.offers }] }));
    } catch (failure) { fail(failure); } finally { setBusy(null); }
  }, [author, change]);

  const takeOffer = useCallback((turnId: string, offer: string) => change((talk) => ({
    ...talk,
    settled: [...talk.settled, { id: newId(), text: offer }],
    turns: talk.turns.map((turn) => (turn.id === turnId ? { ...turn, offers: (turn.offers ?? []).filter((entry) => entry !== offer) } : turn)),
  })), [change]);

  const editTurn = useCallback((turnId: string, text: string) => change((talk) => ({ ...talk, turns: talk.turns.map((turn) => (turn.id === turnId ? { ...turn, text } : turn)) })), [change]);
  const removeTurn = useCallback((turnId: string) => change((talk) => ({ ...talk, turns: talk.turns.filter((turn) => turn.id !== turnId) })), [change]);
  const addSettled = useCallback((text: string) => { if (text.trim()) change((talk) => ({ ...talk, settled: [...talk.settled, { id: newId(), text: text.trim() }] })); }, [change]);
  const editSettled = useCallback((id: string, text: string) => change((talk) => ({ ...talk, settled: talk.settled.map((line) => (line.id === id ? { ...line, text } : line)) })), [change]);
  const removeSettled = useCallback((id: string) => change((talk) => ({ ...talk, settled: talk.settled.filter((line) => line.id !== id) })), [change]);

  const extra = () => ({ settled: live.current.talk.settled.map((line) => line.text), talk: recentTalk(live.current.talk, 2000) });
  const write = useCallback(async (target: Target) => { await drafts.write(target, extra()); }, [drafts]);
  const targets = useCallback(() => (live.current.record ? writeTargets(live.current.record) : []), []);

  const allEmpty = () => (live.current.record ? writeTargets(live.current.record).filter((entry) => entry.empty) : []);
  const allEmptyCost = useCallback(() => {
    const now = live.current;
    if (!author || !now.record) return { calls: 0, tokens: 0 };
    const list = allEmpty();
    const tokens = list.reduce((sum, entry) => {
      const built = buildFieldWrite({ world: now.world, record: now.record!, target: entry.target, window: author.window, prefill: author.prefill, ...extra() });
      return sum + (built.ok ? built.built.tokens : 0);
    }, 0);
    return { calls: list.length, tokens };
  }, [author]);

  // One at a time, each from the record as the last one left it. A field filled meanwhile is skipped.
  const writeAllEmpty = useCallback(async () => {
    const list = allEmpty();
    for (const [index, entry] of list.entries()) {
      const now = live.current.record;
      if (!now || (currentText(now, entry.target) ?? '').trim()) continue;
      setBusy(`Writing ${entry.label}, ${index + 1} of ${list.length}…`);
      await drafts.write(entry.target, extra());
    }
    setBusy(null);
  }, [drafts]);

  const stop = useCallback(() => controller.current?.abort(), []);

  return { talk, busy, error, stop, askRound, otherAnswers, pick, own, takeRound, skipRound, send, takeOffer, editTurn, removeTurn, addSettled, editSettled, removeSettled, targets, write, allEmptyCost, writeAllEmpty };
}
