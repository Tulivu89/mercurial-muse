// The AetherRoom context: the layout xialong-v1 was trained on, as CharacterRoom's kernel builds
// it (Tulivu89/CharacterRoom, SECTION K, engine 1.0.20). It started as a port. Parity with
// CharacterRoom, a userscript, is no longer a goal (Nov 21): this is the site's own Xialong
// profile now, free to change like any other code, with the chat tests to keep it honest.
//
// Pure: time, randomness, token counts and the model's limits come in as arguments.
import { replaceMacros } from './macros.js';

export interface KernelMessage { role: 'system' | 'user' | 'assistant'; content?: string }

export interface KernelBrain { name: string; content: string }
export interface KernelKeyedBrain { name: string; content: string; keys: string[]; requiredIntimacy: string }
export interface KernelScheduleEvent { id?: string; startTime: number; endTime: number; text: string; requiredIntimacy: string }
export type KernelSchedule = Record<string, KernelScheduleEvent[]>;

export interface KernelExampleChat {
  name?: string;
  userName: string;
  messages: { isContact: boolean; text: string; emotion?: string }[];
}

// A CharacterRoom card as the kernel reads it. Contact, user and scenario cards share the type;
// each uses the fields it has.
export interface KernelCard {
  id: string;
  name: string;
  gender?: string;
  pronouns?: string;
  species?: string;
  persona?: string;
  appearance?: string;
  tags?: string;
  cjk?: boolean;
  exampleChats?: KernelExampleChat[];
  brains?: KernelBrain[];
  brainsConditional?: KernelKeyedBrain[];
  schedule?: KernelSchedule;
  environment?: string;
  scene?: string;
}

export interface KernelPlan {
  name?: string;
  content: string;
  planType?: string;
  durationType?: string;
  remainingTurns: number;
  totalTurns: number;
  running?: boolean;
  startedAtCount: number;
}

export interface KernelFloaty { id?: string; active?: boolean; entry: KernelBrain }
export interface KernelMemory { name: string; content: string; keys: string[] }

export interface KernelContext {
  // Group chat (core/chat/group.ts): the other characters, whose lines come in as named user turns.
  groupNames?: string[];
  char?: KernelCard;
  user?: KernelCard;
  scenario?: KernelCard;
  chat: { tags?: string; intimacy: string; style: string; responseLength: string };
  includeGameStats: boolean;
  gameRecord: Record<string, Record<string, Record<string, unknown>>>;
  floaty: KernelFloaty[];
  jots?: { id?: string; text: string }[];
  diary?: KernelMemory[];
  process?: KernelMemory[];
  plans?: KernelPlan[];
  trackRealTime: boolean;
  lastContactMs?: number;
  useEmotionalModes: boolean;
  nowMs: number;
}

export interface KernelDeps {
  rngInt(min: number, max: number): number;
  encode(text: string, model: string): Promise<number[]> | number[];
  maxTokens(model: string): Promise<number> | number;
  rolloverTokens(model: string): Promise<number> | number;
  // NovelAI's own system prompt, which its editor puts first and the kernel drops. Off NovelAI
  // there is none, and this returns a string no message carries.
  naiSystemPrompt(): Promise<string> | string;
  recentEmotions(count: number): Promise<string[]> | string[];
  log(value: unknown): void;
}

// Where the window starts, kept between replies so the prefix stays the same until a trim.
export interface Roll { startIndex: number; pathIdList: string[]; checkInitialTrim: boolean; trimmed: boolean }

export interface TempLorebookEntry { id?: string; name: string; content: string; active?: boolean; appearWithPermanent?: boolean }

export interface BuiltResult { messages: KernelMessage[] | null; plans: KernelPlan[] | undefined; planSave: boolean }

export const AETHERROOM_MODEL = 'xialong-v1';
export const JOTS_NAME = 'Jots';
export const RESERVED_TOKENS = 2200;

export function rollDefault(): Roll { return { startIndex: 0, pathIdList: [], checkInitialTrim: true, trimmed: false }; }
function rollReset(roll: Roll): void { roll.startIndex = 0; roll.pathIdList = []; }

function lastAssistantIndex(list: KernelMessage[]): number {
  for (let i = list.length - 1; i >= 0; i--) if (list[i]!.role === 'assistant') return i;
  return -1;
}

const hasList = (list: unknown[] | undefined | null): boolean => !!(list && list.length > 0);

export const formatTime = (minutes: number) => `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;

export const EMOTIONAL_MODES = ['Closed', 'Open', 'Investigation', 'Defensive', 'Recharging', 'Boundaries', 'Vulnerable', 'Validating', 'Critical'] as const;

export const EMOTIONAL_MODE_ATTR: Record<string, { triggers: ReadonlySet<string>; prompt: string }> = {
  Closed: { triggers: new Set(['angry', 'disgusted', 'hurt', 'irritated']), prompt: 'They may act more closed off and focused on the task at hand.' },
  Open: { triggers: new Set(['laughing', 'playful', 'smug', 'aroused']), prompt: 'They may act more open-minded and exploratory.' },
  Investigation: { triggers: new Set(['confused', 'surprised', 'determined', 'thinking', 'neutral']), prompt: 'They may act more investigative, questioning, and narrow in.' },
  Defensive: { triggers: new Set(['shy', 'angry', 'hurt', 'disgusted', 'scared', 'nervous']), prompt: 'They may lash out if pressed.' },
  Recharging: { triggers: new Set(['tired', 'angry', 'irritated', 'hurt', 'sad']), prompt: 'They are in need of rest and may look for ways to take it easy.' },
  Boundaries: { triggers: new Set(['angry', 'determined', 'hurt', 'disgusted', 'scared']), prompt: 'They may set boundaries and push back if needed.' },
  Vulnerable: { triggers: new Set(['love', 'sad', 'worried', 'bored', 'nervous']), prompt: 'They may share their internal world more, including things like hopes, dreams, and insecurities.' },
  Validating: { triggers: new Set(['excited', 'happy', 'love', 'determined']), prompt: 'They may look more closely for ways to be supportive and validating to others.' },
  Critical: { triggers: new Set(['angry', 'disgusted', 'embarrassed', 'hurt', 'irritated']), prompt: 'They may scrutinize and magnify flaws and issues, being more critical and pushy.' },
};

const filled = (value: string | undefined): value is string => !!(value && value.trim());

function formatField(name: string, value: string): string {
  const lines = value.trim().split('\n');
  let result = `${name}: ${lines[0]}\n`;
  for (let i = 1; i < lines.length; i++) result += `    ${lines[i]}\n`;
  return result;
}

// The sheet: the contact, the user, the scenario, then every always-on brain.
export function buildSystemPrompt(ctx: KernelContext, includeGameStats: boolean): string {
  const character = ctx.char;
  const user = ctx.user;
  const scenario = ctx.scenario;
  if (!character || !user) return 'AetherRoom';

  let prompt = 'AetherRoom\n----\n';
  prompt += `${character.name}\n`;
  prompt += 'Type: contact\n';
  if (filled(character.gender)) prompt += formatField('Gender', character.gender);
  if (filled(character.pronouns)) prompt += formatField('Pronouns', character.pronouns);
  if (filled(character.species)) prompt += formatField('Species', character.species);
  if (filled(character.persona)) prompt += formatField('Personality', character.persona);
  if (filled(character.appearance)) prompt += formatField('Appearance', character.appearance);

  if (ctx.chat.intimacy === 'stranger') prompt += `Opinion of ${user.name}: Doesn't know ${user.name}.\n`;
  else prompt += `Relationship: ${ctx.chat.intimacy}\n`;

  if (filled(character.tags)) prompt += `Categories: ${character.tags.trim()}\n`;

  const exampleChats = character.exampleChats ?? [];
  if (exampleChats.length > 0) {
    prompt += 'Example quotes:\n';
    for (let ecIdx = 0; ecIdx < exampleChats.length; ecIdx++) {
      const ec = exampleChats[ecIdx]!;
      prompt += `${ecIdx + 1}.\n`;
      for (const msg of ec.messages) {
        const senderName = msg.isContact ? character.name : ec.userName;
        const lines = msg.text.split('\n');
        prompt += ` ${senderName}: ${lines[0]}\n`;
        for (let li = 1; li < lines.length; li++) prompt += `     ${lines[li]}\n`;
        if (msg.isContact && msg.emotion) prompt += `   Emotion: ${msg.emotion}\n`;
      }
    }
  }

  prompt += '----\n';
  prompt += `${user.name}\n`;
  prompt += 'Type: user\n';
  if (filled(user.gender)) prompt += formatField('Gender', user.gender);
  if (filled(user.pronouns)) prompt += formatField('Pronouns', user.pronouns);
  if (filled(user.species)) prompt += formatField('Species', user.species);
  if (filled(user.persona)) prompt += formatField('Personality', user.persona);
  if (filled(user.appearance)) prompt += formatField('Appearance', user.appearance);
  if (filled(user.tags)) prompt += `Categories: ${user.tags.trim()}\n`;

  const hasScenarioContent = filled(scenario?.environment) || filled(scenario?.scene) || filled(ctx.chat.tags);
  if (hasScenarioContent) {
    prompt += '----\n';
    if (filled(scenario?.environment)) prompt += formatField('Environment', scenario!.environment!);
    if (filled(scenario?.scene)) prompt += formatField('Scene', scenario!.scene!);
    const scenarioTagsList: string[] = [];
    if (scenario && scenario.tags) scenarioTagsList.push(...scenario.tags.split(','));
    if (ctx.chat.tags) scenarioTagsList.push(...ctx.chat.tags.split(','));
    if (scenarioTagsList.length > 0) {
      const deDuplicated = [...new Set(scenarioTagsList.map((tag) => tag.trim()))];
      prompt += `Tags: ${deDuplicated.join(', ')}\n`;
    }
  }

  const allBrains: KernelBrain[] = [];
  for (const brain of character.brains ?? []) allBrains.push(brain);
  for (const brain of user.brains ?? []) allBrains.push(brain);
  for (const brain of scenario?.brains ?? []) allBrains.push(brain);
  if (includeGameStats) {
    const statsList: string[] = [];
    const combinedId = character.id + user.id;
    for (const gameType of Object.keys(ctx.gameRecord)) {
      const game = ctx.gameRecord[gameType]?.[combinedId] as Record<string, unknown> | undefined;
      if (!game) continue;
      if (game.kind === 'cooperative') {
        const wins = game.sharedWins as number[];
        statsList.push(`${game.displayLabel}:\nShared wins: ${wins.length.toString()}\nTurns taken to complete: ${wins.join(', ')}`);
      } else {
        // Competitive, and older records with no kind.
        statsList.push(`${game.displayLabel}:\n${character.name}: ${game.charWins} wins, ${game.charLosses} losses\n${user.name}: ${game.userWins} wins, ${game.userLosses} losses\nShared: ${game.ties} ties`);
      }
    }
    if (statsList.length > 0) allBrains.push({ name: 'Game History', content: statsList.join('\n') });
  }
  for (const brain of allBrains) prompt += `----\n${brain.name}\n${brain.content.trim()}\n`;

  return replaceMacros(prompt, character.name, user.name, ctx.nowMs);
}

const normalizeKey = (key: string) => key.trim().split(/\s+/).join(' ');

// The entries that join the context for this turn: floaty brains, Jots, then Diary, Process and
// keyed brains whose keys appear in the last thousand words. Keys are case-sensitive.
export function brainEntries(model: string, storyText: string, ctx: KernelContext): { temporaryLorebookEntries: TempLorebookEntry[] } | null {
  if (model !== AETHERROOM_MODEL || !ctx.char || !ctx.user) return null;
  const char = ctx.char;
  const user = ctx.user;
  const entries: TempLorebookEntry[] = [];

  for (const brain of ctx.floaty || []) {
    if (brain.entry.name !== '' && brain.entry.content !== '') {
      const macroProcessed = replaceMacros(brain.entry.content, char.name, user.name, ctx.nowMs);
      entries.push({ id: brain.id, name: brain.entry.name, content: `----\n${brain.entry.name}\n${macroProcessed}`, active: brain.active, appearWithPermanent: false });
    }
  }

  if (ctx.jots && ctx.jots.length > 0) {
    const factList: string[] = [];
    for (const entry of ctx.jots) {
      if (entry.text) factList.push(`- ${replaceMacros(entry.text, char.name, user.name, ctx.nowMs)}`);
    }
    if (factList.length > 0) {
      entries.push({
        name: JOTS_NAME,
        content: `----\nFacts About ${user.name}\n${char.name} knows the following about ${user.name} and feels comfortable referencing this information in interactions.\n${factList.join('\n')}`,
        active: true,
        appearWithPermanent: false,
      });
    }
  }

  const diaryFound = hasList(ctx.diary);
  const processFound = hasList(ctx.process);
  const conditionalFound = hasList(char.brainsConditional);
  if (diaryFound || processFound || conditionalFound) {
    const maxLookback = 1000;
    const cleaned = storyText.split(/\s+/).map((word) => word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '')).filter((word) => word.length > 0);
    const words = cleaned.length > maxLookback ? cleaned.slice(cleaned.length - maxLookback) : cleaned;

    let maxPhraseLength = 0;
    const measure = (list: { keys: string[] }[] | undefined) => {
      for (const brain of list ?? []) for (const key of brain.keys) maxPhraseLength = Math.max(maxPhraseLength, key.trim().split(/\s+/).length);
    };
    if (diaryFound) measure(ctx.diary);
    if (processFound) measure(ctx.process);
    if (conditionalFound) measure(char.brainsConditional);

    const phraseSet = new Set<string>();
    for (let n = 1; n <= maxPhraseLength; n++) {
      for (let i = 0; i <= words.length - n; i++) phraseSet.add(words.slice(i, i + n).join(' '));
    }
    const fires = (keys: string[]) => keys.map(normalizeKey).some((key) => phraseSet.has(key));

    if (diaryFound) {
      for (const brain of ctx.diary!) {
        if (fires(brain.keys)) entries.push({ name: brain.name, content: `----\n${brain.name}\nType: diary entry\n${brain.content}`, active: true, appearWithPermanent: false });
      }
    }
    if (processFound) {
      for (const brain of ctx.process!) {
        if (fires(brain.keys)) entries.push({ name: brain.name, content: `----\n${brain.name}\nType: emotional memory\n${brain.content}`, active: true, appearWithPermanent: false });
      }
    }
    if (conditionalFound) {
      for (const brain of char.brainsConditional!) {
        if (brain.requiredIntimacy !== 'none' && brain.requiredIntimacy !== ctx.chat.intimacy) continue;
        if (fires(brain.keys)) {
          const macroProcessed = replaceMacros(brain.content, char.name, user.name, ctx.nowMs);
          entries.push({ name: brain.name, content: `----\n${brain.name}\n${macroProcessed}`, active: true, appearWithPermanent: false });
        }
      }
    }
  }

  return { temporaryLorebookEntries: entries };
}

export function stableMessageId(msg: KernelMessage): string {
  const str = `${msg.role}\x00${msg.content || ''}`;
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `id_${hash.toString(36)}`;
}

// Rebuilds the message list: the sheet, the turns the window holds, then the extras and the
// style line directly before the last assistant message. `messages` is the chat as NovelAI's
// editor would hand it over: brain entries as system messages starting "----", the player's
// turns as written, the contact's turns as "Name: text / Emotion: word", and last an assistant
// message for the reply to be written into.
export async function contextBuilt(messages: KernelMessage[], model: string, dryRun: boolean, ctx: KernelContext, deps: KernelDeps, roll: Roll): Promise<BuiltResult> {
  let plans = ctx.plans;
  let planSave = false;
  const character = ctx.char;
  const user = ctx.user;
  if (model !== AETHERROOM_MODEL || !character || !user) return { messages: null, plans, planSave };

  let attempts = 0;
  const MAX_ATTEMPTS = 2;
  while (attempts < MAX_ATTEMPTS) {
    attempts++;

    let prefixValid = true;
    if (roll.startIndex > 0) {
      const checkLen = Math.min(roll.startIndex, messages.length);
      for (let i = 0; i < checkLen; i++) {
        if (i >= roll.pathIdList.length || roll.pathIdList[i] !== stableMessageId(messages[i]!)) { prefixValid = false; break; }
      }
    }
    if (!prefixValid) { rollReset(roll); continue; }

    const naiSystemPrompt = await deps.naiSystemPrompt();
    const systemPrompt = buildSystemPrompt(ctx, ctx.includeGameStats);

    const historyMsgList: KernelMessage[] = [];
    const historyMeta: (number | null)[] = [];
    let userMsgCount = 0;
    let assistantMsgCount = 0;
    let totalHistoryTokens = 0;
    let brainTokens = 0;

    for (let i = roll.startIndex; i < messages.length; i++) {
      const msg = messages[i]!;
      if (msg.role === 'system' && msg.content === naiSystemPrompt) continue;

      const newMsg: KernelMessage = { role: msg.role, content: msg.content || '' };
      if (newMsg.role === 'user') {
        if (newMsg.content!.endsWith('Write.') || newMsg.content!.endsWith('Continue.')) continue;
        if (newMsg.content !== '') {
          // In a group, another character's line is already under their own name.
          const named = [user.name, ...(ctx.groupNames ?? [])].some((name) => newMsg.content!.startsWith(`${name}:`));
          if (!named) newMsg.content = `${user.name}: ${newMsg.content}`;
          newMsg.content = newMsg.content!.replaceAll('\n', '\n    ');
          userMsgCount++;
        }
      } else if (newMsg.role === 'assistant') {
        if (newMsg.content!.endsWith('***\n')) newMsg.content = newMsg.content!.substring(0, newMsg.content!.length - '***\n'.length);
        else if (newMsg.content !== '') assistantMsgCount++;
      }

      const isBrain = msg.role === 'system' && (msg.content ?? '').startsWith('----');
      const tokens = await deps.encode(newMsg.content || '', model);
      if (isBrain) brainTokens += tokens.length;
      else totalHistoryTokens += tokens.length;

      historyMsgList.push(newMsg);
      historyMeta.push(isBrain ? null : i);
    }

    const isGreeting = assistantMsgCount === 0 && userMsgCount === 0;

    const systemTokens = await deps.encode(systemPrompt, model);
    let softLimit = 8192;
    try { softLimit = await deps.maxTokens(model); } catch (error) { deps.log(error); }
    let rolloverDelta = 0;
    try { rolloverDelta = await deps.rolloverTokens(model); } catch (error) { deps.log(error); }
    const hardLimit = softLimit + rolloverDelta;

    const hardBudget = hardLimit - systemTokens.length - RESERVED_TOKENS - brainTokens;
    const softBudget = softLimit - systemTokens.length - RESERVED_TOKENS - brainTokens;

    const lowerLimit = softLimit - rolloverDelta;
    if (systemTokens.length + totalHistoryTokens + brainTokens < lowerLimit && roll.startIndex > 0) { rollReset(roll); continue; }

    if (totalHistoryTokens > hardBudget || (totalHistoryTokens > softBudget && roll.checkInitialTrim)) {
      while (totalHistoryTokens > softBudget && historyMsgList.length > 0) {
        const removeIdx = historyMeta.findIndex((meta) => meta !== null);
        if (removeIdx === -1) break;
        const removedMeta = historyMeta[removeIdx]!;
        const tokens = await deps.encode(historyMsgList[removeIdx]!.content || '', model);
        totalHistoryTokens -= tokens.length;
        roll.startIndex = Math.max(roll.startIndex, removedMeta + 1);
        historyMsgList.splice(removeIdx, 1);
        historyMeta.splice(removeIdx, 1);
      }
      roll.trimmed = true;
    }

    roll.pathIdList = messages.map((message) => stableMessageId(message));

    const finalMsgList: KernelMessage[] = [{ role: 'system', content: systemPrompt }];
    if (!roll.trimmed && roll.startIndex === 0) finalMsgList.push({ role: 'system', content: 'Start of chat.' });
    for (const msg of historyMsgList) finalMsgList.push(msg);

    const lastAssistLocation = lastAssistantIndex(finalMsgList);

    let styleMsg = `[ Style: ${ctx.chat.style}`;
    if (isGreeting) styleMsg += ', greeting';
    styleMsg += ' ]';
    if (ctx.chat.responseLength !== 'unspecified') {
      styleMsg = `[ Style: ${ctx.chat.style}${isGreeting ? ', greeting' : ''}; Response length: ${ctx.chat.responseLength} ]`;
    }
    if (character.cjk) styleMsg = `${styleMsg.slice(0, -2)}; CJK ]`;

    if (lastAssistLocation !== -1) {
      finalMsgList.splice(lastAssistLocation, 0, { role: 'system', content: styleMsg });

      const nearEnd: string[] = [];
      let significantTimeApart = false;

      if (ctx.trackRealTime === true) {
        if (ctx.lastContactMs && ctx.lastContactMs > 0) {
          const wholeHours = Math.floor(Math.abs(ctx.nowMs - ctx.lastContactMs) / (1000 * 60 * 60));
          if (wholeHours > 0) {
            const hoursStr = wholeHours === 1 ? `${wholeHours} hour` : `${wholeHours} hours`;
            nearEnd.push(`----\nTime Apart\nIt's been ${hoursStr} since ${character.name} last messaged ${user.name}.`);
            significantTimeApart = true;
          }
        }

        if (character.schedule) {
          const eventTextList: string[] = [];
          const JS_DAY_LIST = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const date = new Date(ctx.nowMs);
          const dayStr = JS_DAY_LIST[date.getDay()]!;
          const minutes = (date.getHours() * 60) + date.getMinutes();

          const addActiveEvents = (eventList: KernelScheduleEvent[]) => {
            for (const evt of eventList) {
              if (evt.requiredIntimacy !== 'none' && ctx.chat.intimacy !== evt.requiredIntimacy) continue;
              const active = evt.startTime <= evt.endTime
                ? minutes >= evt.startTime && minutes <= evt.endTime
                : minutes >= evt.startTime || minutes <= evt.endTime;
              if (active) {
                const text = replaceMacros(evt.text, character.name, user.name, ctx.nowMs);
                eventTextList.push(`- Time Range: ${formatTime(evt.startTime)} - ${formatTime(evt.endTime)}, Event: ${text}`);
              }
            }
          };
          if (character.schedule[dayStr]!.length > 0) addActiveEvents(character.schedule[dayStr]!);
          if (character.schedule.Daily!.length > 0) addActiveEvents(character.schedule.Daily!);

          if (eventTextList.length > 0) {
            nearEnd.push(`----\nCurrent Events\nToday is ${dayStr} at ${formatTime(minutes)} (24-hour clock). Current scheduled events for ${character.name}:\n${eventTextList.join('\n')}\nAn event can be something ${character.name} is currently doing or planning to do during this time.`);
          }
        }
      }

      if (ctx.useEmotionalModes === true) {
        if (significantTimeApart) {
          const pre = `----\n${character.name}'s Mood\nWhile away from the chat, ${character.name} experienced emotions that put them in the following state of mind.`;
          const mode = EMOTIONAL_MODES[deps.rngInt(0, EMOTIONAL_MODES.length - 1)]!;
          nearEnd.push(`${pre}\n${mode}: ${EMOTIONAL_MODE_ATTR[mode]!.prompt}`);
        } else {
          const pre = `----\n${character.name}'s Mood\n${character.name}'s recent emotions have put them in the following state of mind.`;
          const recent = await deps.recentEmotions(3);
          const matched = EMOTIONAL_MODES.filter((mode) => recent.every((emotion) => EMOTIONAL_MODE_ATTR[mode]!.triggers.has(emotion)));
          if (matched.length > 1) {
            const mode = matched[deps.rngInt(0, matched.length - 1)]!;
            nearEnd.push(`${pre}\n${mode}: ${EMOTIONAL_MODE_ATTR[mode]!.prompt}`);
          } else if (matched.length === 1) {
            nearEnd.push(`${pre}\n${matched[0]}: ${EMOTIONAL_MODE_ATTR[matched[0]!]!.prompt}`);
          }
        }
      }

      if (nearEnd.length > 0) finalMsgList.splice(lastAssistLocation, 0, { role: 'system', content: nearEnd.join('\n') });
    }

    const limited: number[] = [];
    const ongoing: number[] = [];
    for (let i = 0; i < (plans?.length ?? 0); i++) {
      const plan = plans![i]!;
      if (!plan.content) continue;
      const eligible = ((!plan.planType || plan.planType === 'AI') && plan.remainingTurns >= 0) || (plan.planType === 'User' && plan.remainingTurns > 0);
      if (!eligible) continue;
      if (!plan.durationType || plan.durationType === 'Limited') limited.push(i);
      else if (plan.durationType === 'Ongoing') ongoing.push(i);
    }

    let pickedLimited = -1;
    const planInjection: string[] = [];
    if (ongoing.length > 0) planInjection.push(plans![ongoing[deps.rngInt(0, ongoing.length - 1)]!]!.content);
    if (limited.length > 0) {
      pickedLimited = limited[deps.rngInt(0, limited.length - 1)]!;
      planInjection.push(plans![pickedLimited]!.content);
    }

    if (planInjection.length > 0) {
      // With a plan and no assistant message, CharacterRoom throws here and NovelAI builds the
      // context without it (CR-PLAN §3.8). Kept, and pinned by the plans-no-assistant fixture.
      const currentLastAssist = lastAssistantIndex(finalMsgList);
      const target = finalMsgList[currentLastAssist] as KernelMessage;
      target.content = `<think>${planInjection.join('\n')}</think>\n${target.content}`;
    }

    if (!dryRun) {
      if (limited.length > 0) {
        const plan = plans![pickedLimited]!;
        if (!plan.running) {
          plan.running = true;
          plan.startedAtCount = userMsgCount;
        } else if (userMsgCount < plan.startedAtCount) {
          plan.remainingTurns = 0;
        } else {
          plan.remainingTurns = plan.totalTurns - (userMsgCount - plan.startedAtCount);
        }
      }
      if (planInjection.length > 0) {
        plans = plans!.filter((plan) => (plan.remainingTurns > 0 && (plan.planType === undefined || plan.planType === 'AI')) || (plan.planType && plan.planType === 'User'));
        planSave = true;
      }
    }

    return { messages: finalMsgList, plans, planSave };
  }
  return { messages: null, plans, planSave };
}

// The last few emotions the contact showed, newest first, from the chat's sections of text.
export function recentEmotionsFromSections(sections: { section: { text: string } }[], totalToFind: number): string[] {
  const emotionList: string[] = [];
  for (const section of (sections || []).slice().reverse()) {
    const match = section.section.text.match(/(?<=\s\sEmotion:\s)(\b\w+)/g);
    if (match) {
      emotionList.push(match[0]!);
      if (emotionList.length >= totalToFind) break;
    }
  }
  if (emotionList.length === 0) emotionList.push('neutral');
  return emotionList;
}
