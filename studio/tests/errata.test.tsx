// The Errata door on a record's page (W2), with a canned model that answers by what it's asked.
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Message } from '../../core/narration/formats.js';
import { newRecord, newWorld, putRecord, type World } from '../../core/records/index.js';
import { AuthorProvider, authorFor } from '../src/author/context';
import type { Generate } from '../src/author/run';
import { forgetDraftsInMemory } from '../src/author/store';
import { WorldView } from '../src/WorldView';
import { initialConnection } from '../../kit/src/connection';

vi.mock('../src/go', () => ({ go: vi.fn() }));

function world(): World {
  let n = 0;
  const dee = { ...newRecord('character', 'dee', 'Dee Harlow', () => `id-${++n}`), line: '' };
  return putRecord({ ...newWorld('w', 'Low Water', 1), genre: 'Coastal crime' }, dee, 2);
}

const sent: Message[][] = [];
const canned: Generate = async (messages) => {
  sent.push(messages);
  const system = messages[0].content;
  if (system.includes('answers your questions by picking')) return { text: 'READING: Blank.\nLEAD: One thing first.\n### 1\n- The night clerk in the ferry booth | who sees every car\n- The woman who sells the tickets | and nothing else', model: 'canned' };
  if (system.startsWith('You write one part')) return { text: 'The night clerk in the ferry ticket booth.', model: 'canned' };
  return { text: 'Good. Who does she let through?\nSettled: She works nights.', model: 'canned' };
};

function Studio() {
  const [current, setCurrent] = useState(world);
  const author = authorFor({ ...initialConnection(), connected: true, model: 'canned' }, () => {}, canned);
  return (
    <AuthorProvider value={author}>
      <WorldView world={current} onChange={setCurrent} onDelete={() => {}} onStatus={() => {}} status={null} />
    </AuthorProvider>
  );
}

const door = () => document.querySelector('.errata') as HTMLElement;

describe('the Errata door', () => {
  beforeEach(() => { forgetDraftsInMemory(); sent.length = 0; });

  it('asks a round, settles a pick, talks, and writes a draft from what was settled', async () => {
    window.history.replaceState(null, '', '/#/w/w?kind=character&rec=dee&door=errata');
    render(<Studio />);
    const pane = within(door());
    await act(async () => { fireEvent.click(pane.getByRole('button', { name: 'Start: ask me something' })); });
    const round = within(await pane.findByRole('group', { name: 'Who are they to a stranger, in one sentence?' }));
    fireEvent.click(round.getByRole('button', { name: /The night clerk in the ferry booth/ }));
    fireEvent.click(pane.getByRole('button', { name: 'Take these' }));
    expect(pane.getByDisplayValue('Who are they to a stranger, in one sentence: The night clerk in the ferry booth (who sees every car)')).toBeInTheDocument();

    fireEvent.change(pane.getByLabelText('Talk to Errata'), { target: { value: 'She only works nights.' } });
    await act(async () => { fireEvent.click(pane.getByRole('button', { name: 'Send' })); });
    expect(await pane.findByText('Good. Who does she let through?')).toBeInTheDocument();
    fireEvent.click(pane.getByRole('button', { name: '+ Settle: She works nights.' }));
    expect(pane.getByDisplayValue('She works nights.')).toBeInTheDocument();

    await act(async () => { fireEvent.click(pane.getByRole('button', { name: 'Write it' })); });
    // The line is first, being empty; the write reads Settled and has no Errata in it.
    const write = sent.at(-1)!;
    expect(write[0].content).not.toContain('Errata');
    expect(write[1].content).toContain('Settled:\nWho are they to a stranger, in one sentence: The night clerk in the ferry booth (who sees every car)\nShe works nights.');
    expect((await screen.findAllByRole('region', { name: 'Draft for Line' })).length).toBeGreaterThan(0);
    // The door's row says what is waiting.
    expect(screen.getByRole('button', { name: 'Errata' })).toHaveAccessibleDescription('1 draft waiting · 2 settled.');
  });

  it('says what Write all empty will cost before it writes anything', async () => {
    window.history.replaceState(null, '', '/#/w/w?kind=character&rec=dee&door=errata');
    render(<Studio />);
    const pane = within(door());
    fireEvent.click(pane.getByRole('button', { name: 'Write all empty' }));
    expect(pane.getByText(/^6 calls, one after another, about [\d,]+ tokens sent in all/)).toBeInTheDocument();
    expect(sent).toHaveLength(0);
    await act(async () => { fireEvent.click(pane.getByRole('button', { name: 'Write them' })); });
    expect(sent).toHaveLength(6);
  });
});
