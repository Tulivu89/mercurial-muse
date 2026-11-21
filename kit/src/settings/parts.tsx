// The pieces the Settings page is built from, in its own ks- names (settings.css).
import { useId, type ReactNode } from 'react';

export function Group({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="ks-group" aria-label={title}>
      <h2 className="ks-group-title">{title}</h2>
      {note && <p className="ks-note">{note}</p>}
      {children}
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="ks-field">
      <span className="ks-label">{label}</span>
      {children}
      {hint && <span className="ks-hint">{hint}</span>}
    </label>
  );
}

// A choice of a few, side by side.
export function Choice<T extends string | number>({ label, value, options, onPick, hint }: { label: string; value: T; options: [T, string][]; onPick: (value: T) => void; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="ks-field">
      <span className="ks-label" id={id}>{label}</span>
      <div className="ks-seg" role="group" aria-labelledby={id}>
        {options.map(([option, text]) => <button key={String(option)} type="button" aria-pressed={value === option} onClick={() => onPick(option)}>{text}</button>)}
      </div>
      {hint && <span className="ks-hint">{hint}</span>}
    </div>
  );
}

export function Toggle({ label, hint, on, onToggle }: { label: string; hint?: ReactNode; on: boolean; onToggle: (on: boolean) => void }) {
  const id = useId();
  return (
    <div className="ks-toggle">
      <span className="ks-toggle-text">
        <span className="ks-label" id={id}>{label}</span>
        {hint && <span className="ks-hint">{hint}</span>}
      </span>
      <button type="button" className="ks-switch" role="switch" aria-checked={on} aria-labelledby={id} onClick={() => onToggle(!on)} />
    </div>
  );
}
