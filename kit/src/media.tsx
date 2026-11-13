// Keep uploaded originals, including GIF/APNG/WebP animation. Canvas is used only for a
// derived poster. Existing portrait data URLs remain readable; no database is renamed.
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ImgHTMLAttributes } from 'react';
import { imageDataUrl } from './util';
import { useCollection } from './collection';

export const IMAGE_TYPES = 'image/png,image/apng,.apng,image/jpeg,image/webp,image/gif,image/avif';
export interface ImageAsset {
  data: string;
  poster: string;
  width: number;
  height: number;
  animated: boolean;
}
export function animatedBytes(bytes: Uint8Array, type: string): boolean {
  if (type === 'image/gif') return true;
  const name = (at: number, length: number) => String.fromCharCode(...bytes.slice(at, at + length));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (type === 'image/png')
    for (let at = 8; at + 12 <= bytes.length; ) {
      const size = view.getUint32(at);
      if (name(at + 4, 4) === 'acTL') return true;
      if (size > bytes.length - at - 12) break;
      at += size + 12;
    }
  if (type === 'image/webp')
    for (let at = 12; at + 8 <= bytes.length; ) {
      const size = view.getUint32(at + 4, true);
      if (name(at, 4) === 'ANIM') return true;
      if (size > bytes.length - at - 8) break;
      at += 8 + size + (size % 2);
    }
  return type === 'image/avif' && name(0, Math.min(bytes.length, 64)).includes('avis');
}
export async function readImageAsset(file: File, max = 512): Promise<ImageAsset> {
  if (file.size > 32 * 1024 * 1024)
    throw new Error('This image is larger than 32 MB. Choose a smaller original.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const signature = String.fromCharCode(...bytes.slice(0, 64));
  const type = signature.startsWith('GIF8')
    ? 'image/gif'
    : bytes[0] === 137 && signature.slice(1, 4) === 'PNG'
      ? 'image/png'
      : signature.startsWith('RIFF') && signature.slice(8, 12) === 'WEBP'
        ? 'image/webp'
        : bytes[0] === 255 && bytes[1] === 216
          ? 'image/jpeg'
          : signature.slice(4, 8) === 'ftyp' && /avif|avis/.test(signature)
            ? 'image/avif'
            : null;
  if (!type)
    throw new Error(
      'Choose a PNG, JPEG, GIF, WebP or AVIF image. Animated GIF, APNG and WebP originals are preserved.',
    );
  const original = new Blob([file], { type });
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.readAsDataURL(original);
  });
  const bitmap = await createImageBitmap(original);
  const { width, height } = bitmap;
  bitmap.close();
  const poster = await imageDataUrl(original, max);
  return { data, poster, width, height, animated: animatedBytes(bytes, type) };
}
export async function readImageDataUrl(data: string, max = 640): Promise<ImageAsset> {
  if (!data.startsWith('data:image/')) throw new Error('Not an embedded image.');
  const blob = await (await fetch(data)).blob();
  return readImageAsset(new File([blob], 'imported-image', { type: blob.type }), max);
}
function animatedSource(src: string): boolean {
  if (/^data:image\/gif[;,]/i.test(src) || /\.(gif|apng)(?:[?#]|$)/i.test(src)) return true;
  const match = /^data:(image\/(?:png|apng|webp|avif));base64,(.*)$/is.exec(src);
  if (!match) return false;
  try {
    const bytes = Uint8Array.from(atob(match[2]!), (c) => c.charCodeAt(0));
    return animatedBytes(bytes, match[1] === 'image/apng' ? 'image/png' : match[1]!);
  } catch {
    return false;
  }
}
export const posterSlot = (slot: string) => `poster:${slot}`;
export const animationSlot = (slot: string) => `animated:${slot}`;
export const portraitSource = (key: string, revision = '') =>
  `inkwyrm-portrait:${encodeURIComponent(key)}${revision ? `?v=${encodeURIComponent(revision)}` : ''}`;
const originals = new Map<string, Promise<string>>();
function readOriginal(source: string): Promise<string> {
  if (!source.startsWith('inkwyrm-portrait:')) return Promise.resolve(source);
  const cached = originals.get(source);
  if (cached) return cached;
  const promise = new Promise<string>((resolve, reject) => {
    const request = indexedDB.open('inkwyrm-chat', 2);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('portraits')) {
        db.close();
        reject(new Error('Image unavailable.'));
        return;
      }
      const read = db
        .transaction('portraits', 'readonly')
        .objectStore('portraits')
        .get(decodeURIComponent(source.slice('inkwyrm-portrait:'.length).split('?')[0]!));
      read.onsuccess = () => {
        db.close();
        typeof read.result?.data === 'string'
          ? resolve(read.result.data)
          : reject(new Error('Image unavailable.'));
      };
      read.onerror = () => {
        db.close();
        reject(read.error);
      };
    };
    request.onerror = () => reject(request.error);
  });
  originals.set(source, promise);
  if (originals.size > 8) originals.delete(originals.keys().next().value!);
  void promise.catch(() => originals.delete(source));
  return promise;
}
export const forgetOriginal = (owner: string, slot: string) => {
  const prefix = portraitSource(`${owner}:${slot}`);
  for (const key of originals.keys())
    if (key === prefix || key.startsWith(prefix + '?')) originals.delete(key);
};

export function MediaImage({
  src,
  poster,
  animated = false,
  active = false,
  play,
  controls = false,
  frameClassName = '',
  frameStyle,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
  poster?: string;
  animated?: boolean;
  active?: boolean;
  play?: boolean;
  controls?: boolean;
  frameClassName?: string;
  frameStyle?: CSSProperties;
}) {
  const { display } = useCollection();
  const [hover, setHover] = useState(false);
  const [manual, setManual] = useState<boolean | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [derivedPoster, setDerivedPoster] = useState<string | undefined>();
  const [visible, setVisible] = useState(true);
  const [foreground, setForeground] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  );
  const [reduced, setReduced] = useState(
    () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const image = useRef<HTMLSpanElement>(null);
  const moving = useMemo(() => animated || (!poster && animatedSource(src)), [src, animated, poster]);
  useEffect(() => {
    let live = true;
    setDerivedPoster(undefined);
    if (moving && !poster && src.startsWith('data:image/'))
      void readImageDataUrl(src).then(
        (image) => {
          if (live) setDerivedPoster(image.poster);
        },
        () => undefined,
      );
    return () => {
      live = false;
    };
  }, [src, moving, poster]);
  const still = poster ?? derivedPoster;
  useEffect(() => {
    const show = () => setForeground(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', show);
    const query = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    const change = () => setReduced(query?.matches ?? false);
    query?.addEventListener('change', change);
    const observer =
      typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(([entry]) => setVisible(entry!.isIntersecting))
        : null;
    if (image.current) observer?.observe(image.current);
    return () => {
      document.removeEventListener('visibilitychange', show);
      query?.removeEventListener('change', change);
      observer?.disconnect();
    };
  }, []);
  const running =
    visible &&
    foreground &&
    (manual ??
      play ??
      (!reduced && display.motion !== 'still' && (display.motion === 'visible' || active || hover)));
  useEffect(() => {
    setManual(null);
  }, [src, display.motion]);
  const wantsOriginal =
    visible && foreground && (moving ? running : active || hover || display.motion === 'visible' || !poster);
  useEffect(() => {
    let live = true;
    setOriginal(null);
    if (wantsOriginal && src.startsWith('inkwyrm-portrait:'))
      void readOriginal(src).then(
        (data) => {
          if (live) setOriginal(data);
        },
        () => undefined,
      );
    return () => {
      live = false;
    };
  }, [src, wantsOriginal, poster]);
  const displayed =
    moving && !running ? still : (original ?? (src.startsWith('inkwyrm-portrait:') ? still : src));
  return (
    <span
      ref={image}
      className={`media-image ${frameClassName}`}
      style={frameStyle}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      {displayed ? (
        <img {...props} src={displayed} loading={props.loading ?? 'lazy'} decoding="async" />
      ) : (
        <span className="media-poster" aria-label={props.alt || 'Animated image'}>
          Animated image
        </span>
      )}
      {controls && moving && (
        <button
          type="button"
          className="media-toggle"
          aria-pressed={running}
          aria-label={running ? 'Pause animation' : 'Play animation'}
          onClick={() => setManual(!running)}
        >
          {running ? 'Pause' : 'Play'}
        </button>
      )}
    </span>
  );
}
