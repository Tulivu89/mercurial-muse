// Connecting a model provider with the player's own key, or a server of their own. The key goes
// with each request and is never stored on the site's server; in this browser only if the player
// asks. Drawn on the Settings page's Model tab (settings/SettingsPage.tsx), in its ks- names.
import { useState } from 'react';
import { FORMAT_IDS, FORMAT_NAMES, guessFormat } from '../../core/narration/formats';
import { CUSTOM_PROVIDER } from '../../core/narration/providers';
import {
  connectWith, currentKey, forProvider, forgetKey, providerOf, rememberedKey, saveBase, saveFormat, saveMode, saveModel, setKey,
  type Connection, type FormatChoice, type NarrationMode,
} from './connection';
import { Field } from './settings/parts';

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
      <div className="ks-connected">
        <p>
          <span className="ks-dot" aria-hidden="true" /><b>{provider.name} connected.</b>{' '}
          <span className="ks-note">{custom ? connection.base : rememberedKey(connection.provider) ? 'Your key is remembered on this device.' : 'Your key stays in this tab.'}</span>
        </p>
        <button type="button" className="ks-btn quiet" onClick={disconnect}>Disconnect</button>
        {status && <p className="ks-note" role="status">{status}</p>}
      </div>
    );
  }

  return (
    <>
      <Field label="Replies from" hint={custom
        ? 'A server you run, such as koboldcpp, llama.cpp, LM Studio, Ollama, TabbyAPI or vLLM. It is called from this browser, so it has to allow requests from this site (CORS). From an https page, plain http works only for localhost.'
        : `Replies use your own ${provider.name} account. Your key goes with each request and is never stored on the site's server.${provider.keyNote ? ` Find it ${provider.keyNote.charAt(0).toLowerCase()}${provider.keyNote.slice(1)}` : ''}`}>
        <select value={connection.provider} onChange={(event) => choose(event.target.value)}>
          {providers.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select>
      </Field>
      {custom && (
        <Field label="Server address">
          <input type="url" autoComplete="off" value={base} placeholder="http://localhost:5001/v1" onChange={(event) => setBase(event.target.value)} />
        </Field>
      )}
      <Field label={provider.keyLabel}>
        <input type="password" autoComplete="off" value={key} placeholder={provider.keyHint || (custom ? 'Leave empty if it has none' : '')} onChange={(event) => setKeyText(event.target.value)} />
      </Field>
      <label className="ks-check"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> Remember on this device</label>
      <div className="ks-row">
        <button type="button" className="ks-btn primary" onClick={() => void connect()} disabled={busy}>Connect {provider.name}</button>
      </div>
      {status && <p className="ks-status" role="status">{status}</p>}
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
  const reads = connection.contexts[connection.model];
  return (
    <>
      <Field label="Model" hint={reads ? `${connection.model} reads up to ${reads.toLocaleString('en-US')} tokens.` : undefined}>
        {listed
          ? <select value={connection.model} onChange={(event) => setModel(event.target.value)}>{[...new Set([connection.model, ...connection.models].filter(Boolean))].map((model) => <option key={model} value={model}>{model}</option>)}</select>
          : <input className="mono" value={connection.model} placeholder="The model's name, as the provider writes it" onChange={(event) => setModel(event.target.value.trim())} />}
      </Field>
      {provider.completions ? (
        <div className="ks-row">
          <Field label="Sent as" hint="One prompt in the model’s own format lets the site write the start of each reply for the model to carry on, which keeps it closest to the rules.">
            <select value={connection.mode} onChange={(event) => setMode(event.target.value as NarrationMode)}>
              <option value="prompt">One prompt in the model's format</option>
              <option value="chat">Chat messages</option>
            </select>
          </Field>
          {connection.mode === 'prompt' && (
            <Field label="Prompt format" hint="Finetunes use their base model’s format. If replies come back with stray tags or never stop, this is the setting to change.">
              <select value={connection.format} onChange={(event) => setFormat(event.target.value as FormatChoice)}>
                <option value="auto">Guess from the name ({FORMAT_NAMES[guessFormat(connection.model)]})</option>
                {FORMAT_IDS.map((format) => <option key={format} value={format}>{FORMAT_NAMES[format]}</option>)}
              </select>
            </Field>
          )}
        </div>
      ) : <p className="ks-note">Sent as chat messages: {provider.name} takes no single prompts.</p>}
    </>
  );
}
