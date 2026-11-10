// Chat's own settings, in this browser. The connection is the site's (kit/src/connection.ts).
import { XIALONG, profileFor } from '../../core/chat/index.js';
import type { Connection } from '../../kit/src/connection';

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
}

const KEY = 'inkwyrm.chat.settings';
export const DEFAULT_SETTINGS: Settings = { contextTokens: 0, replyTokens: 1000, temperature: 0.8, textSize: 'medium', layout: 'bubbles', rail: true, userName: '' };

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
