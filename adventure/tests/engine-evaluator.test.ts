// The evaluator: free text to a proposed check, only from the closed lists the rules give
// (docs/reviews/adventure/decision.md, A1).
import { describe, expect, it } from 'vitest';
import { act, choiceFor, evaluatorMenu, evaluatorRequest, readProposals, startSave } from '../src/engine';
import { abernys } from './abernys';

const module = abernys();

describe('the evaluator', () => {
  const save = startSave(module);
  const menu = evaluatorMenu(module, save);

  it('lists the approaches and what each can do to who and what is here', () => {
    expect(menu.approaches.map((entry) => entry.id)).toEqual(['force', 'finesse', 'focus', 'flair']);
    const arbiter = menu.targets.find((entry) => entry.id === 'gate-arbiter')!;
    expect(arbiter.acts.map((entry) => `${entry.approach}→${entry.aim}`)).toEqual(['force→health', 'force→strain', 'finesse→health', 'finesse→deed', 'focus→leverage', 'flair→strain']);
    const ask = evaluatorRequest(menu, 'I smile and tell her I have papers.', 'Wren');
    expect(ask[0]!.content).toContain('- gate-arbiter (');
    expect(ask[0]!.content).toContain('flair→strain');
    expect(ask[1]!.content).toContain('Wren wrote: I smile and tell her I have papers.');
    expect(ask[1]!.content).toContain('NONE');
    expect(evaluatorRequest(menu, '', 'Wren', 'choices')[1]!.content).toContain('up to three');
  });

  it('reads a proposal it can settle, and refuses anything off the lists out loud', () => {
    const read = readProposals('CHECK approach=flair target=gate-arbiter aim=strain want="she lets me through without signing"', menu);
    expect(read.refused).toEqual([]);
    expect(read.proposals).toHaveLength(1);
    const [proposal] = read.proposals;
    expect(proposal).toMatchObject({ target: { owner: 'gate-arbiter', defId: 'strain' }, approach: 'flair', intent: 'she lets me through without signing' });
    expect(proposal!.summary).toContain('Wants: she lets me through without signing.');
    const deed = readProposals('CHECK approach=finesse target=gate-arbiter aim=deed want=slip past', menu).proposals[0]!;
    expect(deed.target.defId).toBeNull();
    expect(readProposals('NONE', menu).proposals).toEqual([]);
    const bad = readProposals('CHECK approach=charm target=gate-arbiter aim=strain\nCHECK approach=flair target=nobody aim=strain\nCHECK approach=force target=gate-arbiter aim=leverage', menu);
    expect(bad.proposals).toEqual([]);
    expect(bad.refused).toHaveLength(3);
  });

  it('reads up to three choices with their button words, without repeats', () => {
    const read = readProposals([
      'CHECK approach=flair target=gate-arbiter aim=strain want=let me pass | Talk your way through',
      'CHECK approach=flair target=gate-arbiter aim=strain want=again | Again',
      'CHECK approach=focus target=gate-arbiter aim=leverage want=learn her habits | Watch the arbiter',
    ].join('\n'), menu);
    expect(read.proposals.map((entry) => entry.label)).toEqual(['Talk your way through', 'Watch the arbiter']);
  });

  it('rolls through the rules like any check, with what you want carried', () => {
    const proposal = readProposals('CHECK approach=flair target=gate-arbiter aim=strain want=she lets me through', menu).proposals[0]!;
    const choice = choiceFor(module, save, proposal);
    expect(choice).toMatchObject({ approach: 'flair', useAids: true, intent: 'she lets me through' });
    const result = act(module, save, 't1', { type: 'check', target: proposal.target, choice, input: '', random: () => 0.5 });
    expect(result.ok).toBe(true);
  });
});
