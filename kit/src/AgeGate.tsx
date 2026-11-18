// Asked once per browser, on whichever side a visitor opens first. Until it is answered, nothing
// of the side is drawn.
import { useState, type ReactNode } from 'react';
import { isAdult, setAdult } from './age';
import './age-gate.css';

export function AgeGate({ children }: { children: ReactNode }) {
  const [adult, setAdultState] = useState(isAdult);
  const [turnedAway, setTurnedAway] = useState(false);
  if (adult) return <>{children}</>;
  return (
    <main className="age-gate">
      <section className="age-card" aria-labelledby="age-title">
        <h1 id="age-title">Inkwyrm is for adults</h1>
        {turnedAway ? (
          <p>Then this isn't the place yet. Come back when you're 18.</p>
        ) : (
          <>
            <p>The stories and characters here can hold sex, violence and dark themes, and you decide how far each one goes.</p>
            <p>Are you 18 or older?</p>
            <div className="age-row">
              <button type="button" className="age-yes" onClick={() => { setAdult(); setAdultState(true); }}>I'm 18 or older</button>
              <button type="button" className="age-no" onClick={() => setTurnedAway(true)}>I'm not</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
