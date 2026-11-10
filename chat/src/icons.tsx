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
