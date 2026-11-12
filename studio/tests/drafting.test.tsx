// Drafts on a record's page (W1), with a canned model in place of the connection.
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { newRecord, newWorld, putRecord, type World } from '../../core/records/index.js';
import { AuthorProvider, authorFor } from '../src/author/context';
import type { Generate } from '../src/author/run';
import { forgetDraftsInMemory } from '../src/author/store';
import { WorldView } from '../src/WorldView';
import { initialConnection } from '../../kit/src/connection';

vi.mock('../src/go', () => ({ go: vi.fn() }));

function world(): World {
  let n = 0;
  const ids = () => `id-${++n}`;
  const dee = { ...newRecord('character', 'dee', 'Dee Harlow', ids), line: 'The night clerk in the ferry ticket booth.' };
  return putRecord({ ...newWorld('w', 'Low Water', 1), genre: 'Coastal crime' }, dee, 2);
}

function Studio({ replies, connected = true }: { replies: string[]; connected?: boolean }) {
  const [current, setCurrent] = useState(world);
  let call = 0;
  const generate: Generate = async () => ({ text: replies[Math.min(call++, replies.length - 1)], model: 'canned' });
  const author = authorFor({ ...initialConnection(), connected, model: 'canned' }, () => {}, generate);
  return (
    <AuthorProvider value={author}>
      <WorldView world={current} onChange={setCurrent} onDelete={() => {}} onStatus={() => {}} status={null} />
    </AuthorProvider>
  );
}

// The page opens on Dee, as its address says.
const start = (replies: string[], connected = true) => {
  window.history.replaceState(null, '', '/#/w/w?kind=character&rec=dee');
  render(<Studio replies={replies} connected={connected} />);
};
// Sections left open stay open while the Studio runs, so it may be open already.
const openPersonality = () => {
  const folded = screen.queryByRole('button', { name: /^Personality, Here: open to write/ });
  if (folded) fireEvent.click(folded);
};
const field = () => screen.getByLabelText('Personality text') as HTMLTextAreaElement;

describe('drafts', () => {
  beforeEach(forgetDraftsInMemory);
  it('writes a draft under the field, keeps it, and undoes the keep', async () => {
    start(['Keeps the ticket roll under her palm and makes some drivers ask twice.']);
    openPersonality();
    // The line and Personality each say what a draft would cost.
    expect(screen.getAllByText(/About \d+ tokens · 1 call, 2 if the first is sent back/)).toHaveLength(2);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Draft Personality' })); });
    const card = await screen.findByRole('region', { name: 'Draft for Personality' });
    expect(within(card).getByLabelText('Draft for Personality')).toHaveValue('Keeps the ticket roll under her palm and makes some drivers ask twice.');
    expect(field()).toHaveValue('');

    fireEvent.click(within(card).getByRole('button', { name: 'Keep' }));
    expect(field()).toHaveValue('Keeps the ticket roll under her palm and makes some drivers ask twice.');
    expect(screen.queryByRole('region', { name: 'Draft for Personality' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(field()).toHaveValue('');
  });

  it('asks before keeping a draft over a field that changed since', async () => {
    start(['Makes drivers she dislikes ask twice.']);
    openPersonality();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Draft Personality' })); });
    const card = await screen.findByRole('region', { name: 'Draft for Personality' });
    fireEvent.change(field(), { target: { value: 'Written by hand meanwhile.' } });
    fireEvent.click(within(card).getByRole('button', { name: 'Keep' }));
    expect(within(card).getByText('Written by hand meanwhile.')).toBeInTheDocument();
    fireEvent.click(within(card).getByRole('button', { name: 'Leave it as it is' }));
    expect(field()).toHaveValue('Written by hand meanwhile.');
    fireEvent.click(within(card).getByRole('button', { name: 'Keep' }));
    fireEvent.click(within(card).getByRole('button', { name: 'Keep the draft anyway' }));
    expect(field()).toHaveValue('Makes drivers she dislikes ask twice.');
  });

  it('holds back Keep on an unfinished draft until it is edited', async () => {
    start(['Keeps the roll under her palm and', 'Keeps the roll under her']);
    openPersonality();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Draft Personality' })); });
    const card = await screen.findByRole('region', { name: 'Draft for Personality' });
    expect(within(card).getByText(/Unfinished: That stopped mid-sentence/)).toBeInTheDocument();
    expect(within(card).getByRole('button', { name: 'Keep' })).toBeDisabled();
    fireEvent.change(within(card).getByLabelText('Draft for Personality'), { target: { value: 'Keeps the roll under her palm.' } });
    await waitFor(() => expect(within(card).getByRole('button', { name: 'Keep' })).toBeEnabled());
  });

  it('turns a NEEDS reply into a question, and drafts again with the answer', async () => {
    start(['NEEDS: Does she know what the van carries?', 'Never looks in the back of her brother\'s van.']);
    openPersonality();
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Draft Personality' })); });
    const question = await screen.findByRole('region', { name: 'A question about Personality' });
    expect(within(question).getByText('Does she know what the van carries?')).toBeInTheDocument();
    fireEvent.change(within(question).getByLabelText('Your answer'), { target: { value: 'She knows and won\'t look.' } });
    await act(async () => { fireEvent.click(within(question).getByRole('button', { name: 'Draft with this' })); });
    expect(await screen.findByRole('region', { name: 'Draft for Personality' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'A question about Personality' })).toBeNull();
  });

  it('sends the author to Settings when no model is connected', () => {
    start([''], false);
    openPersonality();
    expect(screen.getByText(/Connect a model in Settings to draft Personality/)).toBeInTheDocument();
  });
});
