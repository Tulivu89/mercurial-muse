# Praxis — Records and Context Map

Oct 17, 2026 · @AmbiProp

This page lists every kind of world and game record, what the narrator reads from it, where in the prompt it goes, and why. It describes **0.19.0** (PRs #18 to #21). The layout is still 0.14.0's, *the scene and its cast*.

**History.**
- 0.11.0: GLM-4.6 rules and mentioned records.
- 0.12.0: the Four Approaches on every record (§8).
- 0.13.0: one home per fact.
- 0.14.0 follows Leon's review of 0.13.0:
  - lore goes where NovelAI puts lorebooks;
  - the outcome comes after your words;
  - conditions go in the reply's opening, as NovelAI's prefill does;
  - no world-wide roster;
  - every outcome and condition is brief, and says what it means.
- 0.16.1 to 0.19.0 add to what is sent, not to where it goes:
  - a fight that ends says so;
  - the You entry carries your goods, what you are making, and what you could afford;
  - outcomes for trade, bribes, armour and making.

  Experience never reaches the narrator.

Xialong is on hold.

## 1. What goes where, and why

**The rule.** Everything is sent once, laid out as NovelAI lays out a story: Memory, then the lorebook, then the story, with the newest guidance last. Within that, slower-changing things come first so the opening of the prompt can be reused.

| # | Where | Holds | Changes when |
| --- | --- | --- | --- |
| 1 | **system** | Brief rules. The house format shown by a two-turn example from another story. The world: identity, established facts, world rules, and the land's top two levels of places, one line each | Never |
| 2 | **system: the lorebook section** | The story so far (the journal). You (description, appearance, what you carry, what you are making, and what you could afford when that is off its resting band) and your own notes. Where you are (on while you're there): the place, its history, what lies here, the ways on. **The dramatis personae.** What lies between the people here. Lore switched on by key | An entry is kept, or the scene changes: you travel, someone comes or goes, something new is named |
| 3 | transcript | Each earlier turn: your words and the reply. Once resolved, only the story remains: no rolls, no rulings (0.15.0) | Never rewritten. Its start moves only when a whole piece is cut |
| 4 | **user** | Your words this turn, alone | Every turn |
| 5 | **prefill** | The start of the reply, in NovelAI's own shape (below) | Every turn |

### The prefill

NovelAI begins GLM-4.6's and Xialong's replies with a short acknowledgment. Praxis does the same, carrying this turn's rulings. It is written as clean sentences, one to a line, because the reply copies whatever it looks like (0.15.0):

```
Understood. I will:
- Continue the text adventure in the established voice, in second person and present tense, with narration and action in *asterisks*, speech as plain text, and thoughts in (parentheses).
- Show that it gains ground, but it is not over yet.
- Show that this does not happen yet: she believes your lie and lets you through.
- Show that the gate Arbiter is wavering, no longer sure of her ground but still holding out.
- Remember that you are strained.
- Remember that the garrison guard has given way. He will take your word over anything he can see or know, and do as you ask, until something new changes his mind.
- Stop where you can act again.
[Of course, here you go:]
*
```

- **Outcomes:** each line of the outcome becomes "Show that …". With nothing decided, the line reads "Show how the world answers what you just did, and leave the outcome of anything uncertain open."
- **Conditions:** each condition off its resting band becomes "Remember that …". That covers yours, the world's, the people here (followers included), the place and the things in it. A condition the outcome already states is left out.
- **Shape:** every line ends with a full stop and holds at most one colon, and a test holds it to that.
- **The opening `*`:** the model continues from it, so every reply opens on narration, and it is put back on the reply.
- **After an edit:** "Continue from here" puts the player's edited text in its place, and the narrator carries on from there.

### One character, three places

A present person appears up to three times, each with a different job:
1. **The dramatis personae:** `[ Present at the landward gate, early morning: The gate Arbiter, keeping the ledger at the landward gate. A garrison guard, standing the gate watch. ]`
   - It gives their name, role, and what their day has them doing. When their schedule is held it says "due at the Governor's court by now"; for a follower, "your captive".
   - Their description's first sentence rides here only while their lore entry is off.
2. **Their lore entry**, switched on by key: `[ The gate Arbiter, of the Humans: description. Looks: … Manner: … Speech: … ]`
3. **Their condition**, in the prefill.

### Lore switched on by key

- **What is scanned:** the scene's story since you arrived where you are, or since the opening if you haven't moved. That is your words, the replies, and what the rules decided each turn. The game's other notes are never scanned: the dramatis personae names everyone present, and scanning it would switch them all on.
- **Keys:**
  - the name, and the name without its article;
  - the parts of a proper name;
  - a title role ("Governor");
  - a record's `keys`;
  - for someone present, the last word of a name that starts with an article ("guard", "Arbiter");
  - anyone a check targets switches on.
- **Overlaps:** where two names overlap, the longer one counts, so "the garrison guard" is the guard, not the garrison.
- **Sticky:** an entry stays on until you leave. Someone who goes quiet keeps their profile, and the section only changes when something new comes up.
- **Budget:** 1,800 tokens, people present first, then whatever came up most recently. Entries appear in the order they first came up.
- **Present people** get their full profile. Anyone or anything absent gets its note, and a person is marked "not here now".
- **Not repeated:** the land's top regions (they are in the first message), and the place you are in or anything containing it.

## 2. Record by record

| Record | First message | Lorebook section | Prefill | Never sent |
| --- | --- | --- | --- | --- |
| **World** | Identity, facts, rules, top regions | Each `lore` block and `rules.magicPhysics` / `technology`, by key | World conditions | `timeWeather` |
| **Place** | Top two levels, one line each | Where you are: in full, with deeper containing places' first lines, history, what lies here, ways on. Others by key | Place conditions (Alert) | travel fields other than routes |
| **Person** | Nothing | Dramatis personae line while here. Profile by key (present) or note (absent, "not here now") | Their conditions while here | `summary`, `tags`, `workplaceLocationIds` |
| **You** | Nothing | Description, appearance, what you carry | Your conditions | Your manner and voice |
| **Relationship and bond** | Nothing | While both are here: shape, together, wants, and "Now:" the bond's tier | n/a | Relationships of absent people |
| **Faction, society, species, family, memory, thing** | Nothing | By key, one entry each. History tied to where you are rides on the place's entry | Thing conditions while here | n/a |
| **Player's note** | Nothing | Always, in full | n/a | n/a |
| **Journal** | Nothing | Active entries, first in the section | n/a | Archived entries |

## 3. After something happens

A ruling opens a turn, and its outcome goes in that turn's prefill. Afterwards only the story remains in the transcript, and its conditions stay in the prefill as "Remember that …". A change made by hand opens no turn; it shows in the next prefill.

**Outcomes are brief facts, one plain sentence a line.** The prefill turns each into "Show that …". Each condition says what it means, and whether more is needed before it's over.

**Stakes (0.14.1).** A check can carry what the player wants from it ("She lets me through without signing."). The outcome then says outright whether it happens:
- "It works, so this happens: she lets you through without signing."
- "This does not happen yet: …" on a partial success;
- "This does not happen: …" on a failure.

This exists because a ruling about someone's state ("has given way") left the narrator to work out what that meant. Against a lie the scene could disprove, it sided with the evidence in 4 of 5 rerolls.

| Event | Outcome |
| --- | --- |
| **Check reaches an end** | "It works[, better than hoped]. The garrison guard has given way: they believe you, back down or do as you ask, until something new changes their mind." |
| **Check gains ground** | "It gains ground, but it is not over yet. The gate Arbiter is wavering: unsure now, but still holding out." |
| **Check fails** | "It fails[, and it goes badly wrong]: it makes no headway against the gate Arbiter." Then the cost in words: "You are strained." "Everyone at the landward gate is uneasy: they keep an eye on you." |
| **Focus** | "It works: you notice something useful about the gate Arbiter. You have something on the gate Arbiter." |
| **Deed** | "It works." / "It fails." |
| **Side effects** | "Something small also goes your way." / "an opening you can use" / "Something small also goes against you." / "Something else goes wrong for you too." |
| **Travel** | "You have just arrived at the outer lanes after a short walk, with a garrison guard, your captive." Anyone who stops following: "A garrison guard does not come with you." |
| **Wait, rest** | "Time passes where you are: a few hours." / "You rest for … and wake refreshed." Then "Meanwhile, Ines Corvo leaves for the Governor's court." |
| **Scene action** | Its authored outcome, in "you" terms |
| **A fight ends** (0.16.1) | "The fight is over. No one else here takes it up, and no one comes to join it." The place's Alert falls to uneasy, which adds "Everyone at the landward gate is uneasy and keeps an eye on you." |
| **Armour** (0.18.0) | "Your armour takes the blow." / "Your armour takes some of the blow." |
| **Bribe** (0.18.0) | "The garrison guard takes your 1 coin." / "Odile Fenn turns your money down." / "… pockets your 10 coin and refuses anyway." / "The gate Arbiter is not for sale, and the offer counts against you." |
| **Buy, sell, take, use** (0.18.0) | "You pay Pell 1 coin and get a poultice." / "Pell takes a knife off your hands for nothing." / "You take 10 coin, a sword and a mail shirt from Garrick Hale." / "You use a poultice." followed by what it changed |
| **Bargain** (0.18.0) | "Pell will give you a quarter off your next purchase." On a despair: "Pell won't deal with you today." |
| **Making** (0.19.0) | "It works. The sword you are making is half done." / "You have made a sword. It is yours." / "It fails, and the work goes no further." / "The materials are spoiled, and the work is lost." |

**Your purse** reaches the narrator only through the You entry, as what you could afford, and only off its resting band (1 to 9 coin, "can pay for food, drink, a bed and small things", is assumed). It is never a condition in the prefill, and never the number. **Experience** never reaches the narrator.

**Standard condition words** (the screen shows the part before the colon):

| State | You | Someone else |
| --- | --- | --- |
| Health | bruised; hurt: it slows you; badly hurt: every move costs you; down (then "You can do nothing more in this scene.") | bruised: shaken, but still fighting; hurt: bleeding and slowed, but still fighting; near death: barely standing, and one more good blow could drop them; down: out of the fight and unable to act |
| Strain | strained; badly strained: your composure is fraying; spent (then "You can push yourself no further until you rest.") | wavering: unsure now, but still holding out; close to giving way: still holding out, but not for much longer; has given way: they believe you, back down or do as you ask, until something new changes their mind |
| Alert | n/a | Everyone at the place is uneasy: they keep an eye on you; watching closely: one more slip and they act; roused: they act against you. Nothing passes unchallenged now. |
| Integrity, Security | n/a | damaged: still holding, but it will not take much more; broken: it gives way, and whatever it held shut is open now. giving: nearly open; open |

Any loss now leaves the resting band, so a success always shows.

### People and schedules

- **Held while you're together.** While you are with someone, their schedule can't take them away. They're "due elsewhere", and the narrator hears where.
- **Released** when you leave, wait or rest: they go where their day puts them. Arrivals happen as before.
- **Followers** travel with you and keep no schedule. The standard reasons, from `ruleset.follow`:
  - a **companion**, once your bond is in its warmest two tiers (`followsFrom` on the bond kind changes that);
  - a **captive**, once down;
  - someone **won over**, who has given way to you.
- **Checked on every journey.** Anyone the reason no longer holds for stays behind.
- **By hand:** "Bring along anyway" skips the reasons and is recorded as yours.

## 4. Mentioned records (key activation): built in 0.11.0, superseded in 0.14.0 (§1)

This is NovelAI's lorebook idea, applied to records instead of separate entries.

- **Keys.**
  - The record's name, and the name without "The", "A" or "An".
  - Each part of a proper name ("Ottavio", "Marrane").
  - A title role: "The Governor" gives "Governor".
  - An optional `keys` list on any record.
- **What is scanned.** The player's words this turn and the last two replies, matching whole words regardless of case.
- **What is skipped.** Anything already in the notes: you, the place, and the people, things, groups and history here.
- **What is sent.** One `[ Lore: … ]` entry per record, after the scene's own lore, within 800 tokens. The order:
  - Named by the player this turn first, then in the newest reply, then in the older one.
  - Within each: people, places, groups, history, then things.

## 5. Gaps found while mapping

Closed in 0.11.0–0.13.0:
- The player's appearance is sent.
- World lore, species and families are sent when named.
- World, faction and thing states reach the Scene.
- Items have whereabouts.
- Notes no longer collide with thoughts: thoughts moved to parentheses.

Still open:
- When a scene action reaches a terminal, the notice shows the shared note to the player even when it is the player's own state. The narrator does get the right words.

## 6. System prompt and prefill

### What Praxis sends

GLM-4.6's own chat format, sent to NovelAI's completions endpoint:
- the system message;
- the transcript, alternating user and assistant;
- the game's notes as a second system message, which GLM's format allows mid-conversation;
- the player's words, with `/nothink`;
- an empty think block as the prefill, so thinking stays off.

### What the research says

- **Xialong is GLM-4.6 fine-tuned on NovelAI's storytelling dataset.**
  - It is a story-continuation model, trained with NovelAI's own default system prompt.
  - Replacing that prompt reportedly pulls it back toward base GLM.
  - Prefill is hidden by default, because it moves the model outside its training.
- **Xialong expects NovelAI's story conventions:** an ATTG line with `[ S: 4 ]`, information under `----`, `***` for scene breaks, and spaced `[ Style: … ]` tags.
- **Users report it rushes,** ignores `{ }` instructions and writes the player's character.
- **GLM-4.6 is an untuned instruct model.** It follows a clear system prompt, and the instructions nearest the end of the context carry the most weight.
- **From the house's card-writing notes:** the model copies what it sees more than what it is told, and "never X" raises the chance of X. So the rules say what to do, and the opening shows the format.

### GLM-4.6: the rules, as sent in 0.13.0

```
You narrate a text adventure. The player plays {player}, written as "you". You play the world and everyone else in it.
Each reply is the next beat of the scene, and only that. Show how the world answers what the player just did, then stop where the player can act again. Time moves only as far as the player's action carries it. The player decides what {player} says, does, thinks and feels.
Notes in [square brackets] are outside the story: from the game, or from the player. They are true. Use what they say, in your own words, and keep the notes themselves out of the story.
- [ Lore ] notes are background: who someone is, what a place, group or piece of history is. Draw on them when they matter.
- The [ Scene ] note is how things stand right now: where you are, who is here and what they are doing, and what shows.
- An [ Outcome ] note is what the rules decided about what the player just did. It has already happened. Show it in this reply, and let it change what people do next.
When there is no Outcome, show the player's attempt and how the world answers it, and leave the result open. People who are not in the Scene stay offstage until a note says they arrive.
Write in second person, present tense, in concrete physical detail: what can be seen, heard, smelled and touched. One to three short paragraphs. Narration and action go in *asterisks*. Speech is plain text, with no quotation marks. Thoughts go in (parentheses), and nobody else hears them.
```

### Xialong: on hold

Leon's call: focus on GLM-4.6. When it comes back, Xialong gets its own prompt built the way NovelAI builds one:
- NovelAI's default system prompt, word for word.
- The story as continued text: ATTG, `----` information, `***`, the journal, then the transcript as prose.
- The notes as spaced bracket notes.

**Needed from Leon then:**
- NovelAI's default System Prompt and Prefill for Xialong, from the Advanced tab, in Storyteller and Text Adventure mode.
- One turn's Context viewer output in Text Adventure mode.

### Helper calls

Journal entries and compressions use their own short instruct prompts on GLM-4.6, with thinking off, whichever model narrates. The evaluator will do the same.

## 7. The house style

### The format

| What | How | On screen |
| --- | --- | --- |
| Narration and action | `*in asterisks*` | Upright, softer |
| Speech | Plain text, no quotation marks | Bright |
| Thoughts | `(in parentheses)`. Nobody else hears them | Italic, blue-grey |
| Notes outside the story | `[in square brackets]`, from the game or the player. The narrator takes them as true | Small, muted |

### Narration

- **Grounded.** State what is physically there: bodies, objects, weather, sound. Don't comment on it or tell the reader what it means.
- **Present.** Second person, present tense. One beat, then stop where the player can act. No summaries, no skipping ahead, no epilogues.
- **People are people.** NPCs want things and push back. Their dialogue sounds like them: it talks past the player, deflects and lies.
- **Consequences on the page.** A decided outcome shows in a body or an object, and it carries into what people do next.
- **Ordinary life in frame.** Someone eats, a dog scratches, the fog keeps coming in.
- **Avoid:**
  - feelings named instead of shown;
  - abstract metaphor in place of an image;
  - "Not X. Y." corrections;
  - guessing at absent people's motives;
  - quotable closing lines;
  - "unspoken" characterization;
  - asking the player what they do.

### Record fields

Each field has one job in the prompt, and the writing should fit that job.

| Field | Its job | Write it as | Port Covenant example |
| --- | --- | --- | --- |
| `description` | Who or what this is. Its **first sentence stands alone**, because a mention or a crowded room sends only that | Present tense, most useful fact first, one to three sentences | "An Arbiter on duty at the landward gate, with the Covenant's terms, ink, and a ledger of everyone who has signed." |
| `role` | A title or job, read after the name | A short noun phrase, no full stop | "The High Arbiter" |
| `appearance` | Read after "Looks:" | The body and what it carries; one tell at most | "Helmet strapped tight, cloak dark with fog-wet, leaning on a pike more than he should." |
| `personality` | Read after "Manner:" | Behaviours that can be tested in a scene | "Cold, bored and loyal to whoever pays the garrison." |
| `speech` | Read after "Speech:" | Rhythm, register, habits; no sample lines | "As few words as he can manage, most of them to the Arbiter." |
| Schedule `doing` | Read as "X is here, …" | A lowercase verb phrase, no full stop | "keeping the ledger at the landward gate" |
| Relationship `shape`, `together`, `wants` | A lore entry; `wants` is read after "X wants" | Fact and leverage; observable behaviour; a verb phrase | "her silence about the last ship" |
| Bond tiers | Read as "A and B: tier" | One sentence of behaviour per tier | "Every exchange is being scored." |
| Place `description` | Read in full in the Scene | What you sense on arrival, then what the place is for | "Where the headland road meets the colony wall…" |
| Band labels | Read as "You are …" or "Name …" | A predicate: "is strained", "has studied" | "is badly hurt" |
| `npcLabels` | The same bands, read about someone else | What it means for them, in story terms | "has given way to you: they believe you, back down or do as you ask" |
| Terminal `note`, `playerNote` | Read once, after the state's words, when it is reached | A consequence about "them", or about "you" | "They take no further part in this scene." |
| Scene action outcome | The Outcome | One fact, done, in "you" terms | "You sign the Covenant in the Arbiter's ledger…" |
| The module's opening | Sets the voice and format for everything after it | In the house style and format. The model copies it more than any rule | The fog at Nospier Point |

## 8. The Four Approaches on every record: built in 0.12.0

**The goal.** Anyone or anything in a scene can be acted on with the Four Approaches without an author building it. Authors add specific actions on top. Encounters can be made on the spot: if the story mentions a door or two guards, one tap makes a record for them and opens the roll.

### What each approach does, by kind

The table comes from which approach owns which state, plus **deeds**: acts with no state behind them, which simply work or fail. All of it is in the standard ruleset, `four-approaches/1`. A module that sets `ruleset.extends` gets it beneath its own rules, which win by id, so a world with no rules of its own is still playable.

| Kind | Force | Finesse | Focus | Flair |
| --- | --- | --- | --- | --- |
| **Person** | Hurt or overpower: **Health** down. At 0 they go down | Lift, slip past or plant: a **deed**. It works or it fails; failure raises the place's **Alert**, and Alert 2 or more adds a setback die to Finesse | Read them, find the pressure point: **Leverage** up | Persuade, charm, bluff or intimidate: **Strain** down. At 0 they give way. A triumph or despair moves your bond. Force can reach Strain too, as a secondary |
| **Thing** (door, chest, cart) | Break it or force it: **Integrity** down. At 0 it gives way | Pick it, work it loose, take it: **Security** down. At 0 it's open or free to take | Study it: **Prepared** up | No claim. Talking a thing round means talking to its keeper |
| **Place** | No claim | Lie low, cover your tracks: **Alert** down | Search it, learn its ways: **Prepared** up | No claim |
| **Group** | Not yet: groups aren't in the scene as records. Faction standing arrives in v0.4 | | | |

Leon's call on Finesse against a person: use the place's Alert rather than a separate Guard track. How hard a particular person is to rob is their Finesse difficulty.

### Focus: Leverage and Prepared

Focus rarely wins on its own. It builds an edge against one target that the other approaches spend.

- **Leverage**, on a person, is 0 to 2. Each point makes the next check against them **one step easier**.
- **Prepared**, on a thing or the place, is 0 to 2. Each point adds a **boost die** to the next check against it.
- A Focus success builds one point, plus one per extra success (and one for a triumph), up to 2.
- The next check against the same target by **another** approach spends all of it, unless the player switches it off on the check. Focus never spends its own edge.
- Failing Focus costs time (30 minutes, 15 for two threat). The narrator hears the edge as a fact ("You have something on the gate Arbiter.").

What a point is worth, as the chance to succeed against Average difficulty:

| Rating | Plain | Leverage 1 | Leverage 2 | Prepared 1 | Prepared 2 |
| --- | --- | --- | --- | --- | --- |
| 3 | 60% | 73% | 88% | 67% | 73% |
| 2 | 44% | 58% | 75% | 53% | 61% |
| 1 | 23% | 34% | 50% | 35% | 45% |

**How builds play.** Every approach starts at 1, with 4 points to add and a cap of 3.

- **Focus 3 with Flair 3.** A Focus 3 check against Average succeeds 60% of the time, and 34% of the time with two points. Reading someone before leaning on them lifts that Flair 3 from 60% to about 73% overall, for one more turn and the risk of losing time. Few states are Focus's own, so this build specialises further: it spends Focus to make its one strong approach stronger.
- **Focus 3 with two approaches at 2.** The same edge brings a 44% approach to about 58% overall. It's broader, and it leans on Focus to cover two middling approaches.
- **No Focus investment.** Every check is taken straight, with nothing to prepare.

### Difficulty

How hard a check is comes from the target, in this order:

1. Its own setting, per approach or `all`: 0–5, Simple to Formidable.
2. **Random**: Easy to Daunting, most often Average. It's derived from a seed every new save carries, so it stays fixed for that save and target.
3. Its tier: a minion is Easy, a rival Average, a nemesis Hard. Tiers also set Health and Strain unless the character's `maxima` say otherwise.
4. The module's default, Average.

A house built as a place with Hard Finesse and a door set to Random is then an encounter, with nothing else to author.

### Something in the story

The check screen has a **Something in the story** option:

1. Name it ("the warehouse door", "two dock guards").
2. Pick the kind: a thing, a person, or a group.
3. Pick the difficulty (Easy to Daunting, or Random) and, for people, a tier.

Praxis adds it to your records, here, and aims the check at it. A group is one record, like a Genesys minion group. Once the evaluator exists, writing "I kick the door" can offer "Force against the door?" as a one-tap suggestion. It never rolls without you.

### Validity

A module is complete with zero authored obstacles. Every person, thing and place offers the defaults, and the player can add anything the story mentions. Authored obstacles still work: the registry strongroom door in Port Covenant is Daunting to force and Hard to pick.

## 9. Decisions (Oct 16)

1. **Finesse against a person:** reuse Alert. It's built as a deed (§8).
2. **Focus outputs:** Leverage on people, Prepared on things and places (§8).
3. **Narration voice:** second person, present tense, a traditional text adventure.
4. **Xialong:** on hold. GLM-4.6 first.
5. **The format** (after testing 0.12.0):
   - speech plain, with no quotation marks;
   - *narration and action* in asterisks;
   - (thoughts) in parentheses;
   - [notes] in square brackets, outside the story.
6. **References:** GLM-4.6 material from outside NovelAI is fair game.
7. **The prompt, by rate of change** (after testing 0.12.0):
   - The system prompt is unchanging facts and directions.
   - What follows runs from rarely changing to every turn.
   - Nothing is repeated.
   - Lore goes where NovelAI's lorebook goes, when it is relevant.
   - A present person's full profile is lore; the scene says only that they are here, what they are doing and what shows.
   - Statuses are in words that mean something in the story.
   - A success says plainly how it changes what happens next.

8. **After reviewing 0.13.0:**
   - **Placement:** lore goes where NovelAI puts lorebooks; the dramatis personae comes after the location's lore; character lore switches on by key.
   - **Prefill:** conditions go in the reply's opening, as NovelAI's prefill does, and the outcome follows your words.
   - **Schedules:** they hold while you're with someone; people who aren't following may leave during Wait and Rest.
   - **Followers:** gated by a relationship or a condition. A bond kind marks the tier from which the person follows, defaulting to its warmest two.
   - **Wording:** every outcome and condition is brief and imperative, and says when more is needed.

9. **After playing 0.14.1 (Oct 17):**
   - The prefill must read cleanly.
   - Past rolls leave the narrator's context once resolved; only the story is kept.
   - Replies can be edited, or cut and continued.
   - A minion falls to one success.
   - Balancing progress against challenge comes later.

## Sources

- [NovelAI: Welcome Xialong](https://blog.novelai.net/welcome-novelais-newest-writing-model-xialong-ecde7d21d111)
- [NovelAI docs: Text models](https://docs.novelai.net/en/text/models/) (context 28,672 tokens; GLM-4.6 "untuned instruct")
- [NovelAI docs: Special symbols](https://docs.novelai.net/en/text/specialsymbols) (ATTG, `[ S: ]`, `----`, `***`, `{ }`)
- [NovelAI docs: Advanced settings](https://docs.novelai.net/en/text/editor/advancedsettings/) (system prompt and prefill per mode)
- [r/NovelAI digest of Xialong guidance](https://reddit.sentinel-team.org/posts/1s9fgew/snapshots/2026-04-03T15%3A05%3A24.89649Z) and [user report on rushing and ignored instructions](https://reddit.sentinel-team.org/posts/1sj1wva/snapshots/2026-04-18T05%3A02%3A48.04352Z) (community reports, not NovelAI's)
- *Four approaches on Genesys dice* (state catalog: Leverage, Prepared, obstacles)
