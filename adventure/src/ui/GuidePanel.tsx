// How Praxis plays: the rules in one place, one chapter open at a time. Written from the
// Four Approaches proposal; anything that arrives with the dice says so.
import { useState, type ReactNode, type RefObject } from 'react';
import { BackIcon, ChevronDown } from './icons';

type Chapter = 'basics' | 'hand' | 'journal' | 'records' | 'people' | 'approaches' | 'growth' | 'trade' | 'making' | 'focus' | 'checks' | 'condition' | 'momentum';

const CHAPTERS: { id: Chapter; title: string; summary: string; body: ReactNode }[] = [
  {
    id: 'basics', title: 'How a turn works', summary: 'You write, the narrator answers, the rules keep the facts',
    body: (
      <>
        <p>You write what your character says and does: speech as it is, with no quotation marks, <b>*actions*</b> in asterisks and <b>(thoughts)</b> in parentheses. Nobody in the story hears your thoughts. A <b>[note]</b> in square brackets speaks to the narrator from outside the story, and the narrator takes it as true.</p>
        <p>The narrator writes what happens next. It describes the world; it never changes a fact.</p>
        <p>The rules keep the facts: where everyone is, the time, who is hurt, who has signed what. A fact changes only when a rule settles it or you change it by hand, and the ledger records which.</p>
        <p>The narrator reads facts as words, and only the ones out of the ordinary. It learns that someone <b>is strained</b>, never the number behind it.</p>
        <p>Everything else is under the prompt. Scroll down past it for the scene, you, the map, the world and settings, one section open at a time.</p>
      </>
    ),
  },
  {
    id: 'hand', title: 'Changing things by hand', summary: 'Any value, any place, any lock',
    body: (
      <>
        <p>The mechanics are optional. Set any value yourself, put yourself anywhere, take a locked way anyway. Each change goes in the ledger as <b style={{ color: 'var(--you)' }}>yours</b>, so you can always tell what the rules decided from what you did.</p>
        <p>When the story has drifted, <b>wait or go quietly</b>: the skip button beside Wait and beside each Go. The rules run as they would, so the clock moves, your followers come along, people keep their day and a long enough wait is a rest, but no turn is written and the narrator is not asked. It sees where and when you are on your next turn.</p>
        <p>Undo takes back the last turn and everything recorded since, hand changes and quiet moves included.</p>
        <p>Reroll asks the narrator again. Edit lets you change the latest reply: save it as it stands, or cut it where it went wrong and choose <b>Continue from here</b> to have the narrator carry on from your words. Once a turn is done, only the story stays with the narrator; the dice and rulings do not.</p>
      </>
    ),
  },
  {
    id: 'journal', title: 'The journal', summary: 'How the story so far is kept',
    body: (
      <>
        <p>The narrator reads as much recent story as fits its window. When the story outgrows that, the oldest piece leaves all at once. Just before it does, Praxis suggests a short journal entry recording it.</p>
        <p>Keep it, edit it or discard it: nothing joins the journal on its own. You can also write anything you want remembered. Every entry goes to the narrator with every turn.</p>
        <p>When the journal passes its budget, Praxis suggests combining the oldest entries into one shorter entry. The originals are archived: kept, never sent.</p>
      </>
    ),
  },
  {
    id: 'records', title: 'Your own records', summary: 'People, places and things the story brings in',
    body: (
      <>
        <p>When the story brings in someone or something new, add it as a record: a person, a place, a thing, a group or a note. The narrator reads it like the module’s own records, and a place you add can be travelled to.</p>
        <p>Records live in your save. The module stays as it was published. Export yours to keep them or to bring them into another save.</p>
      </>
    ),
  },
  {
    id: 'people', title: 'People and bonds', summary: 'Who they are, where their day takes them, what lies between you',
    body: (
      <>
        <p>When someone is in the scene, the narrator reads their dossier: who they are, how they look, how they carry themselves and how they speak. In a crowded room the later arrivals get only their first line, so the story keeps its room.</p>
        <p>Some people keep a <b>routine</b>. As time passes they go where their day takes them, and the story tells you who left and who came. While you are with someone, they stay: nobody walks out of a conversation because the hour struck, though they may be due elsewhere. When you leave, or wait or rest, they go where their day puts them. Put someone somewhere by hand and they stay put until their day next moves them.</p>
        <p>Someone can <b>come with you</b> when you travel: a companion, once your bond is warm enough; a captive, once they are down; or someone who has given way to you. Their row in Scene offers it when it holds, and you can always bring someone along by hand. They go where you go and keep no schedule. Each time you travel the reason is checked again, and anyone it no longer holds for stays behind.</p>
        <p>Some places offer a <b>bargain</b> when the right people are there: hiring a sellsword, or buying someone's contract. It costs your <b>Coin</b>. Someone in your pay, or bound to you by contract, can then come with you like any follower.</p>
        <p>A <b>bond</b> is what lies between two people, in words: rivals who keep score, friends out of practice. Bonds between people who are both here reach the narrator. Start one with anyone from their row in Scene. A triumph against them with the approach that owns the bond, Flair here, warms it a tier; a despair cools it. You can also set it by hand.</p>
      </>
    ),
  },
  {
    id: 'approaches', title: 'Approaches', summary: 'Force, Finesse, Focus and Flair, and what each costs',
    body: (
      <>
        <p>Every character has four approaches rated 1 to 4. A new character starts at 1 in each and adds 4 points, with none above 3.</p>
        <div className="card">
          <div className="legend"><b style={{ width: 74, color: 'var(--force)' }}>Force</b><span className="w">pays in Health and noise</span></div>
          <div className="legend"><b style={{ width: 74, color: 'var(--finesse)' }}>Finesse</b><span className="w">pays in Alert</span></div>
          <div className="legend"><b style={{ width: 74, color: 'var(--focus)' }}>Focus</b><span className="w">pays in time</span></div>
          <div className="legend"><b style={{ width: 74, color: 'var(--flair)' }}>Flair</b><span className="w">pays in Strain</span></div>
        </div>
        <p>Anyone or anything in a scene can be acted on, with no setup:</p>
        <div className="card">
          <div className="legend"><b style={{ width: 74, color: 'var(--force)' }}>Force</b><span className="w">A person: hurt or overpower (Health). A thing: break it or force it (Integrity).</span></div>
          <div className="legend"><b style={{ width: 74, color: 'var(--finesse)' }}>Finesse</b><span className="w">A person: lift, slip past or plant something, a deed that simply works or fails. A thing: pick it, work it loose, take it (Security). The place: lie low (Alert).</span></div>
          <div className="legend"><b style={{ width: 74, color: 'var(--focus)' }}>Focus</b><span className="w">A person: read them for Leverage. A thing or the place: study it until you’re Prepared.</span></div>
          <div className="legend"><b style={{ width: 74, color: 'var(--flair)' }}>Flair</b><span className="w">A person: persuade, charm, bluff or intimidate (Strain).</span></div>
        </div>
        <ul>
          <li><b>Owner:</b> moves a state normally.</li>
          <li><b>Secondary:</b> adds one setback die, and failure costs what the owner pays. Each approach has one such lane: Force can intimidate (Strain), Finesse can strike from cover (Health), Flair can talk suspicion down (Alert), and Focus can work out a lock (Security). With a strong approach, the lane is worth about one rating step less than its owner: Force 3 Trained intimidates a rival 62% of the time, between Flair 2 and Flair 3, where Flair 1 manages 31% and spends more Strain than you have.</li>
          <li><b>No claim:</b> cannot move it. Charming a gate does nothing to its lock.</li>
        </ul>
        <p>A <b>fight ends</b> when the last one in it is down, or yields to Force, and no one else here is hurt but still standing. The narrator is told it is over and that no one else takes it up, and the place settles to uneasy.</p>
        <p><b>Charges</b> are one-use bonuses held per approach, on a ladder: Raw (+1), Practiced (+1, +2), Trained (+1 to +3), Expert (+1 to +4) and Master (+1 to +5). A new character has one Trained approach, two Practiced and one Raw. Spend one on a roll. They come back once every charge on that approach is used, or after a full rest. To <b>push</b>, take 2 Strain and reuse a spent charge.</p>
        <p>A <b>full rest</b> is waiting eight hours or more: 1 Health back, Strain restored, charges fresh.</p>
      </>
    ),
  },
  {
    id: 'growth', title: 'Growth', summary: 'Experience, and what it buys',
    body: (
      <>
        <p>You earn <b>experience</b> from what the rules can see:</p>
        <ul>
          <li><b>Overcoming</b> someone the first time you bring them to an end with a roll: a minion 1, a rival 4, a nemesis 10. A gang is worth one minion for each of them.</li>
          <li><b>Obstacles:</b> a lock, a door or a barred way, 1, or 2 if it was Hard or worse.</li>
          <li><b>Lessons:</b> 1 for failing against a rival or nemesis, at most once a scene.</li>
          <li><b>Milestones</b> on the module&rsquo;s threads, listed in the Journal: reached when the rules see them happen, or marked by your hand when they can&rsquo;t. Some are missed if their day passes. A scene action can pay too, such as signing the Covenant.</li>
        </ul>
        <p>Succeeding without a roll earns nothing: that is your choice, not a deed.</p>
        <p>Spend it in You › Growth. Raising an approach costs ten times the new rating, up to 4. Each step up a charge ladder adds the next charge and costs five times it: Practiced 10, Trained 15, Expert 20, Master 25. The narrator never hears about experience.</p>
      </>
    ),
  },
  {
    id: 'trade', title: 'Coin and things', summary: 'Prices, what things do, bribes and bargains',
    body: (
      <>
        <p>Prices go up in steps of ten, each named for what it buys: a knife 1, a sword 10, a horse 100, a house 1,000, a castle 10,000. A better sword costs what a sword costs. Only exchanges count. Drinks, meals and a bed are never counted while you have any coin, and the narrator hears only what you could afford, never the number.</p>
        <p>Each thing does one job:</p>
        <ul>
          <li><b>Help:</b> one boost die on a check it fits, such as lockpicks on a lock, or a forged writ with the Arbiters.</li>
          <li><b>Weapons</b> add harm when Force succeeds against someone: a knife or club +1, and it can be hidden; a sword, axe or spear +2.</li>
          <li><b>Armour</b> takes the first Health a failure costs you: a jerkin 1, mail 2, plate 3, though plate gets in the way of Finesse. A rest sets it right.</li>
          <li><b>Things you use up:</b> a poultice gives back 2 Health, a tonic 2 Strain, and a smoke pot lowers Alert.</li>
        </ul>
        <p>Buy and sell in Scene, from the people who sell. They pay full worth for what they sell themselves, and half for anything else. Once someone is down, or has given way, you can take what they carry.</p>
        <p>A <b>bribe</b> is Leverage you pay for. With Flair or Finesse against someone, offer their price for one step easier, or a scale above for two. A minion's price is a knife, a rival's a sword, a nemesis's a horse. The money changes hands only if they take it. On a despair they pocket it and refuse anyway. A minion takes their price without a roll, and some people, like an Arbiter, are not for sale at all.</p>
        <p>To <b>bargain</b>, use Flair on someone who sells. Each point takes a quarter off your next purchase from them, up to half. A despair means they won't deal with you until tomorrow.</p>
        <p>Some <b>terms</b> run out by the day: Garrick's month of pay, or a seller's refusal. Some deals come only after a check, such as Pell's back room once you have something on him, or only on a market day.</p>
      </>
    ),
  },
  {
    id: 'making', title: 'Making things', summary: 'Focus that carries to later checks',
    body: (
      <>
        <p>Leverage and Prepared help your next check against the same target. A thing you make carries that help to any later target it fits: a set of lockpicks for every lock, a forged writ for the Arbiters.</p>
        <p>Begin in You › Making. The materials cost half the thing's worth, paid when you start. Then work on it with Focus. Each success adds its successes to the work, and when it is done the thing goes into your pack.</p>
        <div className="card">
          <div className="legend"><b style={{ width: 110 }}>A knife's worth</b><span className="w">1 success, an hour a check</span></div>
          <div className="legend"><b style={{ width: 110 }}>A sword's</b><span className="w">2 successes, half a day a check</span></div>
          <div className="legend"><b style={{ width: 110 }}>A horse's</b><span className="w">3 successes, a day a check</span></div>
          <div className="legend"><b style={{ width: 110 }}>A house's</b><span className="w">5 successes, a week a check</span></div>
        </div>
        <p>It is Average, or Hard for fine or secret work such as a forgery. A failure takes as long again, and a despair spoils the materials. What you are making goes where you go, and the narrator knows you are at it. Making things earns no experience. Selling what you make is the profit.</p>
      </>
    ),
  },
  {
    id: 'focus', title: 'Focus, Leverage and Prepared', summary: 'Building an edge for your other approaches',
    body: (
      <>
        <p>Focus rarely wins on its own. It builds an edge against one person, thing or place, and your other approaches spend it.</p>
        <ul>
          <li><b>Leverage</b>, on a person: each point makes the next check against them by another approach <b>one step easier</b>. Up to two.</li>
          <li><b>Prepared</b>, on a thing or the place: each point adds a <b>boost die</b> to the next check against it by another approach. Up to two.</li>
        </ul>
        <p>A success builds one point, two with an extra success. The next check against the same target spends all of it, unless you switch it off on the check. Failing a Focus check costs time, not blood.</p>
        <p>What a point is worth, as the chance to succeed against Average difficulty:</p>
        <div className="card">
          <div className="legend"><b style={{ width: 74 }}>Rating</b><span className="w" style={{ flex: 1 }}>Plain · Leverage 1 · Leverage 2 · Prepared 1</span></div>
          <div className="legend"><b style={{ width: 74 }}>3</b><span className="w mono" style={{ flex: 1 }}>60% · 73% · 88% · 67%</span></div>
          <div className="legend"><b style={{ width: 74 }}>2</b><span className="w mono" style={{ flex: 1 }}>44% · 58% · 75% · 53%</span></div>
          <div className="legend"><b style={{ width: 74 }}>1</b><span className="w mono" style={{ flex: 1 }}>23% · 34% · 50% · 35%</span></div>
        </div>
        <p>A specialist with Focus 3 and Flair 3 reads someone first: a 60% chance of Leverage, a 34% chance of two points. Leaning on it lifts their Flair from 60% to about 73% overall, for one more turn. A broader build with Focus 3 and two approaches at 2 spends the same edge to bring a 44% approach up toward 58%.</p>
      </>
    ),
  },
  {
    id: 'checks', title: 'Checks and dice', summary: 'Building a pool and reading the result',
    body: (
      <>
        <p>Take your approach rating and the charge you spend. <b>The higher number is how many dice you roll; the lower is how many of them are upgraded</b> from green to yellow.</p>
        <p>Difficulty is one purple die per step: Simple 0, Easy 1, Average 2, Hard 3, Daunting 4, Formidable 5. A person or thing can set its own for each approach, or roll one at random that stays fixed for your save. Otherwise people take it from their tier (a minion is Easy, a rival Average, a nemesis Hard) and everything else is Average.</p>
        <p>A person's <b>rank</b>, 0 to 2, upgrades that many of their purple dice to red. A <b>gang</b> is several people who act as one, such as three dock toughs: their number is their Health and Strain and how many purple dice they bring, up to four. The narrator has one turn, not one per enemy, so several attackers are always a gang.</p>
        <p>If the story brings in a door, a crowd or two guards that aren’t records yet, choose <b>Something in the story</b> on the check. Name it, say how hard it is, and it joins your records, here, ready to aim at.</p>
        <div className="card">
          <div className="legend"><span className="die ability" aria-hidden="true" /><span><b>Ability</b><span className="w">Green. Your approach.</span></span></div>
          <div className="legend"><span className="die proficiency" aria-hidden="true" /><span><b>Proficiency</b><span className="w">Yellow. Upgraded by charges and Story Points.</span></span></div>
          <div className="legend"><span className="die boost" aria-hidden="true" /><span><b>Boost</b><span className="w">Blue. Help: Edge, preparation, tools.</span></span></div>
          <div className="legend"><span className="die difficulty" aria-hidden="true" /><span><b>Difficulty</b><span className="w">Purple. The task itself.</span></span></div>
          <div className="legend"><span className="die challenge" aria-hidden="true" /><span><b>Challenge</b><span className="w">Red. Upgraded difficulty.</span></span></div>
          <div className="legend"><span className="die setback" aria-hidden="true" /><span><b>Setback</b><span className="w">Black. Trouble: injury, being watched.</span></span></div>
        </div>
        <ul>
          <li><b>One net success succeeds.</b> Each extra success adds to what you get.</li>
          <li><b>One net advantage or threat</b> adds a small opening or complication. Two or more: advantage gives you Edge; threat triggers the approach’s cost.</li>
          <li><b>A triumph</b> on a success or <b>a despair</b> on a failure makes the outcome bigger.</li>
        </ul>
        <p>You can always succeed without rolling: the target moves by one and nothing is spent. The ledger records that you decided, and Settings can make that the default.</p>
      </>
    ),
  },
  {
    id: 'condition', title: 'Health and Strain', summary: 'Bands you read, points the rules count',
    body: (
      <>
        <p>You have 8 Health and 6 Strain, shown as bands: <b>unhurt</b> to <b>badly hurt</b>, <b>steady</b> to <b>badly strained</b>. At 0 Health you go down with an injury; at 0 Strain you are spent.</p>
        <p>Other characters come in three tiers. A minion has 2 Health and 1 Strain, a rival 5 and 4, a nemesis 8 and 6. Anyone at 0 Strain gives way.</p>
      </>
    ),
  },
  {
    id: 'momentum', title: 'Story Points and Edge', summary: 'The swing between you and the rules',
    body: (
      <>
        <p>There are two Story Points, one on each side. Spend yours to upgrade a die and it crosses to the rules’ side. When the rules hold both, they spend one on your next roll, and it crosses back. The narrator never spends them.</p>
        <p><b>Edge</b> is a boost die on your next roll, earned with two or more advantage.</p>
      </>
    ),
  },
];

export function GuidePanel({ headRef, onBack }: { headRef: RefObject<HTMLDivElement>; onBack: () => void }) {
  const [open, setOpen] = useState<Chapter | null>('basics');
  return (
    <div className="guide">
      <div className="panel-head" ref={headRef} tabIndex={-1}>
        <button type="button" className="btn quiet" onClick={onBack} style={{ paddingLeft: 4 }}><BackIcon />Menu</button>
        <h1>How Praxis plays</h1>
        <span className="spacer" />
      </div>
      <p className="meta" style={{ padding: '16px 18px 14px', fontSize: 14, lineHeight: 1.45, color: 'var(--text-2)', borderBottom: '1px solid var(--line)' }}>
        Everything the rules do, in one place.
      </p>
      {CHAPTERS.map((chapter) => (
        <section key={chapter.id} className="acc">
          <h2>
            <button type="button" className="acchead" style={{ minHeight: 72, padding: '12px 18px' }} aria-expanded={open === chapter.id} onClick={() => setOpen(open === chapter.id ? null : chapter.id)}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="accn small">{chapter.title}</span>
                <span className="accs">{chapter.summary}</span>
              </span>
              <ChevronDown />
            </button>
          </h2>
          {open === chapter.id && <div className="body">{chapter.body}</div>}
        </section>
      ))}
    </div>
  );
}
