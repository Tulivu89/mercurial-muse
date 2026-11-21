// The one header of the site (docs/bids/ui/decision.md, tidied Nov 21): the site's own mark and
// its name on every page and at every width, the four parts of the site with the current one
// underlined in seal, and a gear for Settings on every side. A side's own mark appears once, on its
// own first page (PageHead.tsx), never beside the site's. The adventure draws this on its start
// screen and never while a story is being played.
import type { MouseEvent } from 'react';
import { InkMark } from './Mark';
import { ADDRESS } from './addresses';
import './site-header.css';

export type Side = 'adventure' | 'chat' | 'studio' | 'overview';

export const SIDES: { id: Side; name: string; href: string }[] = [
  { id: 'overview', name: 'Overview', href: ADDRESS.front },
  { id: 'chat', name: 'Chat', href: ADDRESS.chat },
  { id: 'adventure', name: 'Adventure', href: ADDRESS.adventure },
  { id: 'studio', name: 'Studio', href: ADDRESS.studio },
];

const plainClick = (event: MouseEvent) => !(event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0);

export function SiteHeader({ side, homeLabel, onHome, onSettings, settingsHref, onOverview, settingsOpen = false }: {
  side: Side;
  // Description of the current side's first page, for its link's title.
  homeLabel?: string;
  // The side's own first page, when it can go there without loading the site again.
  onHome?: () => void;
  // Settings: the side opens the settings page in place, or links to it.
  onSettings?: () => void;
  settingsHref?: string;
  // Work to finish (a save in flight) before leaving for the front page.
  onOverview?: () => void | Promise<void>;
  // The settings page is what's showing, so the gear reads as pressed.
  settingsOpen?: boolean;
}) {
  const home = (event: MouseEvent) => { if (!onHome || !plainClick(event)) return; event.preventDefault(); onHome(); };
  const front = onOverview ? async (event: MouseEvent) => {
    if (!plainClick(event)) return;
    event.preventDefault();
    try { await onOverview(); window.location.assign(ADDRESS.front); } catch { /* the owning editor reports the save failure */ }
  } : undefined;
  const gear = (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="6.4" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3M5.4 5.4l2.1 2.1M16.5 16.5l2.1 2.1M5.4 18.6l2.1-2.1M16.5 7.5l2.1-2.1" />
    </svg>
  );
  return (
    <header className="site-bar">
      <a className="site-brand" href={ADDRESS.front} aria-label="Inkwyrm, the front page" onClick={side === 'overview' ? undefined : front}>
        <InkMark name="main" size={30} />
        <span className="site-wordmark" aria-hidden="true">ink<em>wyrm</em></span>
      </a>
      <nav className="site-switch" aria-label="Inkwyrm">
        {SIDES.map((entry) => {
          const current = entry.id === side && !settingsOpen;
          return (
            <a key={entry.id} href={entry.href} title={entry.id === side ? homeLabel : undefined} aria-current={current ? 'page' : undefined}
              onClick={entry.id === side ? home : entry.id === 'overview' ? front : undefined}>{entry.name}</a>
          );
        })}
      </nav>
      {onSettings
        ? <button type="button" className="site-gear" aria-label="Settings" aria-pressed={settingsOpen} title="Settings" onClick={onSettings}>{gear}</button>
        : <a className="site-gear" href={settingsHref ?? ADDRESS.settings} aria-label="Settings" aria-current={settingsOpen ? 'page' : undefined} title="Settings">{gear}</a>}
    </header>
  );
}
