import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AgeGate } from '../../kit/src/AgeGate';
import { App } from './App';
import '../../kit/src/wet-ink.css';
import './chat.css';

// A crash while drawing would otherwise leave a blank page; show what broke instead.
class Crash extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="home">
        <h1>Chat stopped</h1>
        <p className="status bad">{error.message}</p>
        <p className="hint">Your chats are saved in this browser. Reloading usually brings everything back.</p>
        <button type="button" className="btn primary" onClick={() => window.location.reload()}>Reload</button>
      </main>
    );
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element.');
createRoot(root).render(<StrictMode><Crash><AgeGate><App /></AgeGate></Crash></StrictMode>);
