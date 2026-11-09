// The ink drop with a dragon's eye (docs/brand.md). A sketch until the final drawings come in.
export function Drop({ size = 32, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path fillRule="evenodd" fill="var(--seal)" d="M50 6 C56 22 80 40 80 62 C80 80 67 92 50 92 C33 92 20 80 20 62 C20 40 44 22 50 6 Z M38 61 Q50 51 62 61 Q50 71 38 61 Z" />
      <ellipse cx="50" cy="61" rx="2" ry="6" fill="var(--seal)" />
    </svg>
  );
}

export function Wordmark() {
  return <span className="wordmark">ink<em>wyrm</em></span>;
}
