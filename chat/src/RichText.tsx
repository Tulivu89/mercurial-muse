// The house format, drawn: *narration* in italic grey ink, speech plain, (thoughts) set apart,
// [notes] outside the story. Blank lines between paragraphs are added here, at display time, and
// never asked of the model. A picture written the way shared cards write one, ![](address),
// is shown under the words it came with.
import { Fragment, type ReactNode } from 'react';
import { MediaImage } from '../../kit/src/media';

const TOKEN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\([^()\n]+\)|\[[^[\]\n]+\])/g;
const IMAGE = /!\[([^\]\n]*)\]\(\s*((?:https?:\/\/|data:image\/)[^)\s]+)\s*\)/g;

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
  const out: ReactNode[] = [];
  text.split('\n').forEach((raw, row) => {
    const images = [...raw.matchAll(IMAGE)];
    const line = raw.replace(IMAGE, '').trim();
    if (line) out.push(<p key={`p${row}`}>{inline(line)}</p>);
    images.forEach((image, at) => out.push(<MediaImage key={`i${row}-${at}`} className="picture" src={image[2]!} alt={image[1] ?? ''} animated={/\.(gif|png|webp|avif)(?:[?#]|$)/i.test(image[2]!)} active controls loading="lazy" referrerPolicy="no-referrer" />));
  });
  return <>{out}</>;
}
