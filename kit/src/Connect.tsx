// Connecting a model provider with the player's own key, or a server of their own. The key goes
// with each request and is never stored on the site's server; in this browser only if the player
// asks.
import { useState } from 'react';
import { FORMAT_IDS, FORMAT_NAMES, guessFormat } from '../../core/narration/formats';
import { CUSTOM_PROVIDER } from '../../core/narration/providers';
import {
  connectWith, currentKey, forProvider, forgetKey, providerOf, rememberedKey, saveBase, saveFormat, saveMode, saveModel, setKey,
  type Connection, type FormatChoice, type NarrationMode,
} from './connection';

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
      setStatus(next.unlisted ? 'Connected. This provider lists no models, so type the model’s name below.' : '');
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
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p>
          <b>{provider.name} connected.</b>{' '}
          <span className="hint">{custom ? connection.base : rememberedKey(connection.provider) ? 'Your key is remembered on this device.' : 'Your key stays in this tab.'}</span>
        </p>
        <button type="button" className="btn quiet" onClick={disconnect}>Disconnect</button>
        {status && <p className="hint" role="status">{status}</p>}
      </div>
    );
  }

  return (
    <>
      <label className="field">
        <span>Replies from</span>
        <select value={connection.provider} onChange={(event) => choose(event.target.value)}>
          {providers.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
      </label>
      <p className="hint">
        {custom
          ? 'A server you run, such as koboldcpp, llama.cpp, LM Studio, Ollama, TabbyAPI or vLLM. It is called from this browser, so it has to allow requests from this site (CORS). From an https page, plain http works only for localhost.'
          : `Replies use your own ${provider.name} account. Your key goes with each request and is never stored on the site's server.${provider.keyNote ? ` Find it ${provider.keyNote.charAt(0).toLowerCase()}${provider.keyNote.slice(1)}` : ''}`}
      </p>
      {custom && (
        <label className="field">
          <span>Server address</span>
          <input type="url" autoComplete="off" value={base} placeholder="http://localhost:5001/v1" onChange={(event) => setBase(event.target.value)} />
        </label>
      )}
      <label className="field">
        <span>{provider.keyLabel}</span>
        <input type="password" autoComplete="off" value={key} placeholder={provider.keyHint || (custom ? 'Leave empty if it has none' : '')} onChange={(event) => setKeyText(event.target.value)} />
      </label>
      <div className="checks">
        <label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember on this device</label>
      </div>
      <div className="row">
        <button type="button" className="btn primary" onClick={() => void connect()} disabled={busy}>Connect {provider.name}</button>
      </div>
      {status && <p className="status" role="status">{status}</p>}
    </>
  );
}

// The model, and how the request is written for it.
export function ModelFields({ connection, onChange }: { connection: Connection; onChange: (next: Connection) => void }) {
  const provider = providerOf(connection);
  const setModel = (model: string) => { saveModel(connection.provider, model); onChange({ ...connection, model }); };
  const setMode = (mode: NarrationMode) => { saveMode(connection.provider, mode); onChange({ ...connection, mode }); };
  const setFormat = (format: FormatChoice) => { saveFormat(connection.provider, format); onChange({ ...connection, format }); };
  const listed = connection.models.length > 0 && !connection.unlisted;
  return (
    <>
      <label className="field">
        <span>Model</span>
        {listed
          ? <select value={connection.model} onChange={(event) => setModel(event.target.value)}>{[...new Set([connection.model, ...connection.models].filter(Boolean))].map((model) => <option key={model} value={model}>{model}</option>)}</select>
          : <input value={connection.model} placeholder="The model's name, as the provider writes it" onChange={(event) => setModel(event.target.value.trim())} />}
      </label>
      {provider.completions && (
        <div className="row">
          <label className="field grow">
            <span>Sent as</span>
            <select value={connection.mode} onChange={(event) => setMode(event.target.value as NarrationMode)}>
              <option value="prompt">One prompt in the model's format</option>
              <option value="chat">Chat messages</option>
            </select>
          </label>
          {connection.mode === 'prompt' && (
            <label className="field grow">
              <span>Prompt format</span>
              <select value={connection.format} onChange={(event) => setFormat(event.target.value as FormatChoice)}>
                <option value="auto">Guess from the name ({FORMAT_NAMES[guessFormat(connection.model)]})</option>
                {FORMAT_IDS.map((format) => <option key={format} value={format}>{FORMAT_NAMES[format]}</option>)}
              </select>
            </label>
          )}
        </div>
      )}
    </>
  );
}
