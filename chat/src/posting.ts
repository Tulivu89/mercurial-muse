// Posts, from the press to the page: what a post would be told, the request for it, and what is
// kept when it comes back. Home's feed and a chat's character sheet both go through this, so a
// post is written the same way wherever it is asked for. Every generation here is started by
// the player and is one request: a post, one comment, or what a photo would show.
import {
  POST_FORMAT, XIALONG, buildComment, buildPhotoAsk, buildSide, homeOf, lastContactMs, lifeKey, lifeNow, newChat, overflow, pickCommenter, postTask, profileFor,
  readComment, readPhotoLine, readPost, residentsOf, timeFrame, timeFrameLines,
  type Built, type Chat, type Life, type Post, type PostKind,
} from '../../core/chat/index.js';
import type { StoryRecord, World } from '../../core/records/index.js';
import { canPrefill, generate, type Connection, type GenerateOptions } from '../../kit/src/connection';
import { newId } from '../../kit/src/util';
import { contextTokensFor, type Settings } from './settings';

export interface PostReady { kind: PostKind; world: World; record: StoryRecord; chat: Chat; chatId: string | null; built: Built; maxTokens: number }

export interface PostApi {
  posts: Post[];
  model: string;
  // What a post of this kind would be told about the time, shown before anything is sent.
  frame: (world: World, record: StoryRecord, kind: PostKind, chat?: Chat) => string[];
  preview: (world: World, record: StoryRecord, kind: PostKind, chat?: Chat) => Promise<PostReady | string>;
  write: (ready: PostReady, onText: (text: string) => void) => Promise<Post | string>;
  // One comment under a post. Resolves to '' when one was added, or to what went wrong.
  comment: (postId: string) => Promise<string>;
  say: (postId: string, text: string) => void;
  // Asks the character what they would attach, and keeps the answer on the post.
  describePhoto: (postId: string) => Promise<string>;
  save: (post: Post) => void;
  remove: (post: Post) => void;
}

export interface PostingDeps {
  worlds: World[];
  chats: Chat[];
  // The posts as they stand this instant: a run of comments reads the one before it.
  latest: () => Post[];
  connection: Connection;
  settings: Settings;
  lifeOf: (worldId: string, record: StoryRecord) => Life;
  // The world a chat plays in, with a persona or scenario borrowed from another world.
  worldFor: (chat: Chat) => World | null;
  savePost: (post: Post) => void;
  removePost: (post: Post) => void;
  generateImpl?: typeof generate;
}

const rng = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const failed = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

export function postingFor(deps: PostingDeps): PostApi {
  const { worlds, chats, connection, settings } = deps;
  const send = deps.generateImpl ?? generate;
  const profile = profileFor(connection.model);
  const target = profile === 'aetherroom' ? { ...connection, mode: 'chat' as const } : connection;
  const prefills = profile === 'general' && canPrefill(connection);
  const samplers = (maxTokens: number, temperature: number): GenerateOptions => (profile === 'aetherroom'
    ? { maxTokens, temperature, top_p: XIALONG.top_p, top_k: XIALONG.top_k, min_p: XIALONG.min_p }
    : { maxTokens, temperature: settings.temperature });
  const blocked = () => (!connection.connected || !connection.model ? 'Connect a model first, under Settings.' : '');

  const latestChat = (world: World, record: StoryRecord) => chats.find((chat) => chat.worldId === world.id && chat.characterId === record.id);
  // The chat a post is written from: the one given, else their latest, else an empty one in
  // their own home, as whoever the player usually is. It reads the character's own clock.
  const chatFor = (world: World, record: StoryRecord, given?: Chat): { chat: Chat; real: boolean } => {
    const life = deps.lifeOf(world.id, record);
    const found = given ?? latestChat(world, record);
    const [personaWorld, personaId] = settings.persona.includes(':') ? [settings.persona.slice(0, settings.persona.indexOf(':')), settings.persona.slice(settings.persona.indexOf(':') + 1)] : ['', ''];
    const persona = worlds.find((entry) => entry.id === personaWorld)?.records.find((entry) => entry.id === personaId && entry.kind === 'persona');
    const base = found ?? newChat({
      id: `post-${record.id}`, worldId: world.id, characterId: record.id, characterName: record.name, personaId: persona?.id ?? null, scenarioId: homeOf(world, record)?.scenario.id ?? null,
      userName: persona?.name ?? (settings.userName || 'User'), relationship: life.relationship, style: 'roleplay', responseLength: 'unspecified', greeting: null,
    }, newId, Date.now());
    return { chat: { ...base, clock: life.clock, relationship: life.relationship, pins: life.pins }, real: !!found };
  };
  const moment = (world: World, record: StoryRecord, kind: PostKind, given?: Chat) => {
    const life = deps.lifeOf(world.id, record);
    const { chat } = chatFor(world, record, given);
    const nowMs = lifeNow(life, Date.now());
    const key = lifeKey(world.id, record.id);
    const lastPostMs = deps.latest().filter((post) => post.key === key && post.at <= nowMs).reduce((best, post) => Math.max(best, post.at), 0);
    const view = deps.worldFor(chat);
    const persona = view?.records.find((entry) => entry.id === chat.personaId);
    return { kind, nowMs, relationship: life.relationship, userName: persona?.name ?? chat.userName, lastSpokeMs: lastContactMs(chat) ?? 0, lastPostMs };
  };
  const stamp = (post: Post) => {
    const record = worlds.find((world) => world.id === post.worldId)?.records.find((entry) => entry.id === post.characterId);
    return record ? lifeNow(deps.lifeOf(post.worldId, record), Date.now()) : Date.now();
  };
  const find = (postId: string) => deps.latest().find((post) => post.id === postId);

  return {
    posts: deps.latest(),
    model: connection.model,
    frame: (world, record, kind, given) => timeFrameLines(record, moment(world, record, kind, given)),

    preview: async (world, record, kind, given) => {
      const stop = blocked();
      if (stop) return stop;
      const { chat, real } = chatFor(world, record, given);
      if (kind === 'chat' && !chat.messages.some((message) => message.from === 'user')) return `There is no chat with ${record.name} to post about yet. Say something to them first.`;
      const view = deps.worldFor(chat);
      if (!view) return `${record.name} is no longer in your worlds.`;
      const task = postTask(kind, record.name, timeFrame(record, moment(world, record, kind, given)));
      const built = await buildSide(task, chat, view, {
        model: connection.model, canPrefill: prefills, contextTokens: contextTokensFor(settings, connection), replyTokens: settings.replyTokens,
        nowMs: Date.now(), upTo: chat.messages.length, continuing: false, dryRun: true, firstBuild: false, rngInt: rng,
      });
      if (!built) return `${record.name} is no longer in your worlds.`;
      // Models that think before they write need room for it on top of CharacterRoom's budget.
      return { kind, world, record, chat, chatId: real ? chat.id : null, built, maxTokens: profile === 'aetherroom' ? task.maxTokens : Math.max(task.maxTokens * 2, 600) };
    },

    write: async (ready, onText) => {
      let text = '';
      try {
        const result = await send(ready.built.messages, target, { ...samplers(ready.maxTokens, XIALONG.temperature), ...(ready.built.prefill ? { prefill: ready.built.prefill } : {}), onDelta: (piece) => { text += piece; onText(text); } });
        text = result.text;
      } catch (error) {
        return failed(error, 'The post could not be written.');
      }
      const draft = readPost(text, ready.built.lead, ready.record.name);
      if (!draft) return 'It came back empty. Try again.';
      const life = deps.lifeOf(ready.world.id, ready.record);
      const post: Post = {
        format: POST_FORMAT, id: newId(), key: lifeKey(ready.world.id, ready.record.id), worldId: ready.world.id, characterId: ready.record.id,
        kind: ready.kind, chatId: ready.chatId, ...draft, at: lifeNow(life, Date.now()), madeAt: Date.now(), photo: '', kept: false, comments: [],
      };
      deps.savePost(post);
      for (const old of overflow([post, ...deps.latest()], post.key)) deps.removePost(old);
      return post;
    },

    comment: async (postId) => {
      const stop = blocked();
      if (stop) return stop;
      const post = find(postId);
      const world = worlds.find((entry) => entry.id === post?.worldId);
      const author = world?.records.find((entry) => entry.id === post?.characterId);
      if (!post || !world || !author) return 'That post is gone.';
      // Whoever shares their house, else the others people chat with in their world.
      const home = homeOf(world, author);
      const others = (home ? residentsOf(home) : world.records.filter((entry) => entry.kind === 'character' && entry.chatListed)).filter((entry) => entry.id !== author.id);
      const who = pickCommenter(post, author, others, rng);
      const request = buildComment(post, author, who, profile, prefills, Date.now());
      let text = '';
      try {
        text = (await send(request.messages, target, { ...samplers(request.maxTokens, request.temperature), ...(request.prefill ? { prefill: request.prefill } : {}) })).text;
      } catch (error) {
        return failed(error, 'The comment could not be written.');
      }
      const read = readComment(text, who.record?.name ?? '');
      if (!read) return 'The comment came back empty. Try again.';
      const now = find(postId);
      if (!now) return 'That post is gone.';
      deps.savePost({ ...now, comments: [...now.comments, { id: newId(), ...read, characterId: who.record?.id ?? null, mine: false, at: stamp(now) }].slice(-200) });
      return '';
    },

    say: (postId, text) => {
      const post = find(postId);
      const clean = text.trim().slice(0, 4000);
      if (!post || !clean) return;
      const world = worlds.find((entry) => entry.id === post.worldId);
      const author = world?.records.find((entry) => entry.id === post.characterId);
      const known = world && author ? moment(world, author, post.kind).userName : settings.userName;
      // With no name set anywhere, a comment is signed You, never the placeholder.
      const name = !known || known === 'User' ? 'You' : known;
      deps.savePost({ ...post, comments: [...post.comments, { id: newId(), name, characterId: null, mine: true, content: clean, emotion: 'neutral' as const, at: stamp(post) }].slice(-200) });
    },

    describePhoto: async (postId) => {
      const stop = blocked();
      if (stop) return stop;
      const post = find(postId);
      const author = worlds.find((entry) => entry.id === post?.worldId)?.records.find((entry) => entry.id === post?.characterId);
      if (!post || !author) return 'That post is gone.';
      const request = buildPhotoAsk(post, author.name, profile, prefills);
      let text = '';
      try {
        text = (await send(request.messages, target, { ...samplers(request.maxTokens, request.temperature), ...(request.prefill ? { prefill: request.prefill } : {}) })).text;
      } catch (error) {
        return failed(error, 'It could not be asked.');
      }
      const line = readPhotoLine(text);
      if (!line) return `${author.name} did not say what they would share. Try again.`;
      const now = find(postId);
      if (now) deps.savePost({ ...now, photo: line });
      return '';
    },

    save: deps.savePost,
    remove: deps.removePost,
  };
}
