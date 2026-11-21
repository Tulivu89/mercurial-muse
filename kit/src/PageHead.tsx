// The top of a side's first page, the same on every side (Nov 21): the side's own mark, once, its
// name as an eyebrow, the page's title and a line under it, and the page's own buttons. The site's
// mark lives in the header; this is the only place a side's mark is drawn.
import type { ReactNode } from 'react';
import { InkMark, type MarkName } from './Mark';
import './page-head.css';

export function PageHead({ mark, eyebrow, title, lede, actions, children }: {
  mark?: MarkName;
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  // Buttons for the page's main jobs, beside the title on a wide screen and under it on a phone.
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="page-head">
      {mark && <InkMark name={mark} size={52} land className="page-mark" />}
      <div className="page-head-text">
        <p className="page-eyebrow">{eyebrow}</p>
        <h1 className="page-title ink-write">{title}</h1>
        {lede && <p className="page-lede">{lede}</p>}
        {children}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
