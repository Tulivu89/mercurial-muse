// What only Chat can show on the site's Settings page (kit/src/settings/SettingsPage.tsx), under
// its Chat tab: each character's portraits, and Chat's files. The rest of Chat's settings are the
// tab's own, shown on every side.
import { useState, type ChangeEvent } from 'react';
import { IMAGE_TYPES, MediaImage, animationSlot, posterSlot } from '../../kit/src/media';
import { AVATAR_SLOT, EMOTIONS, SETTINGS_EXPORT_FORMAT, profileFor, resolvePortrait, samplersFor } from '../../core/chat/index.js';
import { downloadJson } from '../../kit/src/util';
import type { Connection } from '../../kit/src/connection';
import { Group } from '../../kit/src/settings/parts';
import { contextTokensFor, type Settings } from '../../kit/src/settings/chat-settings';
import { castOf } from './Home';
import { portraitOwner, type PortraitSet } from './store';
import type { World } from '../../core/records/index.js';

export function ChatExtras({ connection, settings, worlds, portraits, onPortrait, onBackup, onRestore, onImportChat }: {
  connection: Connection;
  settings: Settings;
  worlds: World[];
  portraits: Record<string, PortraitSet>;
  onPortrait: (owner: string, slot: string, file: File | null) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  onImportChat: (file: File) => void;
}) {
  const cast = castOf(worlds);
  const [owner, setOwner] = useState(cast[0] ? portraitOwner(cast[0].world.id, cast[0].record.id) : '');
  const set = portraits[owner] ?? {};
  const filled = Object.keys(set);
  const file = (handler: (file: File) => void) => (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    event.target.value = '';
    if (picked) handler(picked);
  };

  return (
    <>
      <Group title="Portraits" note="An avatar and up to 24 emotions. A partial set works: an empty slot shows its nearest filled neighbour, then neutral, then the avatar.">
        {cast.length === 0 ? <p className="ks-note">No characters yet.</p> : (
          <>
            <label className="ks-field"><span className="ks-label">Character</span>
              <select value={owner} onChange={(event) => setOwner(event.target.value)}>
                {cast.map(({ world, record }) => <option key={portraitOwner(world.id, record.id)} value={portraitOwner(world.id, record.id)}>{record.name} ({world.name})</option>)}
              </select>
            </label>
            <div className="slots">
              {[AVATAR_SLOT, ...EMOTIONS].map((slot) => {
                const stand = slot === AVATAR_SLOT ? (set[slot] ? slot : null) : resolvePortrait(slot, filled);
                const data = stand ? set[stand] : undefined;
                return (
                  <div key={slot} className={`slot${set[slot] ? ' filled' : ''}`}>
                    <span className="file-btn slot-face">
                      {data ? <MediaImage src={data} poster={stand ? set[posterSlot(stand)] : undefined} animated={stand ? set[animationSlot(stand)] === 'true' : false} alt="" /> : <span aria-hidden="true">+</span>}
                      <input type="file" accept={IMAGE_TYPES} aria-label={`Upload ${slot}`} onChange={file((picked) => onPortrait(owner, slot, picked))} />
                    </span>
                    <b>{slot}</b>
                    {set[slot]
                      ? <button type="button" className="link danger" onClick={() => onPortrait(owner, slot, null)} aria-label={`Remove ${slot}`}>Remove</button>
                      : <span className="hint">{stand && stand !== slot ? `shows ${stand}` : 'empty'}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Group>

      <Group title="Files" note="Chats, worlds and portraits are kept in this browser only. Back up everything includes the Chat collection, original images, chats, lives and worlds. Adventure saves and Studio authoring talks have their own exports; restoring a backup replaces anything with the same id.">
        <div className="ks-row">
          <button type="button" className="ks-btn" onClick={onBackup}>Back up everything</button>
          <span className="ks-btn quiet ks-file">Restore a backup<input type="file" accept="application/json,.json" aria-label="Restore a backup" onChange={file(onRestore)} /></span>
          <span className="ks-btn quiet ks-file">Import a chat<input type="file" accept="application/json,.json,.jsonl" aria-label="Import a chat" title="A chat saved here, or a SillyTavern chat file (.jsonl) with a character you have" onChange={file(onImportChat)} /></span>
          <button type="button" className="ks-btn quiet" onClick={() => downloadJson('chat-settings.json', {
            format: SETTINGS_EXPORT_FORMAT, exportedAt: Date.now(),
            request: { provider: connection.provider, model: connection.model, mode: connection.mode, format: connection.format, profile: profileFor(connection.model), contextTokens: contextTokensFor(settings, connection), replyTokens: settings.replyTokens, samplers: samplersFor(connection.model, settings.temperature) },
            chat: settings,
          })}>Save settings</button>
        </div>
        <p className="ks-note">Save settings writes the model, context size and samplers in a file, never your key. A chat&rsquo;s own Save for a test, under What was sent, puts them in one file with the chat and what it was sent.</p>
      </Group>
    </>
  );
}
