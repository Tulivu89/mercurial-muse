import { useEffect, useState } from 'react';
import { splitKeys } from './util';

// A name can't be empty, but you can clear it to retype: the record keeps its last name until
// the field has something in it again.
export function NameField({ label, value, onChange, max = 120, hideLabel = false, className = 'field' }: { label: string; value: string; onChange: (value: string) => void; max?: number; hideLabel?: boolean; className?: string }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className={className}>
      <span className={hideLabel ? 'sr' : undefined}>{label}</span>
      <input
        className={hideLabel ? 'input' : undefined}
        value={draft}
        maxLength={max}
        onChange={(event) => { setDraft(event.target.value); if (event.target.value.trim()) onChange(event.target.value); }}
        onBlur={() => { if (!draft.trim()) setDraft(value); }}
      />
    </label>
  );
}

// Keys typed as a comma list. Saved when you leave the field or press Enter, so a trailing comma
// doesn't vanish while you type.
export function KeysField({ label, value, onChange, placeholder }: { label: string; value: string[]; onChange: (value: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState(value.join(', '));
  useEffect(() => setDraft(value.join(', ')), [value]);
  const commit = () => {
    const keys = splitKeys(draft).slice(0, 40).map((key) => key.slice(0, 60));
    if (keys.join('|') !== value.join('|')) onChange(keys);
  };
  return (
    <label className="field">
      <span>{label}</span>
      <input
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commit(); } }}
      />
    </label>
  );
}
