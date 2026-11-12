// Chat's part of a character: greetings and example chats. The adventure's narrator never gets
// them. They sit behind the Chat door of a character's page.
import type { ExampleChat, StoryRecord } from '../../core/records/index.js';
import { newId } from '../../kit/src/util';

export function ChatParts({ record, update }: { record: StoryRecord; update: (patch: Partial<StoryRecord>) => void }) {
  const chat = (chatId: string, patch: Partial<ExampleChat>) =>
    update({ examples: record.examples.map((existing) => (existing.id === chatId ? { ...existing, ...patch } : existing)) });
  return (
    <>
      <h3 className="sub">Greetings and example chats</h3>
      <p className="hint">The examples steer a character more than any section does. The adventure's narrator never gets them.</p>
      {record.greetings.map((greeting, index) => (
        <div key={greeting.id} className="card">
          <div className="card-head">
            <span className="label" style={{ flex: 1 }}>Greeting {index + 1}</span>
            <button type="button" className="icon-btn" aria-label={`Remove greeting ${index + 1}`} onClick={() => update({ greetings: record.greetings.filter((existing) => existing.id !== greeting.id) })}>×</button>
          </div>
          <label className="sr" htmlFor={`greeting-${greeting.id}`}>Greeting {index + 1}</label>
          <textarea id={`greeting-${greeting.id}`} maxLength={8000} value={greeting.text} placeholder="The first scene: where they are, what is in their hands, one line in their voice." onChange={(event) => update({ greetings: record.greetings.map((existing) => (existing.id === greeting.id ? { ...existing, text: event.target.value } : existing)) })} />
        </div>
      ))}
      <div className="row">
        <button type="button" className="btn small quiet" onClick={() => update({ greetings: [...record.greetings, { id: newId(), text: '', emotion: '' }] })}>Add a greeting</button>
      </div>

      {record.examples.map((example) => (
        <details key={example.id} className="card">
          <summary style={{ cursor: 'pointer', fontWeight: 700, minHeight: 32 }}>{example.name || 'Example'} <span className="hint">· {example.messages.length} messages</span></summary>
          <div className="row">
            <label className="field grow"><span>Name</span><input value={example.name} maxLength={120} onChange={(event) => chat(example.id, { name: event.target.value })} /></label>
            <label className="field grow"><span>The other speaker</span><input value={example.userName} maxLength={60} onChange={(event) => chat(example.id, { userName: event.target.value })} /></label>
          </div>
          {example.messages.map((message, index) => (
            <div key={index} className="message">
              <label className="sr" htmlFor={`m-${example.id}-${index}-who`}>Who speaks</label>
              <select id={`m-${example.id}-${index}-who`} className="input" value={message.fromCharacter ? 'character' : 'user'} onChange={(event) => chat(example.id, { messages: example.messages.map((existing, at) => (at === index ? { ...existing, fromCharacter: event.target.value === 'character' } : existing)) })}>
                <option value="user">{example.userName || 'User'}</option>
                <option value="character">{record.name}</option>
              </select>
              <label className="sr" htmlFor={`m-${example.id}-${index}-text`}>Message {index + 1}</label>
              <textarea id={`m-${example.id}-${index}-text`} className="input" style={{ minHeight: 64 }} maxLength={8000} value={message.text} onChange={(event) => chat(example.id, { messages: example.messages.map((existing, at) => (at === index ? { ...existing, text: event.target.value } : existing)) })} />
              <button type="button" className="icon-btn" aria-label={`Remove message ${index + 1}`} onClick={() => chat(example.id, { messages: example.messages.filter((_, at) => at !== index) })}>×</button>
            </div>
          ))}
          <div className="row">
            <button type="button" className="btn small quiet" onClick={() => chat(example.id, { messages: [...example.messages, { fromCharacter: example.messages.at(-1)?.fromCharacter === false, text: '', emotion: '' }] })}>Add a message</button>
            <button type="button" className="btn small quiet" onClick={() => update({ examples: record.examples.filter((existing) => existing.id !== example.id) })}>Remove this example</button>
          </div>
        </details>
      ))}
      <div className="row">
        <button type="button" className="btn small quiet" onClick={() => update({ examples: [...record.examples, { id: newId(), name: 'New example', userName: 'User', messages: [] }] })}>Add an example chat</button>
      </div>
    </>
  );
}
