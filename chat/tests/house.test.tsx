import { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Life } from '../../core/chat/index.js';
import { importCardJson, newWorld, type World } from '../../core/records/index.js';
import { House } from '../src/House';

const contact = {
  cardType: 'contact', id: 'card-mira', name: 'Mira', persona: 'Wry.', greeting: 'Hey.', relationship: 'acquaintance',
  schedule: { Daily: [{ id: 'all', startTime: 0, endTime: 1439, text: 'Minding the counter.', requiredIntimacy: 'none' }] },
  cr: {
    lineHome: { all: { 'card-cafe': { room: 'vFloor', x: 0.25, y: 0.6, scale: 0.3 } } },
    needs: [{ id: 'hunger', name: 'Hunger', max: 100, decay: 6, low: 25, lowEmotion: 'irritated' }],
    homeActions: [{ id: 'feed', name: 'Feed', effects: { hunger: -80 }, say: '{{user}} takes {{char}}\'s plate away.' }, { id: 'out', name: 'Go out', effects: {}, level: 'close' }],
  },
};
const scenario = { cardType: 'scenario', id: 'card-cafe', name: 'Cafe', cr: { sets: [{ id: 'sRooms', name: 'Location', variants: [{ id: 'vFloor', name: 'The floor', content: 'Tables and steam.' }, { id: 'vLoft', name: 'The loft', content: 'A bed.', lock: 'close' }] }] } };

function world(): World {
  let n = 0;
  const ids = () => `id-${++n}`;
  const a = importCardJson(newWorld('w', 'Imported', 1), contact, ids, 2);
  if (!a.ok) throw new Error('contact');
  const b = importCardJson(a.result.world, scenario, ids, 3);
  if (!b.ok) throw new Error('scenario');
  return b.result.world;
}

function Harness({ onChat = () => {} }: { onChat?: () => void }) {
  const [state, setState] = useState(world);
  const [lives, setLives] = useState<Record<string, Life>>({});
  return <House worlds={[state]} chats={[]} portraits={{}} lives={lives} userName="Sam" onLife={(life) => setLives((all) => ({ ...all, [life.key]: life }))} onWorld={setState} onPicture={() => {}} onChat={onChat} />;
}

describe('Home', () => {
  it('says what it needs when there is no place yet', () => {
    render(<House worlds={[newWorld('w', 'Empty', 1)]} chats={[]} portraits={{}} lives={{}} userName="" onLife={() => {}} onWorld={() => {}} onPicture={() => {}} onChat={() => {}} />);
    expect(screen.getByText(/Home needs a scenario with rooms/)).toBeInTheDocument();
  });

  it('shows the room a character is in, with them standing where the schedule puts them', () => {
    render(<Harness />);
    const rooms = screen.getByRole('tablist', { name: 'Rooms' });
    expect(within(rooms).getByRole('tab', { name: /The floor/ })).toHaveAttribute('aria-selected', 'true');
    expect(within(rooms).getByLabelText('1 here')).toBeInTheDocument();
    const figure = within(screen.getByRole('region', { name: 'The floor' })).getByRole('button', { name: 'Mira: Minding the counter.' });
    expect(figure).toHaveStyle({ left: '25%', top: '60%', width: '30%' });
    fireEvent.click(within(rooms).getByRole('tab', { name: 'The loft' }));
    expect(screen.getByText(/Nobody is in The loft right now/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Follow Mira' }));
    expect(screen.getByRole('region', { name: 'The floor' })).toBeInTheDocument();
  });

  it('keeps needs once asked, moves them with an action, and holds back what the relationship has not reached', () => {
    render(<Harness />);
    const keeper = screen.getByRole('region', { name: 'Mira' });
    expect(within(keeper).getByRole('meter', { name: 'Hunger' })).toHaveAttribute('aria-valuenow', '100');
    expect(within(keeper).getByRole('button', { name: 'Go out' })).toBeDisabled();
    fireEvent.click(within(keeper).getByRole('button', { name: 'Start keeping them' }));
    expect(within(keeper).queryByRole('button', { name: 'Start keeping them' })).toBeNull();
    fireEvent.click(within(keeper).getByRole('button', { name: 'Feed' }));
    expect(within(keeper).getByRole('meter', { name: 'Hunger' })).toHaveAttribute('aria-valuenow', '20');
    expect(within(keeper).getByText('Sam takes Mira\'s plate away.')).toBeInTheDocument();
    // Hungry now, so her figure looks it.
    expect(within(keeper).getByText(/Looking irritated/)).toBeInTheDocument();
    fireEvent.change(within(keeper).getByLabelText('You are to them'), { target: { value: 'close' } });
    expect(within(keeper).getByRole('button', { name: 'Go out' })).toBeEnabled();
  });

  it('arranges a figure and a room\'s layers, and opens a chat', () => {
    const onChat = vi.fn();
    render(<Harness onChat={onChat} />);
    fireEvent.click(screen.getByRole('button', { name: 'Arrange' }));
    const where = screen.getByRole('region', { name: 'Where Mira stands' });
    fireEvent.change(within(where).getByLabelText('Across'), { target: { value: '0.8' } });
    expect(screen.getByRole('button', { name: 'Mira: Minding the counter.' })).toHaveStyle({ left: '80%' });
    const picture = screen.getByRole('region', { name: 'This room\'s picture' });
    fireEvent.click(within(picture).getByRole('button', { name: 'Add a layer' }));
    fireEvent.change(within(picture).getByLabelText('Movement'), { target: { value: 'flicker' } });
    expect(within(picture).getByLabelText('Movement')).toHaveValue('flicker');
    fireEvent.click(within(screen.getByRole('region', { name: 'Mira' })).getByRole('button', { name: 'Chat' }));
    expect(onChat.mock.calls[0]![1].name).toBe('Mira');
    expect(onChat.mock.calls[0]![2].name).toBe('Cafe');
  });
});
