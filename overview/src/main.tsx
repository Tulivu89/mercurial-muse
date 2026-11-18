import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { AgeGate } from '../../kit/src/AgeGate';
import { resortFrom } from '../../kit/src/included';
import resort from '../../content/dragons-resort/world.json';
import { displayPortraits, listChats, listLives } from '../../chat/src/store';
import { listSaves } from '../../adventure/src/ui/storage';
import { authoringCounts } from '../../studio/src/author/store';
import { listWorlds } from '../../kit/src/worlds';
import { App, type Readers } from './App';
import '../../kit/src/wet-ink.css';
import './overview.css';

// The stores the Overview reads, each the side's own reader. A save is summarised, never opened.
const readers: Readers = {
  worlds: listWorlds,
  chats: listChats,
  portraits: displayPortraits,
  lives: listLives,
  saves: async () => (await listSaves()).map(({ id, name, moduleName, place, stamp, turns, updatedAt }) => ({ id, name, moduleName, place, stamp, turns, updatedAt })),
  authoring: authoringCounts,
  house: () => resortFrom(resort, 0),
};

class Crash extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="overview">
        <h1>The front page stopped</h1>
        <p className="status bad">{error.message}</p>
        <p className="hint">Everything you've made is still in this browser. <a href="/chat/">Chat</a>, <a href="/studio/">the Studio</a> and <a href="/">the Adventure</a> each open on their own.</p>
      </main>
    );
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element.');
createRoot(root).render(<StrictMode><Crash><AgeGate><App readers={readers} /></AgeGate></Crash></StrictMode>);
