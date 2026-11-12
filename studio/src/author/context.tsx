// The model connection, held once for the Studio so Settings and every Draft button see the same
// one. The call itself can be swapped (tests hand in a canned model).
//
// The helper can use a model of its own (W2): another model from the same provider, so a strong
// instruction model can help while the player's favourite story model plays. And Plain voice
// turns Errata's manner off. Both are kept in this browser.
import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_WINDOW } from './prompts';
import type { Generate } from './run';
import { canPrefill, generate, type Connection } from '../../../kit/src/connection';

export interface HelperPrefs {
  // Empty: the same model as play.
  model: string;
  plain: boolean;
}

const MODEL_KEY = 'inkwyrm.helper.model';
const PLAIN_KEY = 'inkwyrm.helper.plain';

export function readHelperPrefs(): HelperPrefs {
  try {
    return { model: window.localStorage.getItem(MODEL_KEY) ?? '', plain: window.localStorage.getItem(PLAIN_KEY) === 'yes' };
  } catch {
    return { model: '', plain: false };
  }
}

export function saveHelperPrefs(prefs: HelperPrefs): void {
  try {
    if (prefs.model) window.localStorage.setItem(MODEL_KEY, prefs.model); else window.localStorage.removeItem(MODEL_KEY);
    if (prefs.plain) window.localStorage.setItem(PLAIN_KEY, 'yes'); else window.localStorage.removeItem(PLAIN_KEY);
  } catch { /* a browser that keeps nothing still helps, just with the defaults */ }
}

export interface Author {
  connection: Connection;
  // The model the helper calls: the helper's own, or play's.
  model: string;
  // A call to that model.
  generate: Generate;
  // How much the model reads: what the provider lists, or the safe default.
  window: number;
  prefill: boolean;
  plain: boolean;
  openSettings: () => void;
}

export function authorFor(connection: Connection, openSettings: () => void, call?: Generate, prefs: HelperPrefs = { model: '', plain: false }): Author {
  const model = prefs.model && (!connection.models.length || connection.models.includes(prefs.model)) ? prefs.model : connection.model;
  const target = { ...connection, model };
  const listed = connection.contexts[model];
  return {
    connection,
    model,
    generate: call ?? ((messages, options) => generate(messages, target, options)),
    window: listed && listed > 0 ? listed : DEFAULT_WINDOW,
    prefill: canPrefill(connection),
    plain: prefs.plain,
    openSettings,
  };
}

const AuthorContext = createContext<Author | null>(null);

export function AuthorProvider({ value, children }: { value: Author; children: ReactNode }) {
  return <AuthorContext.Provider value={value}>{children}</AuthorContext.Provider>;
}

// Null outside a provider: the record page then shows no Draft buttons.
export const useAuthor = () => useContext(AuthorContext);
