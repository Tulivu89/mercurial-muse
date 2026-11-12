// The model connection, held once for the Studio so Settings and every Draft button see the same
// one. The call itself can be swapped (tests hand in a canned model).
import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_WINDOW } from './prompts';
import type { Generate } from './run';
import { canPrefill, generate, type Connection } from '../../../kit/src/connection';

export interface Author {
  connection: Connection;
  // A call to the connected model.
  generate: Generate;
  // How much the model reads: what the provider lists, or the safe default.
  window: number;
  prefill: boolean;
  openSettings: () => void;
}

export function authorFor(connection: Connection, openSettings: () => void, call?: Generate): Author {
  const listed = connection.contexts[connection.model];
  return {
    connection,
    generate: call ?? ((messages, options) => generate(messages, connection, options)),
    window: listed && listed > 0 ? listed : DEFAULT_WINDOW,
    prefill: canPrefill(connection),
    openSettings,
  };
}

const AuthorContext = createContext<Author | null>(null);

export function AuthorProvider({ value, children }: { value: Author; children: ReactNode }) {
  return <AuthorContext.Provider value={value}>{children}</AuthorContext.Provider>;
}

// Null outside a provider: the record page then shows no Draft buttons.
export const useAuthor = () => useContext(AuthorContext);
