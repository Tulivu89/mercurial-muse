// The doors on a record's page (docs/bids/ui/decision.md). The page is the writing; every other
// job is one row that says what is set there and opens onto it: the day, the rules, the
// adventure's part, chat, and In context now. A door fills a phone and takes the right-hand
// column on a wide screen, where the writing stays beside it.
import { useId, type ReactNode } from 'react';
import type { StoryRecord, World } from '../../core/records/index.js';
import { ChatParts } from './ChatParts';
import { ContextPanel, type Moment } from './ContextPanel';
import { HomeDoor, homeSummary } from './HomeDoor';
import { DayStops, InTheAdventure, LivesAt, adventureSummary, hasAdventure } from './InTheAdventure';
import { RulesPanel, rulesSummary } from './RulesPanel';
import { ScheduleEditor } from './ScheduleEditor';
import type { Door } from './route';

export interface DoorInfo { id: Door; label: string; says: string }

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

// `errata`: what the Errata door's row says, or null where no helper is offered.
export function doorsFor(world: World, record: StoryRecord, moment: Moment, errata: { label: string; says: string } | null = null): DoorInfo[] {
  const doors: DoorInfo[] = [];
  if (record.kind === 'character') doors.push({ id: 'day', label: 'Day', says: adventureSummary(world, record) });
  const rules = rulesSummary(world, record);
  if (rules) doors.push({ id: 'rules', label: 'Rules', says: rules });
  // A scenario with rooms is a home. In a household, a world made for Chat, the adventure has no part.
  if (record.kind === 'scenario') doors.push({ id: 'home', label: 'Home', says: homeSummary(world, record) });
  if (hasAdventure(record) && world.use !== 'household') doors.push({ id: 'adventure', label: 'In the adventure', says: adventureSummary(world, record) });
  if (record.kind === 'character') {
    const greetings = record.greetings.length;
    const examples = record.examples.length;
    doors.push({ id: 'chat', label: 'Chat', says: greetings || examples ? `${count(greetings, 'greeting')} · ${count(examples, 'example chat')}.` : 'No greeting yet. A greeting is the first scene of a chat.' });
  }
  if (errata) doors.push({ id: 'errata', label: errata.label, says: errata.says });
  doors.push({ id: 'context', label: 'In context now', says: moment.says });
  return doors;
}

// The rows, on the record's page.
export function DoorRows({ record, doors, open, onOpen }: { record: StoryRecord; doors: DoorInfo[]; open: Door | null; onOpen: (door: Door) => void }) {
  const id = useId();
  return (
    <nav className="doors" aria-label={`More of ${record.name}`}>
      {doors.map((door) => (
        <button key={door.id} type="button" className={`door${door.id === 'context' ? ' below-wide' : ''}`} aria-current={open === door.id || undefined} aria-labelledby={`${id}-${door.id}-n`} aria-describedby={`${id}-${door.id}-s`} onClick={() => onOpen(door.id)}>
          <span id={`${id}-${door.id}-n`} className="door-label">{door.label}</span>
          <span id={`${id}-${door.id}-s`} className="door-says">{door.says}</span>
          <span className="chev" aria-hidden="true">›</span>
        </button>
      ))}
    </nav>
  );
}

// What is behind a door. In context now stays drawn while another door is open, so the moment set
// up in it is still there on the way back.
export function DoorPane({ world, record, door, moment, backTo, onClose, onChange, onWorld, errata }: {
  world: World;
  record: StoryRecord | undefined;
  door: Door | null;
  moment: Moment;
  // The words on the way back: the record's name, or the world's.
  backTo: string;
  onClose: () => void;
  onChange: (record: StoryRecord) => void;
  onWorld: (world: World) => void;
  // What is behind the Errata door, and its title.
  errata?: { title: string; body: ReactNode };
}) {
  const shown: Door = door && (door === 'context' || record) ? door : 'context';
  const title = shown === 'day' ? 'Day' : shown === 'rules' ? 'Rules' : shown === 'adventure' ? 'In the adventure' : shown === 'home' ? 'Home' : shown === 'chat' ? 'Chat' : shown === 'errata' ? errata?.title ?? 'Errata' : '';
  return (
    <div className="door-pane">
      {shown === 'context'
        ? door === 'context' && <button type="button" className="btn small quiet back below-wide" aria-label={`Back to ${backTo}`} onClick={onClose}>‹ {backTo}</button>
        : (
          <div className="door-head">
            <button type="button" className="btn small quiet back" aria-label={`Back to ${backTo}`} onClick={onClose}>
              <span className="below-wide">‹ {backTo}</span>
              <span className="wide-only">Close</span>
            </button>
            <h2 className="door-title ink-write">{title}<small>{record?.name}</small></h2>
          </div>
        )}
      <div hidden={shown !== 'context'}><ContextPanel world={world} moment={moment} /></div>
      {record && shown === 'day' && (
        <>
          <p className="lede">{adventureSummary(world, record)}</p>
          <LivesAt world={world} record={record} onChange={onChange} />
          <h3 className="sub">The week</h3>
          <ScheduleEditor record={record} world={world} onChange={(schedule) => onChange({ ...record, schedule })} />
          <DayStops world={world} record={record} onChange={onChange} />
        </>
      )}
      {record && shown === 'errata' && errata?.body}
      {record && shown === 'rules' && <RulesPanel world={world} record={record} onChange={onChange} />}
      {record && shown === 'home' && <HomeDoor world={world} record={record} onChange={onChange} onWorld={onWorld} />}
      {record && shown === 'adventure' && <InTheAdventure world={world} record={record} onChange={onChange} onWorld={onWorld} />}
      {record && shown === 'chat' && (
        <>
          <div className="row">
            <a className="btn small" href={`/chat/#/with/${encodeURIComponent(world.id)}/${encodeURIComponent(record.id)}`}>Chat with {record.name}</a>
          </div>
          <ChatParts record={record} update={(patch) => onChange({ ...record, ...patch })} />
        </>
      )}
    </div>
  );
}
