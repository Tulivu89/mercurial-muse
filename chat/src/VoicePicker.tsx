// A character's reading voice, from the voices this device has (kit/src/speech.ts).
import { useEffect, useState } from 'react';
import { canSpeak, deviceVoices, setVoiceFor, speak, voiceFor } from '../../kit/src/speech';

export function VoicePicker({ owner, charName }: { owner: string; charName: string }) {
  const [voices, setVoices] = useState(deviceVoices);
  const [voice, setVoice] = useState(() => voiceFor(owner));
  useEffect(() => {
    if (!canSpeak()) return;
    // Voices often arrive a moment after the page opens.
    const load = () => setVoices(deviceVoices());
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);
  if (!canSpeak()) return null;
  return (
    <section className="block" aria-label="Voice">
      <div className="block-head"><span>{charName}'s voice</span></div>
      <div className="row">
        <label className="field grow"><span>Read aloud with</span>
          <select value={voice} onChange={(event) => { setVoice(event.target.value); setVoiceFor(owner, event.target.value); }}>
            <option value="">This device's usual voice</option>
            {voices.map((entry) => <option key={entry.name} value={entry.name}>{entry.name} ({entry.lang})</option>)}
          </select>
        </label>
        <button type="button" className="btn small quiet" style={{ alignSelf: 'flex-end' }} onClick={() => speak(`This is how ${charName} sounds.`, voice)}>Try it</button>
      </div>
      <p className="hint">The voices come with this device and cost nothing. Each phone and browser has its own; the choice is kept in this browser.</p>
    </section>
  );
}
