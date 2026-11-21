// The adventure's connection is the site's (kit/src/connection.ts): one provider, model and key
// for every side, set on the one Settings page. What is the adventure's own is the model that
// writes its journal suggestions.
import type { Connection } from '../../../kit/src/connection';

export { initialConnection, providerOf, reconnect, type Connection } from '../../../kit/src/connection';

// The model that writes journal suggestions: the one chosen for it, if this provider has it.
export const helperModelOf = (connection: Pick<Connection, 'model' | 'models'>, helperModel: string): string =>
  helperModel && connection.models.includes(helperModel) ? helperModel : connection.model;
