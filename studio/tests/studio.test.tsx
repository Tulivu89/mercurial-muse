import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { newRecord, newWorld, putRecord, type World } from '../../core/records/index.js';
import { WorldView } from '../src/WorldView';

function world(): World {
  let n = 0;
  const ids = () => `id-${++n}`;
  let next = { ...newWorld('w', 'Low Tide', 1), premise: 'A harbour town after midnight.' };
  const booth = { ...newRecord('place', 'booth', 'Booth B', ids), line: 'The night booth.' };
  const ada = { ...newRecord('character', 'ada', 'Ada Moss', ids), line: 'The voice of KXRT after midnight.' };
  ada.sections = ada.sections.map((section) => ({ ...section, text: section.title === 'Appearance' ? 'Forty, broad in the shoulders.' : section.title === 'Background' ? 'She left a morning show.' : '' }));
  next = putRecord(next, booth, 2);
  return putRecord(next, ada, 2);
}

describe('the world view', () => {
  it('lists records by kind and opens one into the editor and the context panel', () => {
    render(<WorldView world={world()} onChange={() => {}} onDelete={() => {}} onStatus={() => {}} status={null} />);
    const rail = screen.getByRole('navigation', { name: 'Low Tide: records' });
    expect(within(rail).getByRole('button', { name: 'Booth B' })).toBeInTheDocument();
    fireEvent.click(within(rail).getByRole('button', { name: 'Ada Moss' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Ada Moss' })).toBeInTheDocument();

    const context = screen.getByRole('complementary', { name: 'In context now' });
    expect(within(context).getByText('Forty, broad in the shoulders.')).toBeInTheDocument();
    expect(within(context).queryByText('She left a morning show.')).toBeNull();
    fireEvent.change(within(context).getByLabelText('What was just said'), { target: { value: 'Tell me about Ada Moss.' } });
    expect(within(context).getByText('She left a morning show.')).toBeInTheDocument();
  });

  it('sends edits up as a changed world', () => {
    const onChange = vi.fn();
    render(<WorldView world={world()} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ada Moss' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada Marsh' } });
    const changed = onChange.mock.calls.at(-1)?.[0] as World;
    expect(changed.records.find((record) => record.id === 'ada')?.name).toBe('Ada Marsh');
  });

  it('adds a schedule event from a time of day and draws it on the week', () => {
    const onChange = vi.fn();
    const { rerender } = render(<WorldView world={world()} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ada Moss' }));
    const schedule = screen.getByRole('region', { name: 'Schedule' });
    fireEvent.click(within(schedule).getByRole('tab', { name: /Fri/ }));
    fireEvent.click(within(schedule).getByRole('button', { name: 'Night' }));
    const changed = onChange.mock.calls.at(-1)?.[0] as World;
    const events = changed.records.find((record) => record.id === 'ada')!.schedule!.Friday!;
    expect(events).toMatchObject([{ startTime: 1320, endTime: 360, requiredIntimacy: 'none', sets: {}, rooms: {}, spots: {}, needs: {} }]);
    rerender(<WorldView world={changed} onChange={onChange} onDelete={() => {}} onStatus={() => {}} status={null} />);
    // It wraps past midnight, so it is drawn as two pieces.
    expect(screen.getByRole('region', { name: 'Schedule' }).querySelectorAll('.strip.on .block-bar')).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("What they're doing"), { target: { value: 'On the air.' } });
    expect((onChange.mock.calls.at(-1)?.[0] as World).records.find((record) => record.id === 'ada')!.schedule!.Friday![0]!.text).toBe('On the air.');
  });
});
