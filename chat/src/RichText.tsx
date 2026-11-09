// The house format, drawn: *narration* in italic grey ink, speech plain, (thoughts) set apart,
// [notes] outside the story. Blank lines between paragraphs are added here, at display time, and
// never asked of the model.
import { Fragment, type ReactNode } from 'react';

const TOKEN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\([^()\n]+\)|\[[^[\]\n]+\])/g;

function inline(text: string): ReactNode[] {
  return text.split(TOKEN).filter(Boolean).map((piece, index) => {
    if (piece.startsWith('**') && piece.endsWith('**') && piece.length > 4) return <strong key={index}>{piece.slice(2, -2)}</strong>;
    if (piece.startsWith('*') && piece.endsWith('*') && piece.length > 2) return <em key={index} className="narration">{piece.slice(1, -1)}</em>;
    if (piece.startsWith('(') && piece.endsWith(')')) return <span key={index} className="thought">{piece}</span>;
    if (piece.startsWith('[') && piece.endsWith(']')) return <span key={index} className="note">{piece}</span>;
    return <Fragment key={index}>{piece}</Fragment>;
  });
}

export function RichText({ text }: { text: string }) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  return <>{lines.map((line, index) => <p key={index}>{inline(line)}</p>)}</>;
}
