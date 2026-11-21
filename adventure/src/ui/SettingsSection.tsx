// Settings in play: the site's one Settings page (kit/src/settings/SettingsPage.tsx), in the menu
// under the prompt, open on the Adventure tab. That tab carries this game's own settings first
// (the narrator's window, the journal, checks), then this save and the tools for testing.
import { exportSave, planAsText, sentAs, setOptions, type Options } from '../engine';
import type { PlayApi } from './Play';
import { SourceTag, describeEntry } from './shared';
import { downloadJson, fileSafe } from './files';
import { SettingsPage } from '../../../kit/src/settings/SettingsPage';
import { Choice, Group, Toggle } from '../../../kit/src/settings/parts';
import { ADDRESS } from '../../../kit/src/addresses';

const thousands = (value: number) => value.toLocaleString('en-US');

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function saveText(text: string, name: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// This game's own settings: they live in the save, so they go with it.
function ThisGame({ api }: { api: PlayApi }) {
  const { save, connection, lastPlan } = api;
  const options = save.options;
  const change = (changes: Partial<Options>) => {
    const result = setOptions(save, changes);
    if (result.ok) api.commit(result.save); else api.notify(result.reason);
  };
  const modelWindow = connection.contexts[connection.model];
  return (
    <>
      <Group title="This game" note={`${api.module.name}. These are kept in the save, so they go with it.`}>
        <Choice<number> label="Longest reply" value={options.replyTokens} options={[[600, '600 tokens'], [1000, '1,000'], [1600, '1,600']]} onPick={(replyTokens) => change({ replyTokens })} />
        <Choice<number> label="The model’s window" value={options.contextTokens} options={[[16000, '16k'], [28000, '28k'], [32000, '32k'], [64000, '64k'], [128000, '128k']]} onPick={(contextTokens) => change({ contextTokens })}
          hint={<>
            {connection.connected && modelWindow ? `${connection.model} reads up to ${thousands(modelWindow)} tokens.${modelWindow < options.contextTokens ? ' That is less than this window, so choose a smaller one.' : ''} A bigger window costs more on providers that charge by the token. ` : ''}
            {lastPlan
              ? `Last turn sent about ${thousands(lastPlan.estimate.total)} tokens: rules and world ${thousands(lastPlan.estimate.system)}, journal ${thousands(lastPlan.estimate.journal)}, story ${thousands(lastPlan.estimate.transcript)}, this scene's lore, your words and the reply's opening ${thousands(lastPlan.estimate.moment)}. The story gets up to ${thousands(lastPlan.budget.transcriptHigh)}.`
              : 'The story gets what the window has left after the rules, the world, the journal and the moment.'}
          </>} />
        <Choice<string> label="When you make a check" value={options.alwaysSucceed ? 'succeed' : 'roll'} options={[['roll', 'Roll the dice'], ['succeed', 'Succeed, no roll']]} onPick={(pick) => change({ alwaysSucceed: pick === 'succeed' })}
          hint={<>Either choice is always one tap away on the check itself. The ledger records who decided. <button type="button" className="ks-btn small quiet" onClick={() => api.open('guide')}>How checks work</button></>} />
      </Group>
      <Group title="Journal">
        <Toggle label="Suggest entries as story leaves the window" hint="You keep, edit or discard each one. Nothing joins the journal on its own." on={options.autoJournal} onToggle={(autoJournal) => change({ autoJournal })} />
        <Choice<number> label="Story leaves the window in pieces of" value={options.pieceTokens} options={[[4000, '4,000 tokens'], [6000, '6,000'], [9000, '9,000']]} onPick={(pieceTokens) => change({ pieceTokens })} hint="Each piece becomes one suggested entry. Bigger pieces mean fewer, broader entries and fewer changes to what the narrator is sent." />
        <Choice<number> label="Journal budget" value={options.journalTokens} options={[[2000, '2,000 tokens'], [3000, '3,000'], [5000, '5,000']]} onPick={(journalTokens) => change({ journalTokens })} />
        <Toggle label="Suggest compressing older entries" hint="When the journal passes its budget. The originals are archived, not deleted." on={options.autoCompress} onToggle={(autoCompress) => change({ autoCompress })} />
      </Group>
      <Group title="This save">
        <div className="ks-row">
          <button type="button" className="ks-btn" onClick={() => downloadJson(`${fileSafe(api.name)}.save.json`, exportSave(api.module, save, api.name))}>Export this save</button>
          <button type="button" className="ks-btn quiet" onClick={api.leave}>Your adventures</button>
          <a className="ks-btn quiet" href={ADDRESS.chat}>Chat</a>
          <a className="ks-btn quiet" href={ADDRESS.studio}>Studio</a>
        </div>
        <p className="ks-note">Your game is saved as you go.</p>
        <details>
          <summary className="ks-label">Ledger · {save.ledger.length} changes</summary>
          {save.ledger.length ? (
            <ol className="ledger">
              {save.ledger.slice(-60).reverse().map((entry, index) => (
                <li key={save.ledger.length - index}><span className="what">{describeEntry(api.world, entry)}</span><SourceTag source={entry.source} /></li>
              ))}
            </ol>
          ) : <p className="ks-note">Nothing has changed yet.</p>}
        </details>
      </Group>
    </>
  );
}

// What was sent, the last calls, and the generation test: for testing a model on this game.
function Testing({ api }: { api: PlayApi }) {
  const { connection, lastPlan, save } = api;
  return (
    <Group title="What the narrator was sent">
      <details>
        <summary className="ks-label">The last turn</summary>
        {lastPlan ? (
          <>
            <div className="ks-row" style={{ margin: '10px 0' }}>
              <button type="button" className="ks-btn small" onClick={() => { void copyText(planAsText(lastPlan, api.tries)).then((ok) => api.notify(ok ? 'Copied: everything sent, with the replies so far.' : 'Copying is blocked here. Use Save as a file.')); }}>Copy all</button>
              <button type="button" className="ks-btn small" onClick={() => saveText(planAsText(lastPlan, api.tries), `adventure-context-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`)}>Save as a file</button>
              <button type="button" className="ks-btn small" disabled={api.busy || !connection.connected} onClick={() => api.sampleTurn(5)}>Try this turn 5 more times</button>
              <span className="ks-note">{api.tries.length ? `Includes ${api.tries.length} ${api.tries.length === 1 ? 'reply' : 'replies'} to this turn.` : 'No reply yet.'}</span>
            </div>
            <ol className="sent">
              {lastPlan.messages.map((message, index) => <li key={index}><span className="label">{sentAs(message.role, index)}</span><pre>{message.content}</pre></li>)}
              {lastPlan.prefill && <li><span className="label">The reply's opening · prefill</span><pre>{lastPlan.prefill}</pre></li>}
              {api.tries.map((reply, index) => <li key={`try-${index}`}><span className="label">Reply {index + 1} of {api.tries.length}</span><pre>{reply}</pre></li>)}
            </ol>
          </>
        ) : <p className="ks-note">Nothing yet this session.</p>}
      </details>
      <details>
        <summary className="ks-label">Diagnostics · the last 10 calls</summary>
        {api.calls.length ? (
          <ol className="sent">
            {api.calls.map((call, index) => (
              <li key={index}>
                <span className={call.ok ? 'meta' : 'bad'} style={{ fontSize: 13 }}>{call.at} · {call.purpose} · {call.ok ? `ok, ${call.ms} ms` : 'failed'} · {call.message}</span>
                {call.diagnostics && <pre>{JSON.stringify(call.diagnostics, null, 2)}</pre>}
              </li>
            ))}
          </ol>
        ) : <p className="ks-note">No calls yet this session.</p>}
        <div className="ks-row" style={{ marginTop: 10 }}>
          <button type="button" className="ks-btn small" disabled={!api.calls.length} onClick={() => void navigator.clipboard?.writeText(JSON.stringify(api.calls, null, 2))}>Copy diagnostics</button>
          <span className="ks-note">Estimate: about {(1 / save.options.tokensPerChar).toFixed(1)} characters per token, corrected from the provider’s own counts.</span>
        </div>
      </details>
      <div className="ks-row">
        <button type="button" className="ks-btn quiet" onClick={() => api.open('test')}>Generation test: prompt reuse</button>
      </div>
    </Group>
  );
}

export function SettingsSection({ api }: { api: PlayApi }) {
  return (
    <>
      <SettingsPage
        embedded side="adventure"
        theme={api.theme} onTheme={api.setTheme} look={api.look} onLook={api.setLook}
        connection={api.connection} onConnection={api.setConnection}
        adventure={{ prefs: api.prefs, onPrefs: api.setPrefs, extra: <><ThisGame api={api} /><Testing api={api} /></> }}
      />
      <p className="version">Inkwyrm adventure {__PRAXIS_VERSION__} · {api.module.name} {api.module.version}</p>
    </>
  );
}
