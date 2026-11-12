// A sheet: up from the bottom of a phone, a box in the middle of a wide screen. The record picker
// and Settings use it, and anything else that asks one thing and goes away. It is drawn at the
// end of the page, so no column it was opened from can clip it, and Tab stays inside it.
import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

export function Sheet({ title, onClose, closeLabel = 'Close', onKeyDown, children }: {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  onKeyDown?: (event: KeyboardEvent) => void;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!box.current?.contains(document.activeElement)) box.current?.focus(); }, []);

  const keys = (event: KeyboardEvent) => {
    if (event.key === 'Tab' && box.current) {
      const stops = [...box.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      const first = stops[0];
      const last = stops.at(-1);
      if (first && last) {
        if (event.shiftKey && (document.activeElement === first || document.activeElement === box.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
      return;
    }
    if (onKeyDown) { onKeyDown(event); return; }
    if (event.key === 'Escape') { event.preventDefault(); onClose(); }
  };

  return createPortal(
    <div className="sheet-shade" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={box} className="sheet" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onKeyDown={keys}>
        <div className="sheet-head">
          <b className="grow">{title}</b>
          <button type="button" className="btn small" onClick={onClose}>{closeLabel}</button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
