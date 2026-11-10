// A character's face: the portrait for an emotion, or what stands in for it (CR-PLAN §6.5): the
// nearest filled neighbour, neutral, the avatar, and with no pictures at all their initial.
import { resolvePortrait } from '../../core/chat/index.js';
import type { PortraitSet } from './store';

// `size` 0 fills the width it is given, for the large portrait.
export function Portrait({ name, emotion = 'neutral', set, size = 44 }: { name: string; emotion?: string; set?: PortraitSet; size?: number }) {
  const slot = resolvePortrait(emotion, Object.keys(set ?? {}));
  const data = slot ? set?.[slot] : undefined;
  return (
    <span className={`portrait${size ? '' : ' large'}`} style={size ? { width: size, height: size, fontSize: Math.round(size * 0.42) } : undefined} data-emotion={emotion} data-slot={slot ?? 'initial'} aria-hidden="true">
      {data ? <img src={data} alt="" /> : name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}
