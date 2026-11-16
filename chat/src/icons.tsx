// Line icons, drawn at the size of the text beside them. Each button that uses one carries its
// own label for screen readers.
import type { ReactNode } from 'react';

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}
type Props = { size?: number };
export const BackIcon = (props: Props) => <Icon {...props}><path d="M15 18l-6-6 6-6" /></Icon>;
export const NextIcon = (props: Props) => <Icon {...props}><path d="M9 18l6-6-6-6" /></Icon>;
export const SendIcon = (props: Props) => <Icon {...props}><path d="M12 19V5M5 12l7-7 7 7" /></Icon>;
export const StopIcon = (props: Props) => <Icon {...props}><rect x="7" y="7" width="10" height="10" rx="1.5" fill="currentColor" /></Icon>;
export const AgainIcon = (props: Props) => <Icon {...props}><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></Icon>;
export const ContinueIcon = (props: Props) => <Icon {...props}><path d="M5 12h12M13 6l6 6-6 6" /></Icon>;
export const EditIcon = (props: Props) => <Icon {...props}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></Icon>;
export const CopyIcon = (props: Props) => <Icon {...props}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></Icon>;
export const KeepIcon = (props: Props) => <Icon {...props}><path d="M6 4h12v16l-6-4-6 4z" /></Icon>;
export const BinIcon = (props: Props) => <Icon {...props}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></Icon>;
export const CloseIcon = (props: Props) => <Icon {...props}><path d="M18 6L6 18M6 6l12 12" /></Icon>;
export const CheckIcon = (props: Props) => <Icon {...props}><path d="M5 12l5 5 9-10" /></Icon>;
// Memory: a brain, drawn as two lobes.
export const BrainIcon = (props: Props) => <Icon {...props}><path d="M12 5.5v13M12 7a3 3 0 0 0-5.6-1.5A3 3 0 0 0 4.5 11a3.2 3.2 0 0 0 1 5.6A3 3 0 0 0 12 17M12 7a3 3 0 0 1 5.6-1.5A3 3 0 0 1 19.5 11a3.2 3.2 0 0 1-1 5.6A3 3 0 0 1 12 17M8 11.5h1.5M14.5 11.5H16" /></Icon>;
// A note: square brackets with a line between them.
export const NoteIcon = (props: Props) => <Icon {...props}><path d="M8 5H5v14h3M16 5h3v14h-3M10 12h4" /></Icon>;
export const HouseIcon = (props: Props) => <Icon {...props}><path d="M4 11l8-6 8 6M6 10v9h12v-9M10 19v-5h4v5" /></Icon>;
export const MoreIcon = (props: Props) => <Icon {...props}><circle cx="6" cy="12" r="1.2" fill="currentColor" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /><circle cx="18" cy="12" r="1.2" fill="currentColor" /></Icon>;
export const PinIcon = (props: Props) => <Icon {...props}><path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7" /></Icon>;
export const PhotoIcon = (props: Props) => <Icon {...props}><rect x="3.5" y="6" width="17" height="13" rx="2" /><circle cx="12" cy="12.5" r="3.2" /><path d="M8.5 6l1.2-2h4.6l1.2 2" /></Icon>;
export const CommentIcon = (props: Props) => <Icon {...props}><path d="M5 5h14v10H10l-4 4v-4H5z" /></Icon>;
