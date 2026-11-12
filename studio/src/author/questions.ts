// The site's default questions (docs/bids/worldbuilding/decision.md, *Default questions*). Each
// names the field it mostly feeds: 'line', or a section's title. W4 copies these into the
// author's own library to change; until then they are the list every world uses.
import type { RecordKind, StoryRecord } from '../../../core/records/index.js';

export interface Question { id: string; text: string; feeds: string; on: boolean }

const q = (id: string, text: string, feeds: string, on = true): Question => ({ id, text, feeds, on });

export const DEFAULT_QUESTIONS: Record<RecordKind, Question[]> = {
  character: [
    q('c-stranger', 'Who are they to a stranger, in one sentence?', 'line'),
    q('c-notice', 'What would someone notice across a room? If their kind shows, how?', 'Appearance'),
    q('c-dislike', 'What do they do when they don\'t like what they\'re seeing?', 'Personality'),
    q('c-talk', 'How do they talk to a stranger, and to someone they trust?', 'Speech'),
    q('c-day', 'What do they do all day, and for whom?', 'Background'),
    q('c-want', 'What do they want this month, and what\'s in the way?', 'Wants'),
    q('c-lie', 'Who would they lie for?', 'Background', false),
    q('c-wont', 'What won\'t they do, even when it would help?', 'Personality', false),
    q('c-keep', 'What do they keep on them?', 'Appearance', false),
    q('c-back', 'What do they keep back, and what would someone notice of it?', 'never', false),
  ],
  place: [
    q('p-outside', 'What is it to someone standing outside?', 'line'),
    q('p-runs', 'Who runs it, and what happens here?', 'Entry'),
    q('p-hear', 'What do you hear or smell before you see it?', 'Atmosphere'),
    q('p-night', 'Who\'s here at night that isn\'t here by day?', 'Atmosphere'),
    q('p-wrong', 'What does a newcomer get wrong here?', 'Entry'),
    q('p-trouble', 'What breaks, costs money or brings trouble if you stay?', 'Entry', false),
  ],
  thread: [
    q('t-pressure', 'What happens in three days if nobody does anything?', 'Pressure'),
    q('t-objective', 'What would someone see happen that makes this over?', 'Objective'),
    q('t-opposition', 'Who or what resists, and what will it do next?', 'Opposition'),
    q('t-cost', 'What does chasing it cost whoever does?', 'Cost'),
    q('t-consequence', 'What\'s different after, win or lose, and if it\'s left alone?', 'Consequence'),
    q('t-beat', 'What\'s the next thing that should happen in play?', 'Next beat'),
  ],
  group: [
    q('g-together', 'What do members do together?', 'Entry'),
    q('g-asks', 'What does it ask of a member?', 'Entry'),
    q('g-shows', 'How does a member show they belong?', 'Entry'),
  ],
  item: [
    q('i-use', 'What does someone do with it?', 'Entry'),
    q('i-hand', 'How would you know it in a hand?', 'Entry'),
    q('i-stops', 'What stops it being used?', 'Entry'),
  ],
  lore: [
    q('l-when', 'When would someone need to know this?', 'Entry'),
    q('l-who', 'Who acts differently because of it?', 'Entry'),
    q('l-true', 'Is it fact, belief or dispute?', 'Entry'),
  ],
  scenario: [
    q('s-now', 'What\'s true at the first scene?', 'Situation'),
    q('s-notyet', 'What hasn\'t happened yet that play should be able to reach?', 'Situation'),
    q('s-who', 'Who is there?', 'Situation'),
  ],
  persona: [
    q('pe-who', 'Who are you to these people?', 'Who you are'),
    q('pe-why', 'What gives you a reason to act?', 'Who you are'),
  ],
};

// Whether the field a question feeds is still empty. A question about a section the record no
// longer has is asked anyway: the answer still says something.
export function feedsEmpty(record: StoryRecord, question: Question): boolean {
  if (question.feeds === 'line') return !record.line.trim();
  if (question.feeds === 'never') return !record.sections.some((section) => section.reach === 'never' && section.text.trim());
  const section = record.sections.find((entry) => entry.title.trim().toLowerCase() === question.feeds.toLowerCase());
  return !section || !section.text.trim();
}

// The next questions for a round: switched on, not yet answered or skipped, and feeding a field
// that's still empty; in the list's order. The Studio decides this, never the model.
export function nextQuestions(record: StoryRecord, asked: readonly string[], count: number, list = DEFAULT_QUESTIONS[record.kind]): Question[] {
  const fresh = list.filter((question) => question.on && !asked.includes(question.id));
  const empty = fresh.filter((question) => feedsEmpty(record, question));
  return (empty.length ? empty : fresh).slice(0, count);
}

// How many questions a round asks, by how much the model reads.
export const roundSize = (window: number) => (window >= 32000 ? 3 : window >= 16000 ? 2 : 1);
