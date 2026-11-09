// Connecting a narration provider with the player's own key, or a server of their own. The
// key goes with each request and is never stored on the server; in this browser only if the
// player asks.
import { useState } from 'react';
import {
  CUSTOM_VIEW, DEFAULT_MODEL, currentKey, forgetKey, listModels, listProviders, rememberedKey, saveBase, saveModel, saveProvider, savedBase,
  savedFormat, savedMode, savedModel, savedProvider, setKey, type FormatChoice, type NarrationMode, type ProviderView, type Target,
} from './narration';
import { CUSTOM_PROVIDER } from '../../../core/narration/providers';

export interface Connection extends Target {
  connected: boolean;
  models: string[];
  // How much each model can read, where the provider says.
  contexts: Record<string, number>;
  // The provider lists no models, so the player types the name.
  unlisted: boolean;
  providers: ProviderView[];
}

export function initialConnection(): Connection {
  const provider = savedProvider();
  return {
    connected: false, provider, model: savedModel(provider), mode: savedMode(provider), format: savedFormat(provider), base: savedBase(),
    models: [], contexts: {}, unlisted: false, providers: [],
  };
}

export const providerOf = (connection: Pick<Connection, 'provider' | 'providers'>): ProviderView =>
  connection.providers.find((entry) => entry.id === connection.provider) ?? (connection.provider === CUSTOM_PROVIDER ? CUSTOM_VIEW : { ...CUSTOM_VIEW, id: connection.provider, name: connection.provider });

// The model that writes journal suggestions: the one chosen for it, if this provider has it.
export const helperModelOf = (connection: Pick<Connection, 'model' | 'models'>, helperModel: string): string =>
  helperModel && connection.models.includes(helperModel) ? helperModel : connection.model;

function pickModel(models: string[], wanted: string, provider: string): string {
  if (wanted && (models.includes(wanted) || !models.length)) return wanted;
  if (provider === 'novelai' && models.includes(DEFAULT_MODEL)) return DEFAULT_MODEL;
  return models[0] ?? wanted;
}

// The settings that belong to one provider, read back when the player switches to it.
function forProvider(connection: Connection, provider: string): Connection {
  return { ...connection, provider, model: savedModel(provider), mode: savedMode(provider), format: savedFormat(provider) as FormatChoice, models: [], contexts: {}, unlisted: false, connected: false };
}

async function connectWith(connection: Connection): Promise<Connection> {
  const listed = await listModels(connection.provider, connection.base);
  const model = pickModel(listed.models, connection.model, connection.provider);
  const provider = providerOf(connection);
  const mode: NarrationMode = provider.completions ? connection.mode : 'chat';
  if (model) saveModel(connection.provider, model);
  saveProvider(connection.provider);
  return { ...connection, connected: true, model, mode, models: listed.models, contexts: listed.contexts, unlisted: Boolean(listed.unlisted) || !listed.models.length };
}

// Connects with whatever key is already known. Used at start when one was remembered.
export async function reconnect(connection: Connection): Promise<Connection> {
  const providers = await listProviders();
  const known = providers.some((entry) => entry.id === connection.provider) ? connection : forProvider({ ...connection, providers }, providers[0]!.id);
  const ready = { ...known, providers };
  const canTry = ready.provider === CUSTOM_PROVIDER ? Boolean(ready.base) : Boolean(currentKey(ready.provider));
  if (!canTry) return ready;
  try { return await connectWith(ready); } catch { return { ...ready, connected: false }; }
}

export function ConnectForm({ connection, onChange }: { connection: Connection; onChange: (next: Connection) => void }) {
  const [key, setKeyText] = useState('');
  const [base, setBase] = useState(connection.base);
  const [remember, setRemember] = useState(Boolean(rememberedKey(connection.provider)));
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const provider = providerOf(connection);
  const custom = connection.provider === CUSTOM_PROVIDER;
  const providers = connection.providers.length ? connection.providers : [provider];

  function choose(id: string) {
    setKeyText('');
    setStatus('');
    setRemember(Boolean(rememberedKey(id)));
    onChange(forProvider(connection, id));
  }

  async function connect() {
    const value = key.trim() || currentKey(connection.provider);
    if (!custom && !value) { setStatus(`Paste your ${provider.keyLabel} first.`); return; }
    if (custom && !base.trim()) { setStatus('Give your server’s address first.'); return; }
    setBusy(true);
    setStatus('Connecting…');
    setKey(connection.provider, value, remember);
    if (custom) saveBase(base);
    try {
      const next = await connectWith({ ...connection, base: custom ? base.trim() : connection.base });
      setKeyText('');
      setStatus(next.unlisted ? 'Connected. This provider lists no models, so type the model’s name under Model.' : '');
      onChange(next);
    } catch (error) {
      if (!custom) forgetKey(connection.provider);
      setStatus(error instanceof Error ? error.message : 'Could not connect.');
      onChange({ ...connection, connected: false });
    } finally {
      setBusy(false);
    }
  }

  function disconnect() {
    forgetKey(connection.provider);
    setStatus(`Disconnected. Your ${custom ? 'key' : provider.keyLabel} is no longer kept anywhere.`);
    onChange({ ...connection, connected: false, models: [], contexts: {} });
  }

  if (connection.connected) {
    return (
      <div className="lr" style={{ minHeight: 64 }}>
        <span aria-hidden="true" className="dot" style={{ width: 10, height: 10, background: 'var(--good)', boxShadow: '0 0 0 4px #1d2e27' }} />
        <span className="grow">
          <span className="name" style={{ display: 'block' }}>{provider.name} connected</span>
          <span className="meta" style={{ display: 'block', marginTop: 2 }}>
            {custom ? connection.base : rememberedKey(connection.provider) ? 'Your key is remembered on this device' : 'Your key stays in this tab'}
          </span>
        </span>
        <button type="button" className="btn" onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <div className="lr stack">
      <div>
        <label htmlFor="provider" className="label field-label">Narration from</label>
        <select id="provider" className="select" value={connection.provider} onChange={(event) => choose(event.target.value)}>
          {providers.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
      </div>
      <p className="meta" style={{ lineHeight: 1.45 }}>
        {custom
          ? 'A server you run, such as koboldcpp, llama.cpp, LM Studio, Ollama, TabbyAPI or vLLM. Praxis calls it from this browser, so it has to allow requests from this site (CORS). From an https page, plain http works only for localhost.'
          : `Narration uses your own ${provider.name} account. Your key goes with each request and is never stored on the Praxis server.${provider.keyNote ? ` Find it ${provider.keyNote.charAt(0).toLowerCase()}${provider.keyNote.slice(1)}` : ''}`}
      </p>
      {custom && (
        <div>
          <label htmlFor="custom-base" className="label field-label">Server address</label>
          <input id="custom-base" className="field mono" type="url" autoComplete="off" value={base} placeholder="http://localhost:5001/v1" onChange={(event) => setBase(event.target.value)} />
        </div>
      )}
      <div>
        <label htmlFor="provider-key" className="label field-label">{provider.keyLabel}</label>
        <input id="provider-key" className="field" type="password" autoComplete="off" value={key} placeholder={provider.keyHint || (custom ? 'Leave empty if it has none' : '')} onChange={(event) => setKeyText(event.target.value)} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
        <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} style={{ width: 20, height: 20 }} />
        Remember on this device
      </label>
      <button type="button" className="btn primary" onClick={() => void connect()} disabled={busy}>Connect {provider.name}</button>
      {status && <p className="meta" role="status">{status}</p>}
    </div>
  );
}
