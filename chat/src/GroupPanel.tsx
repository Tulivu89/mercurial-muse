// Group chat, G2 (docs/model-jobs.md, Group chat): who is in this chat and how it answers, under the
// chat's details. Up to four characters from the chat's own world; each can be quiet, usual or
// chatty, or wait to be named. The layout stays B until the lab's scores say otherwise; C is here
// to try.
import { MAX_CAST, TALK, membersOf, setGroup, setMember, withCast, type Chat, type Talk } from '../../core/chat/index.js';
import type { World } from '../../core/records/index.js';

const TALK_NAMES: Record<Talk, string> = { quiet: 'Quiet', usual: 'Usual', chatty: 'Chatty' };

export function GroupPanel({ chat, world, onChange }: { chat: Chat; world: World | null; onChange: (chat: Chat) => void }) {
  if (!world) return null;
  const now = () => Date.now();
  const members = membersOf(chat, world);
  const inIt = new Set(members.map((member) => member.id));
  // Anyone people chat with in the same world can join.
  const joinable = world.records.filter((record) => record.kind === 'character' && record.chatListed && !inIt.has(record.id));
  const grouped = chat.cast.length > 1;
  return (
    <fieldset className="card group-panel" style={{ margin: 0 }}>
      <legend className="sub">People in this chat</legend>
      {members.map((member) => {
        const entry = chat.cast.find((cast) => cast.characterId === member.id);
        const lead = member.id === chat.characterId;
        return (
          <div key={member.id} className="row between group-member">
            <b>{member.name}{lead && <span className="hint"> · this chat&rsquo;s own</span>}</b>
            {grouped && entry && (
              <span className="row">
                <label className="sr" htmlFor={`talk-${member.id}`}>How often {member.name} speaks up</label>
                <select id={`talk-${member.id}`} value={entry.talk} onChange={(event) => onChange(setMember(chat, member.id, { talk: event.target.value as Talk }, now()))}>
                  {TALK.map((talk) => <option key={talk} value={talk}>{TALK_NAMES[talk]}</option>)}
                </select>
                <label className="checks"><input type="checkbox" checked={entry.muted} onChange={(event) => onChange(setMember(chat, member.id, { muted: event.target.checked }, now()))} /> Only when named</label>
                {!lead && <button type="button" className="btn small quiet" onClick={() => onChange(withCast(chat, members.filter((other) => other.id !== member.id).map((other) => other.id), now()))}>Leave</button>}
              </span>
            )}
          </div>
        );
      })}
      {members.length < MAX_CAST && joinable.length > 0 && (
        <label className="field"><span>Bring someone in</span>
          <select value="" onChange={(event) => { if (event.target.value) onChange(withCast(chat, [...members.map((member) => member.id), event.target.value], now())); }}>
            <option value="">Who else is here…</option>
            {joinable.map((record) => <option key={record.id} value={record.id}>{record.name}</option>)}
          </select>
        </label>
      )}
      <p className="hint">Up to four, from {world.name}. Name someone and they answer; reply to a message and its writer answers. Otherwise {chat.group.picker === 'agent' ? 'the model picks who would answer, with a short request' : 'whoever has been quiet longest answers'}. A diary, a feeling or a plan goes only to the one it belongs to.</p>
      {grouped && (
        <div className="row">
          <label className="field grow"><span>When nobody is named</span>
            <select value={chat.group.picker} onChange={(event) => onChange(setGroup(chat, { picker: event.target.value as Chat['group']['picker'] }, now()))}>
              <option value="agent">The model picks who answers</option>
              <option value="quietest">The quietest answers</option>
            </select>
          </label>
          <label className="field grow"><span>Answers to each message</span>
            <select value={chat.group.answers} onChange={(event) => onChange(setGroup(chat, { answers: event.target.value as Chat['group']['answers'] }, now()))}>
              <option value="one">One</option>
              <option value="several">Whoever has something to say (up to three; each one costs a reply)</option>
            </select>
          </label>
          <label className="field grow"><span>How each reply is sent</span>
            <select value={`${chat.group.layout}-${chat.group.others}`} onChange={(event) => { const [layout, others] = event.target.value.split('-') as [Chat['group']['layout'], Chat['group']['others']]; onChange(setGroup(chat, { layout, others }, now())); }}>
              <option value="b-assistant">B: each speaker's own sheet first (the usual)</option>
              <option value="b-user">B, with the others' lines as yours</option>
              <option value="c-assistant">C: one shared start, the speaker last (cheaper, on trial)</option>
              <option value="c-user">C, with everyone's lines as yours</option>
            </select>
          </label>
        </div>
      )}
    </fieldset>
  );
}
