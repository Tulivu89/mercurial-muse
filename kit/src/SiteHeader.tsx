// The one header of the site (docs/bids/ui/decision.md): the side's own mark, the wordmark when
// there is room, the three sides with the current one underlined in seal, and a gear for
// Settings. The adventure draws it on its start screen and never while a story is being played.
import type { MouseEvent } from 'react';
import { InkMark, type MarkName } from './Mark';
import './site-header.css';

export type Side = 'adventure' | 'chat' | 'studio';

const SIDES: { id: Side; name: string; href: string; mark: MarkName }[] = [
  { id: 'adventure', name: 'Adventure', href: '/', mark: 'dragon' },
  { id: 'chat', name: 'Chat', href: '/chat/', mark: 'bubble' },
  { id: 'studio', name: 'Studio', href: '/studio/', mark: 'nib' },
];

export function SiteHeader({ side, homeLabel, onHome, onSettings, settingsHref }: {
  side: Side;
  // What the mark leads to, said for a screen reader: "Inkwyrm Studio, your worlds".
  homeLabel?: string;
  // The side's own first page, when it can go there without loading the site again.
  onHome?: () => void;
  // Settings: a sheet the side opens, or a place on its page.
  onSettings?: () => void;
  settingsHref?: string;
}) {
  const here = SIDES.find((entry) => entry.id === side)!;
  const home = (event: MouseEvent) => { if (!onHome) return; event.preventDefault(); onHome(); };
  const gear = (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="6.4" />
      <circle cx="12" cy="12" r="2.4" />
      <path d="M12 2.6v3M12 18.4v3M2.6 12h3M18.4 12h3M5.4 5.4l2.1 2.1M16.5 16.5l2.1 2.1M5.4 18.6l2.1-2.1M16.5 7.5l2.1-2.1" />
    </svg>
  );
  return (
    <header className="site-bar">
      <a className="site-brand" href={here.href} onClick={home} aria-label={homeLabel ?? `Inkwyrm ${here.name}`}>
        <InkMark name={here.mark} size={32} land />
        <span className="site-wordmark" aria-hidden="true">ink<em>wyrm</em></span>
      </a>
      <nav className="site-switch" aria-label="The sides of Inkwyrm">
        {SIDES.map((entry) => (
          <a key={entry.id} href={entry.href} aria-current={entry.id === side ? 'page' : undefined} onClick={entry.id === side ? home : undefined}>{entry.name}</a>
        ))}
      </nav>
      {settingsHref
        ? <a className="site-gear" href={settingsHref} aria-label="Settings">{gear}</a>
        : onSettings && <button type="button" className="site-gear" aria-label="Settings" aria-haspopup="dialog" onClick={onSettings}>{gear}</button>}
    </header>
  );
}
