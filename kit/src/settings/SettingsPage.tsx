// The site's one Settings page (Nov 21). Every side opens it in place from the header's gear, on
// the tab for that side, and every tab is there to switch to: General (the look and where the site
// opens), Model (the one connection), Chat, Adventure and Studio. The side hands in what it holds
// live (its connection, look, and its own tab's state); other sides' tabs read and write this
// browser's storage, and that side takes the change the next time it opens.
import { useState, type ReactNode } from 'react';
import type { Connection } from '../connection';
import type { LookChoice } from '../look';
import type { Theme } from '../theme';
import type { Side } from '../SiteHeader';
import type { Settings as ChatSettings } from './chat-settings';
import type { AdventurePrefs } from './adventure-prefs';
import type { HelperPrefs } from './helper-prefs';
import { AdventureTab, ChatTab, GeneralTab, ModelTab, StudioTab } from './tabs';
import './settings.css';

export type SettingsTab = 'general' | 'model' | 'chat' | 'adventure' | 'studio';
export const SETTINGS_TABS: { id: SettingsTab; name: string; side?: Side }[] = [
  { id: 'general', name: 'General' },
  { id: 'model', name: 'Model' },
  { id: 'chat', name: 'Chat', side: 'chat' },
  { id: 'adventure', name: 'Adventure', side: 'adventure' },
  { id: 'studio', name: 'Studio', side: 'studio' },
];

export const isSettingsTab = (value: string | null | undefined): value is SettingsTab => SETTINGS_TABS.some((tab) => tab.id === value);
// The tab a side opens on: its own, or General on the front page.
export const tabForSide = (side: Side): SettingsTab => (side === 'overview' ? 'general' : side);

const SIDE_NAMES: Record<Exclude<Side, 'overview'>, string> = { chat: 'Chat', adventure: 'the adventure', studio: 'the Studio' };

export interface SettingsPageProps {
  side: Side;
  // The open tab, when the side keeps it in its address; otherwise the page keeps it.
  tab?: SettingsTab;
  onTab?: (tab: SettingsTab) => void;
  theme: Theme;
  onTheme: (theme: Theme) => void;
  look: LookChoice;
  onLook: (look: LookChoice) => void;
  connection: Connection;
  onConnection: (connection: Connection) => void;
  // Each side's own tab, live, with anything only that side can show (Chat's portraits and files,
  // a game's own settings in play).
  chat?: { settings: ChatSettings; onSettings: (settings: ChatSettings) => void; extra?: ReactNode };
  adventure?: { prefs: AdventurePrefs; onPrefs: (changes: Partial<AdventurePrefs>) => void; extra?: ReactNode };
  studio?: { helper: HelperPrefs; onHelper: (helper: HelperPrefs) => void };
  // Leaves the page, back to where the gear was pressed.
  onDone?: () => void;
  // Inside the adventure's play menu: no page title of its own.
  embedded?: boolean;
  status?: ReactNode;
}

export function SettingsPage(props: SettingsPageProps) {
  const { side, theme, onTheme, look, onLook, connection, onConnection, onDone, embedded = false, status } = props;
  const [ownTab, setOwnTab] = useState<SettingsTab>(props.tab ?? tabForSide(side));
  const tab = props.tab ?? ownTab;
  const pick = (next: SettingsTab) => { setOwnTab(next); props.onTab?.(next); };
  const meta = SETTINGS_TABS.find((entry) => entry.id === tab)!;
  // A tab for another side changes what that side does the next time it opens.
  const elsewhere = meta.side && meta.side !== side ? SIDE_NAMES[meta.side as Exclude<Side, 'overview'>] : null;

  return (
    <div className={`ks${embedded ? ' embedded' : ''}`}>
      {!embedded && (
        <>
          <div className="ks-head">
            <h1 className="ks-title">Settings</h1>
            {onDone && <button type="button" className="ks-btn" onClick={onDone}>Done</button>}
          </div>
          <p className="ks-lede">One page for the whole site. Each part opens it on its own tab.</p>
        </>
      )}
      {status}
      <div className="ks-tabs" role="tablist" aria-label="Settings">
        {SETTINGS_TABS.map((entry) => (
          <button key={entry.id} type="button" role="tab" id={`ks-tab-${entry.id}`} aria-controls="ks-panel" aria-selected={entry.id === tab} className="ks-tab" onClick={() => pick(entry.id)}>
            {entry.name}
          </button>
        ))}
      </div>
      <div className="ks-panel" role="tabpanel" id="ks-panel" aria-labelledby={`ks-tab-${tab}`}>
        {elsewhere && <p className="ks-where">These are {elsewhere}&rsquo;s settings. They are kept in this browser, and {elsewhere} uses them the next time it opens.</p>}
        {tab === 'general' && <GeneralTab theme={theme} onTheme={onTheme} look={look} onLook={onLook} />}
        {tab === 'model' && <ModelTab connection={connection} onConnection={onConnection} />}
        {tab === 'chat' && <ChatTab connection={connection} live={props.chat && { settings: props.chat.settings, onSettings: props.chat.onSettings }} extra={props.chat?.extra} />}
        {tab === 'adventure' && <AdventureTab connection={connection} live={props.adventure && { prefs: props.adventure.prefs, onPrefs: props.adventure.onPrefs }} extra={props.adventure?.extra} />}
        {tab === 'studio' && <StudioTab connection={connection} live={props.studio} />}
      </div>
    </div>
  );
}
