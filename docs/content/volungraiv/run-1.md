# Volungraiv, first run: what it found

Nov 19, 2026 · @AmbiProp · The owner's first play of Lowgate, Before the Bell, on Gemini 3.8 Flash in chat mode, adventure v0.28.0. It covers three turns: reading Hollis, buying the Peace, and asking for a drink and a bed. The evidence is the save, the context of the third turn, the request log and a generation test. This page lists what went wrong, traces each problem to its cause, and sets out the order of work. The character and world review it calls for is planned at the end.

## The short version

Three turns are enough to show two failures, and both are ours. Gemini isn't the cause.

1. **The world is named before it is explained, and the explanations never reach play.** Every place, lore entry and group has a line written for "someone who has never been", such as *the Lee: the caravanserai inside the Gate*. The converter drops those lines on the way into the adventure. The narrator and the player see "the Lee, a building" and nothing more.
2. **Hollis is a job description.** Every section of his record points at the thread. The module process told us to write people that way ("what a person is for: a door, a lever, a threat, a prize or a mark"), and it left out the grounding step that fixed the same failure in the resort's pilot.

The rest are smaller problems in code and content. They're listed below so none of them gets lost.

## What the owner saw, and why

### 1. Nobody knows what the Peace is, or what the Lee is

**What happened.** The opening names the Peace in its second sentence and explains it in the same breath. In five sentences it brings in the Gate, Hollis, the Peace, the bell, the Lee, Room Six and the underguilds. Hollis's replies then add *upstairs*, *the watch*, *the Pit*, *the underguilds*, *the slate*, *the knot* and *the ribs*. That's about fifteen terms in three replies, and none of them is clear from sight.

**Why.**
- **The lines are lost.** `core/convert/module.ts` builds a place's and a lore entry's description from its Entry and other sections. The `line` isn't carried. So the context says *"The Lee, a building in Lowgate: One side of the yard is the titan's rib…"* and never says *inn*. The line *"The caravanserai inside the Gate: a wagon yard against a titan's rib, a common room, and gallery rooms Lowgate packs into when the bell rings"* was written for exactly this moment, and it never arrives.
- **The opening puts names first.** It's built like the back of a book, with every hook in one paragraph. A chat opening needs to teach one thing and hand over the turn.
- **Hollis's Speech adds three codes on top.** *Upstairs* for the Compact, *the paper* for a stand-down, *left us* for the dead. Each is good flavour alone. On top of the world's own terms they become a wall.

**What to do.**
- Carry every record's line into the module, and show it wherever a name stands alone: in the exits list, the World list and the context header. *(Code, small. This is the first fix.)*
- An opening rule for the standard: **explain, then name.** Bring in at most two terms the player can't read from sight, show each one before it's named, and leave the rest for play. The Peace becomes *a glass token on a cord: wear it inside the walls, and anyone who hurts you is found and hurt back*, and only then *the Peace*.
- **A jargon budget per scene:** a person's in-world codes count against it. Hollis keeps one, not three.
- **Lorebook links in the text:** not now. The owner's instinct is right. If a player has to look terms up, the writing has already failed. Revisit once the writing is fixed, as a convenience, not a crutch.

### 2. The opening isn't in italics

**Yes, it should be.** The format says narration goes in asterisks, and the opening is all narration. It's also the first assistant message the narrator sees, so it's the first example of the format the model copies. Today it's plain text, and `Play.tsx` shows it plain. Rewrite it in the format in the world file. Then add a check that warns when a scenario's opening has no asterisks.

### 3. The travel buttons don't say they travel

**What happened.** Under **Ways out**, each row is a place name, a time, a skip button and **Go**. The skip icon and the time sit next to a bare name, and nothing says *you walk there*.

**What to do.** Make the row read as a journey: *Go to the Lee*, with the walk's time, with the place's line under the name (*the caravanserai inside the Gate*). This is the same line fix as in item 1, and it answers both problems at once. The quiet skip should say *Go quietly* in words, not as a bare icon.

### 4. Hollis: our worldbuilding failed

**What happened.** The player asked to take Hollis's measure. The narrator had nothing true and present to show, so it paraphrased his Background: *"the soft, thick chin of a man who stopped fighting men with his fists twenty years ago and started outliving them instead."* That's telling, and it comes from the card.

**Why.** Here is his record with the thread taken out:

| Section | What's left that is *him* |
| --- | --- |
| Appearance | Heavy, slow, soft hands, eyes to the horizon when the bell rope stirs. Good. |
| Personality | Six lines. Four are thread hooks (Room Six, stand-downs, bribes, threats). One is about the bell. One is about the price. |
| Speech | Warm, wandering, says your name, laughs first, the weather when it's hard. Good, plus three codes. |
| Background | His career, from cook to porter to owner to warden. |
| Wants | The thread's secret. |
| His People | Three thread characters. |
| Knucklebones | **The only part that is him.** It happens offstage, on rest-day evenings. |

He has no pleasure, no fear, no pride and no pet hate. Nothing he does when nobody is buying. Nothing a read could uncover. His Personality only covers the player acting *on* him (asked, bribed, threatened), so a scene where the player just watches him has nothing to play.

**The cause is in the process, not the writer.** `docs/content/modules/process.md` defines a module person as "a use to an adventure". It drops greetings and examples (correctly, since the narrator never sees them), and it drops the grounding step along with them (wrongly). The pilot hit this exact failure with Errata, whose first take "felt like a job description" (`docs/content/process-retrospective.md`). The fix was mandatory grounding questions before the persona: her tastes off the clock, what makes her laugh, what makes her snap, and one real flaw. Profile Plus (Presence, Drive, Pattern, Resistance, Conduct) was kept as the way to think a character through. The module process never asked those questions.

**A second cause, in code.** The converter flattens a character's Named sections into one description that is sent whenever they're present. So Hollis's *Wants*, the thread's secret, sits in every context he's in. His When sections, which show how he changes as the thread moves, are dropped entirely. The record's reach was designed. The adventure doesn't honour it.

**The owner's line is the brief:** *we don't need a whole storyline in each character; we need characters in a story.* The review below is built on it.

### 5. Lists need a hierarchy

**The screenshot didn't come through.** Only the four text files arrived, so please attach it again. From the code: the adventure's World list is flat. It's sorted by how near things are, then by kind, then by name. The places from the Badlands down to Room Six sit side by side with "Building · Lowgate" as a note.

**What to do.** Show places as a tree, built from their parents, open down to where you stand. Let any list be grouped by another field: people by where they are now, by faction or by people (species), and lore by place. The record model already holds every link this needs. The Studio's list (one level at a time, `docs/bids/ui/decision.md`) gets the same group-by.

### 6. Threads: where, the start, and how one is found

**How it works today.**
- Every thread in the module is in the Journal from the first turn.
- The first unfinished thread is followed automatically. **Follow this thread** switches to another.
- The narrator hears the followed thread's next milestone as *What you are after*.
- Nothing is discovered in play. Nothing on the map marks where a milestone is.

**What the run showed.**
- **The first milestone isn't at the start.** The opening points at Room Six and Hollis. The first milestone targets Teague, under the Awnings, a place the player hasn't heard of. The thread should open where the player stands: a milestone 0 on Room Six or Hollis, such as *take the room and see what the porters scrubbed*, which leads on to Teague.
- **"The Envoy" is a stub.** It's a second thread with nothing but a next beat, and it repeats milestone 5 of Bought Out. Fold it into Bought Out as a story event (A3), or write it out.
- **Milestones already name their targets** (`targetId`: Teague, the Peace book, Sela, Ansel). The map can mark the next milestone's target where it is now: a person's current place from the schedule, a thing's place from where it's kept. The scene can say *Teague is under the Awnings this afternoon*. *(Code, small to medium.)*
- **Found, not given.** A thread could start hidden until a condition is met: a place entered, a person met or a lore entry raised. It then appears in the Journal with a line of how it was found. That's the A3 story-events work, and Volungraiv's second thread should be the first one built that way.

## Smaller things the files showed

**Rules and narration**
- **The price never reaches the narrator.** The Peace token is worth 1 coin, and the ledger took 1. Hollis said *four silver bits*, and *two bits for the straw*. A directive about a sale should name what was paid.
- **The narrator overrode the directive.** The directive said *a disc of storm glass on a waxed cord, a number scratched into it, watches you put it round your neck*. The reply gave *a flat oval of greenish glass on greasy rawhide, stamped with three lines, dropped on the sill*. The narration rules should say a directive's details are canon.
- **Leverage is a bare number.** The read on Hollis succeeded: Hollis Leverage 2, with a complication. The narration showed neither. Every later prefill repeats *you have real leverage on Hollis Crane*, but nothing says what the leverage is. A successful read should reveal a fact, and the record needs one to reveal (see the review). The complication should be named, or the directive should give the narrator one.
- **The evaluator missed the obvious read.** For *I take my measure of Hollis* it offered *slip past him*, *scout the gate* and *intimidate him*. The Focus check on Hollis looks hand-built, and its intent (a discount) doesn't match the words typed. Worth a line in the evaluator's prompt: *reading* a person is a Focus check against them.
- **The persona's line goes stale.** "With a little coin and no Peace yet" stays in *Who you are* after the Peace is bought. Text shouldn't state what the rules track.
- **Hollis's record contradicts the scenario.** His Personality says *asked about Room Six, he says it's let*. The opening says it's the one room free, and he offered it unasked. Pick one: a dodge, or a sale.

**The diagnostics**
- **Thinking eats the reply's budget.** Narration is capped at 1,000 tokens. Gemini spent 126, 452 and 537 of them thinking, which leaves about 460 for a long reply. Nothing was cut off this time, but it will be.
- **The evaluator is thinking too.** It spent 419 tokens and 5.7 seconds thinking for a three-line answer. The evaluator should always ask for minimal thinking (`core/narration/gemini.ts` already supports it for Gemini 3 Flash). Narration should either do the same or raise its cap by the thinking it uses.
- **Prompt size doesn't matter for speed on this model.** In the generation test, a 16k prompt cost about a second more than a 4k one, and caching made no difference you could time. Context budgets on Gemini Flash are a question of quality, not latency.
- **The scene sent about 3,000 tokens out of 28,000.** There's room to send lines, a place's people and a fuller person without trimming anything.

## The order of work

| # | What | Kind | Size |
| --- | --- | --- | --- |
| 1 | Carry lines into the module and show them in exits, the World list and the context header | Code | Small |
| 2 | Travel rows read *Go to …*, with the line under the name | Code | Small |
| 3 | Evaluator asks for minimal thinking. Narration cap allows for thinking | Code | Small |
| 4 | Directives name prices. Narration rule: a directive's details are canon | Code | Small |
| 5 | **The character and world review below**, then the revised records | Content | The main job |
| 6 | Opening rewritten in the format, explain then name. Thread milestone 0 at the start. The Envoy folded in | Content | Small, after 5 |
| 7 | Map and scene mark the next milestone's target | Code | Medium |
| 8 | Places as a tree, group-by on lists (adventure, then Studio) | Code | Medium |
| 9 | Named sections sent by key, When sections by condition, in the adventure | Code | Large (roadmap step 6 territory) |
| 10 | Threads found in play (A3 story events) | Code and content | Large |

Items 1 to 4 can go in one code session now. Item 5 decides how 6 is written.

## The character and world review: the plan

**The question:** does each record give the narrator a person or a place to play, or only a part of the plot to deliver?

**Scope:** the world file's thirteen characters, the persona, the slice's places and the eight lore entries. The resort's three and HOG Wild's six are the comparison, since they passed grounding.

**Step 1: the strip test (no writing).** For each character, cross out every sentence that names the thread, a thread person or a milestone, and see what's left. For each place, ask whether the line says in plain words what it is (inn, market, fighting pit, drain). The output is one table with a row per record. The owner reads it in ten minutes.

**Step 2: the grounding questions, one line each per lead.** These are adapted from the pilot's mandatory questions and Profile Plus, for a narrator rather than a chat partner:

- **Presence:** what does a stranger feel standing in front of them, before a word?
- **Drive today:** what do they want out of this afternoon? Not the season's plot.
- **Pattern:** the habit they repeat whatever is happening.
- **Pleasure and pet hate:** one thing each that has nothing to do with the thread.
- **Resistance:** what they won't do, even for money, and where they crack.
- **Conduct:** how they treat a nobody, and how they treat someone above them.
- **The tell:** what a careful read shows, and what it means. This is what a successful Focus check reveals, and it gives Leverage its content.

The owner adds the missing human complication here, as with the pilot. Only leads get all seven. Supporting people get Drive today, Pattern and the tell.

**Step 3: the process changes, written down before the rewrite** so the fill doesn't repeat this.

- `process.md`: replace "a use to an adventure" with *a person with a use*. Put the grounding questions back as a gate before Personality. Add the tell to the person fields.
- `standard.md`: the opening rule (explain then name, two new terms at most), the jargon budget, and a failure-list entry: **job description** (every section points at the plot).
- `inkwyrm-records`: the same, so the next fill writes to it.

**Step 4: rewrite Hollis first, alone.** Replay the same three inputs on Gemini 3.8 Flash with the old record and the new one, and compare. If the read shows something true and the narration stops reciting his Background, do the other leads the same way. Then do the supporting people and the places.

**Step 5: the opening and the thread start,** written last, against the revised people and places (item 6 above).

**Questions for the owner before step 1:**
1. Should the review cover the whole Lowgate slice at once, or Hollis plus the three people a first evening meets (Teague, Nefera, Wenna) first?
2. Do the module rewrites wait for code fixes 1 to 4, so the replay compares like with like? (Recommended: yes. They're a short session.)
3. The screenshot, again, for the list hierarchy.
