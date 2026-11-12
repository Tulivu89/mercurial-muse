// Inkwyrm's marks (docs/brand.md › Marks): ink drops in wet lacquer, one for the site and one for
// each side. Black lacquer by day and bone at night, from the --mk-* tokens in wet-ink.css.
//
// The drawings are put in the page once, the first time a mark is drawn, and each mark is a
// <use> of them. `land` drops a mark in: it falls, lands, and its shine comes on as it settles.
import { INK_MARK_DEFS } from './ink-marks';

export type MarkName = 'main' | 'nib' | 'bubble' | 'dragon';
export const MARK_NAMES: Record<MarkName, string> = { main: 'Inkwyrm', nib: 'Studio', bubble: 'Chat', dragon: 'Adventure' };

const DEFS_ID = 'inkwyrm-marks';

function ensureDefs() {
  if (typeof document === 'undefined' || document.getElementById(DEFS_ID)) return;
  const holder = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  holder.setAttribute('id', DEFS_ID);
  holder.setAttribute('width', '0');
  holder.setAttribute('height', '0');
  holder.setAttribute('aria-hidden', 'true');
  holder.setAttribute('focusable', 'false');
  holder.style.position = 'absolute';
  holder.innerHTML = INK_MARK_DEFS;
  document.body.prepend(holder);
}

export function InkMark({ name = 'main', size = 32, title, land = false, className = '' }: { name?: MarkName; size?: number; title?: string; land?: boolean; className?: string }) {
  ensureDefs();
  return (
    <svg
      className={`mk${land ? ' land' : ''}${className ? ` ${className}` : ''}`}
      width={size} height={size} viewBox="0 0 500 500"
      role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}
    >
      <use href={`#mk-${name}`} />
    </svg>
  );
}

// The site's mark, or Chat's bubble. Kept for the places that drew the earlier sketch.
export function Drop({ size = 32, title, chat = false, land = false }: { size?: number; title?: string; chat?: boolean; land?: boolean }) {
  return <InkMark name={chat ? 'bubble' : 'main'} size={size} title={title} land={land} />;
}
