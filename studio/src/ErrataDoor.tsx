// The Errata door on a record (docs/bids/worldbuilding/decision.md, phase W2): a round of
// answers to pick, Settled, the talk, and Write. Errata talks; she never writes. What she helps
// write lands as drafts under the fields, and on a phone here too.
import { useState } from 'react';
import type { StoryRecord, World } from '../../core/records/index.js';
import { DraftsFor } from './Drafting';
import { useAuthor } from './author/context';
import type { Round } from './author/talk';
import type { TalkApi } from './author/useTalk';
import type { DraftsApi } from './author/useDrafts';
import { targetKey } from './author/shapes';

export function errataSays(talk: TalkApi['talk'], drafts: DraftsApi): string {
  const waiting = drafts.drafts.filter((draft) => draft.state !== 'needs').length;
  if (waiting) return `${waiting} draft${waiting === 1 ? '' : 's'} waiting${talk.settled.length ? ` · ${talk.settled.length} settled` : ''}.`;
  if (talk.settled.length) return `${talk.settled.length} settled. Write turns them into drafts.`;
  return 'Talk it through. Errata asks; you pick, and she drafts.';
}

export function ErrataDoor({ world, record, talk, drafts, onChange }: { world: World; record: StoryRecord; talk: TalkApi; drafts: DraftsApi; onChange: (record: StoryRecord) => void }) {
  const author = useAuthor();
  const [words, setWords] = useState('');
  const [target, setTarget] = useState('');
  const [confirming, setConfirming] = useState(false);
  if (!author?.connection.connected) {
    return (
      <div className="errata">
        <p className="lede">Errata helps you build {record.name}: she asks, you pick or answer, and what you settle becomes drafts under the fields.</p>
        <p className="hint"><button type="button" className="btn small" onClick={author?.openSettings}>Settings</button> Connect a model to talk to her.</p>
      </div>
    );
  }
  const open = talk.talk.rounds.filter((round) => !round.done);
  const targets = talk.targets();
  const chosen = targets.find((entry) => targetKey(entry.target) === target) ?? targets[0];
  const cost = confirming ? talk.allEmptyCost() : null;
  const busy = Boolean(talk.busy);
  const waitingTargets = targets.filter((entry) => drafts.drafts.some((draft) => targetKey(draft.target) === targetKey(entry.target)));

  return (
    <div className="errata">
      {open.map((round) => <RoundCard key={round.id} round={round} talk={talk} busy={busy} />)}
      {!open.length && (
        <div className="row">
          <button type="button" className="btn small" disabled={busy} onClick={() => void talk.askRound()}>{talk.talk.rounds.length ? 'Ask me something' : 'Start: ask me something'}</button>
          <span className="hint">Errata offers answers to pick. Your own words always count.</span>
        </div>
      )}

      <SettledList talk={talk} />

      {talk.talk.turns.length > 0 && (
        <section className="talk" aria-label="The talk">
          {talk.talk.turns.map((turn) => (
            <div key={turn.id} className={`turn ${turn.from}`}>
              <p className="turn-who">{turn.from === 'author' ? 'You' : author.plain ? 'Helper' : 'Errata'}</p>
              <p className="turn-text">{turn.text}</p>
              {turn.offers?.length ? (
                <div className="row offers">
                  {turn.offers.map((offer) => <button key={offer} type="button" className="btn small quiet offer" onClick={() => talk.takeOffer(turn.id, offer)}>+ Settle: {offer}</button>)}
                </div>
              ) : null}
              <button type="button" className="btn small quiet turn-x" aria-label="Remove this turn" onClick={() => talk.removeTurn(turn.id)}>×</button>
            </div>
          ))}
        </section>
      )}

      <form className="row talk-box" onSubmit={(event) => { event.preventDefault(); const said = words; setWords(''); void talk.send(said); }}>
        <label className="field grow">
          <span className="sr">Talk to Errata</span>
          <textarea rows={2} value={words} placeholder={`Anything about ${record.name}`} onChange={(event) => setWords(event.target.value)} />
        </label>
        <button type="submit" className="btn" disabled={busy || !words.trim()}>Send</button>
      </form>

      {talk.busy && (
        <p className="hint row" aria-live="polite">{talk.busy} <button type="button" className="btn small" onClick={talk.stop}>Stop</button></p>
      )}
      {talk.error && <p className="status bad" role="status">{talk.error}</p>}

      <section className="write" aria-label="Write">
        <h3 className="sub">Write</h3>
        <div className="row">
          <label className="field grow">
            <span className="sr">The field to write</span>
            <select value={chosen ? targetKey(chosen.target) : ''} onChange={(event) => setTarget(event.target.value)}>
              {targets.map((entry) => <option key={targetKey(entry.target)} value={targetKey(entry.target)}>{entry.label}{entry.empty ? ' (empty)' : ''}</option>)}
            </select>
          </label>
          <button type="button" className="btn" disabled={busy || !chosen || drafts.running.size > 0} onClick={() => chosen && void talk.write(chosen.target)}>Write it</button>
        </div>
        {confirming && cost ? (
          <div className="row confirm">
            <span className="hint">{cost.calls ? `${cost.calls} call${cost.calls === 1 ? '' : 's'}, one after another, about ${cost.tokens.toLocaleString()} tokens sent in all (a few more if one is sent back).` : 'Nothing is empty.'}</span>
            {cost.calls > 0 && <button type="button" className="btn small primary" onClick={() => { setConfirming(false); void talk.writeAllEmpty(); }}>Write them</button>}
            <button type="button" className="btn small quiet" onClick={() => setConfirming(false)}>Not now</button>
          </div>
        ) : (
          <button type="button" className="btn small quiet" disabled={busy || drafts.running.size > 0} onClick={() => setConfirming(true)}>Write all empty</button>
        )}
        <p className="hint">Drafts land under their fields on the page. Nothing changes until you keep one.</p>
      </section>

      {waitingTargets.length > 0 && (
        <section className="below-wide door-drafts" aria-label="Drafts waiting">
          <h3 className="sub">Drafts waiting</h3>
          {waitingTargets.map((entry) => (
            <div key={targetKey(entry.target)} className="door-draft">
              <p className="hint">{entry.label}</p>
              <DraftsFor world={world} record={record} target={entry.target} api={drafts} onChange={onChange} label={entry.label} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function RoundCard({ round, talk, busy }: { round: Round; talk: TalkApi; busy: boolean }) {
  const author = useAuthor();
  const chosen = round.items.some((item) => item.picked.length || item.own.trim());
  return (
    <section className="round card" aria-label="A round of questions">
      {round.lead && <p className="round-lead">{round.lead}</p>}
      {round.items.map((item, index) => (
        <fieldset key={item.questionId} className="round-q">
          <legend>{item.question}</legend>
          <div className="row answers">
            {item.answers.map((answer, at) => (
              <button key={answer.text} type="button" className={`answer${item.picked.includes(at) ? ' picked' : ''}`} aria-pressed={item.picked.includes(at)} onClick={() => talk.pick(round, index, at)}>
                <span className="answer-text">{answer.text}</span>
                {answer.note && <span className="answer-note">{answer.note}</span>}
              </button>
            ))}
            {!item.answers.length && <p className="hint">No answers came back for this one. Write your own.</p>}
          </div>
          <label className="field">
            <span className="sr">Your own answer to: {item.question}</span>
            <input value={item.own} placeholder="Or in your own words" onChange={(event) => talk.own(round, index, event.target.value)} />
          </label>
        </fieldset>
      ))}
      <div className="row">
        <button type="button" className="btn small primary" disabled={!chosen} onClick={() => talk.takeRound(round)}>Take these</button>
        <button type="button" className="btn small quiet" disabled={busy} onClick={() => void talk.otherAnswers(round)}>Other answers</button>
        <button type="button" className="btn small quiet" onClick={() => talk.skipRound(round)}>Skip these</button>
      </div>
      {author && round.reading && <details className="sent"><summary>{author.plain ? 'Its' : 'Errata\'s'} reading</summary><p className="hint">{round.reading}</p></details>}
    </section>
  );
}

function SettledList({ talk }: { talk: TalkApi }) {
  const [adding, setAdding] = useState('');
  const lines = talk.talk.settled;
  return (
    <details className="settled card fold" open={lines.length > 0 && lines.length <= 6 ? true : undefined}>
      <summary><b>Settled</b> <span className="hint">{lines.length ? `${lines.length} so far` : 'Nothing yet. Picks and what you agree to land here.'}</span></summary>
      {lines.map((line) => (
        <div key={line.id} className="row settled-line">
          <label className="field grow">
            <span className="sr">Settled</span>
            <textarea rows={Math.max(1, Math.ceil(line.text.length / 48))} value={line.text} onChange={(event) => talk.editSettled(line.id, event.target.value)} />
          </label>
          <button type="button" className="btn small quiet" aria-label={`Remove: ${line.text}`} onClick={() => talk.removeSettled(line.id)}>×</button>
        </div>
      ))}
      <form className="row" onSubmit={(event) => { event.preventDefault(); talk.addSettled(adding); setAdding(''); }}>
        <label className="field grow">
          <span className="sr">Settle something yourself</span>
          <input value={adding} placeholder="Settle something yourself" onChange={(event) => setAdding(event.target.value)} />
        </label>
        <button type="submit" className="btn small quiet" disabled={!adding.trim()}>Add</button>
      </form>
    </details>
  );
}

