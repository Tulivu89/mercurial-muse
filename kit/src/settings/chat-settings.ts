// Chat's own settings, in this browser (`inkwyrm.chat.settings`). Kept in the kit so the site's one
// Settings page (SettingsPage.tsx) can show them on every side. The connection is the site's.
import { DEFAULT_PROMPT, XIALONG, profileFor, readPromptSetup, type ChapterLength, type PromptSetup } from '../../../core/chat/index.js';
import type { Connection } from '../connection';

export type TextSize = 'small' | 'medium' | 'large';
// Bubbles, or a page: no bubbles, the full width for prose.
export type Layout = 'bubbles' | 'page';
export interface Settings {
  // The context window in tokens; 0 means sized to the model.
  contextTokens: number;
  replyTokens: number;
  temperature: number;
  textSize: TextSize;
  layout: Layout;
  // On a wide screen, the character's portrait in a column beside the chat.
  rail: boolean;
  userName: string;
  // The persona a new chat starts with: "worldId:recordId", or empty for just a name.
  persona: string;
  // A reply that reaches its length limit is carried on without asking, up to twice.
  autoContinue: boolean;
  // Models other than xialong write no emotion line; 'auto' picks one after the reply where
  // emotion portraits or moods use it, 'off' never does.
  emotions: 'auto' | 'off';
  // A reply still cut off after carrying on loses its half sentence.
  trimCut: boolean;
  // The General prompt's parts as the player set them (core/chat/prompt.ts).
  prompt: PromptSetup;
  // What leaves the window is written up as chapters (core/chat/chapters.ts), this long.
  chapters: boolean;
  chapterLength: ChapterLength;
  // Each new reply read aloud in the character's voice, as it finishes.
  readAloud: boolean;
}

const KEY = 'inkwyrm.chat.settings';
export const DEFAULT_SETTINGS: Settings = { contextTokens: 0, replyTokens: 1000, temperature: 0.8, textSize: 'medium', layout: 'bubbles', rail: true, userName: '', persona: '', autoContinue: true, emotions: 'auto', trimCut: false, prompt: DEFAULT_PROMPT, chapters: true, chapterLength: 'usual', readAloud: false };
// How many times a reply is carried on without asking.
export const AUTO_CONTINUES = 2;

export function readSettings(): Settings {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Settings>;
    const number = (value: unknown, fallback: number, min: number, max: number) => (typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback);
    return {
      contextTokens: number(stored.contextTokens, 0, 0, 400_000),
      replyTokens: number(stored.replyTokens, DEFAULT_SETTINGS.replyTokens, 64, 8192),
      temperature: number(stored.temperature, DEFAULT_SETTINGS.temperature, 0, 2),
      textSize: stored.textSize === 'small' || stored.textSize === 'large' ? stored.textSize : 'medium',
      layout: stored.layout === 'page' ? 'page' : 'bubbles',
      rail: stored.rail !== false,
      userName: typeof stored.userName === 'string' ? stored.userName.slice(0, 120) : '',
      persona: typeof stored.persona === 'string' ? stored.persona.slice(0, 200) : '',
      autoContinue: stored.autoContinue !== false,
      emotions: stored.emotions === 'off' ? 'off' : 'auto',
      trimCut: stored.trimCut === true,
      prompt: readPromptSetup(stored.prompt),
      chapters: stored.chapters !== false,
      chapterLength: stored.chapterLength === 'short' || stored.chapterLength === 'full' ? stored.chapterLength : 'usual',
      readAloud: stored.readAloud === true,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: Settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* the choice lasts this visit */ }
}

// Without a size from the player: xialong's own window, or what the provider lists for the
// model, held to 32k so a long chat doesn't quietly cost a 128k prompt every turn.
export const AUTO_GENERAL = 16_384;
export const AUTO_CAP = 32_768;
export function contextTokensFor(settings: Settings, connection: Pick<Connection, 'model' | 'contexts'>): number {
  if (settings.contextTokens > 0) return settings.contextTokens;
  if (profileFor(connection.model) === 'aetherroom') return XIALONG.contextTokens;
  return Math.min(connection.contexts[connection.model] ?? AUTO_GENERAL, AUTO_CAP);
}
