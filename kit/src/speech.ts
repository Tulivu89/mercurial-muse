// Reading aloud with the voices the device already has (the browser's speech synthesis): free,
// and on every phone. A character's voice is remembered in this browser by "worldId:characterId".
const KEY = 'inkwyrm.voices';

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

export function deviceVoices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  return window.speechSynthesis.getVoices().slice().sort((a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name));
}

function readVoices(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, string>; } catch { return {}; }
}
export const voiceFor = (owner: string) => readVoices()[owner] ?? '';
export function setVoiceFor(owner: string, voice: string) {
  const all = readVoices();
  if (voice) all[owner] = voice; else delete all[owner];
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* lasts this visit */ }
}

// Says the text in the named voice (the device's default when it has none by that name). A new
// reading stops the one before.
export function speak(text: string, voiceName = '', onEnd?: () => void): boolean {
  if (!canSpeak() || !text.trim()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = synth.getVoices().find((entry) => entry.name === voiceName);
  if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  synth.speak(utterance);
  return true;
}
export const stopSpeaking = () => { if (canSpeak()) window.speechSynthesis.cancel(); };
