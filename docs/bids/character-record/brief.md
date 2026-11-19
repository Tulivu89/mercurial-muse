# Brief: what a character record is in the adventure

Nov 19, 2026 · @AmbiProp · A brief for several models. It proposes what a character record is when an AI narrator plays it in a text adventure. It tests that proposal by asking for one record, written from a well-known film character. Read it without the repository, or, if you can read the repository, with the files listed at the end.

## The situation

Inkwyrm is a roleplay site. One side of it is a text adventure: an AI narrator plays the world and everyone in it, and a rules engine decides the outcome of checks. The world is written as **records**: places, people, groups, lore and threads. The engine picks which records the narrator sees each turn.

The first world written for the adventure failed its first play-test on its people. The places and lore held up. The people didn't. The lead, a gate-warden and innkeeper, read like a job description:

- Every line of his personality was a reaction to something the player might do to him (*asked about the room, he says it's let and pours you a drink; bribed, he takes it and does what he'd have done anyway*). Most of those reactions were about the plot.
- When the player just looked at him and tried to read what made him tick, the narrator had nothing present to show. It recited his backstory instead.

His source had been Captain Renault in *Casablanca*. The record kept the role (charming, corrupt, survives every change of masters) and lost the man: the wit, the appetite, the soft spot, the line he won't cross until he does.

So this round starts over, from what the narrator needs. We test the record on a **source character first, untouched by our world**. A source character is a known quantity. If a record of Renault, played by the narrator, doesn't come out as Renault, the record's shape is wrong, and no adaptation could fix it. Adapting him into our world comes in round 2.

## Who reads the record

A narrator model, often a small fast one (the first test ran on Gemini 3.8 Flash), with these limits:

- It plays everyone present, up to four people in one scene, in second person, one to three short paragraphs a turn.
- It never sees example chats or greetings. **Whatever the record says is all it has.** It copies the shape and voice of what it reads.
- It gets a present person as one block: the head (name, line, kind), then **Looks**, **Manner** and **Speech** (each cut at 420 characters today, and we'll raise that for leads), then their history and other sections.
- Sections marked *Named* are meant to arrive only when the talk turns to them. Sections marked *When* arrive only once a condition holds, such as a milestone reached or a standing earned.
- The rules engine settles checks and hands the narrator the result as plain sentences. One check is *reading* a person (Focus against them). A success gives the player Leverage on that person, and the record has to say what the leverage *is*.

## The record, proposed

One record for every person the narrator can meet. Each field answers one question the narrator asks while playing them. A fact lives in exactly one field.

| Field | Reach | The narrator's question | Write |
| --- | --- | --- | --- |
| **Line** | Always, and in lists | Who is this, in one sentence, to someone who has never met them? | Job, place, and the one thing a stranger would look at twice |
| **Appearance** | Here | What would I see and feel, standing in front of them? | Build, face, colouring; how the body moves and rests; **their presence** (what the room feels like with them in it); **one tell that shows their mood in any scene**. No clothes, no voice |
| **Manner** | Here | How do they behave in a scene? | In this order: **(1) what they're doing and after when nobody acts on them**, their default in any room; **(2) how they treat a stranger, a friend, someone above them and someone weaker**; **(3) what amuses them, what irritates them, and a pleasure they take in plain view**; **(4) what they won't do**; **(5) a few *when this, they do that*, no more than two about their job or the plot** |
| **Speech** | Here | How do the words come out? | Sound, rhythm, sentence length, register, habits, how it shifts with mood or with whom. **One special word at most.** No sample lines |
| **Today** | Here | What do they want out of this evening? | A small want, met or missed in one scene, that isn't the plot |
| **The read** | Named (a successful read) | What does a careful look at them show? | The truth under the tell: what they hide, what moves them, where they'd give. This is what Leverage means |
| **Wants** | Named | What are they after, over months? | The long want, and what's in the way. The plot's hooks go here, written as what *this* person does about the plot |
| **Ties** | Named, by the other's name | Who matters to them, and how? | One line each for two to four people: what they do when that person is near or named |
| **Background** | Named | What comes up when someone asks about their past? | Only what a scene could bring up. Never a past that explains the Manner |
| **When sections** | When | What changes after this? | Only what changes, and someone moves somewhere or seeks someone out |

**Sizes for a lead:** Appearance about 400 characters, Manner about 800, Speech about 400, Today one or two sentences, each Named section 40 to 90 words.

**How it maps to Profile Plus** (the owner's older character template, a way of thinking a character through):
- Presence → Appearance's presence.
- Drive → Manner (1) and Today.
- Pattern → Manner (1) and (5).
- Resistance → Manner (4) and The read.
- Conduct → Manner (2).

**The tests a record must pass** (from the site's chat-character pipeline, which works):
- **Cover the setting.** Take away the world and the plot. If nothing is left, it's a job description.
- **The boring player.** The player sits near them and only watches. The narrator must have something to show.
- **The rude, the courting and the off-topic player.** They react as only they would.
- **Cover the name.** In a scene with three others, can you tell which lines are theirs?
- **Take their measure.** A successful read shows something true that was not in Looks.

## The process, from a source

1. **The source line.** The character, the work they're from, and one sentence on why they fit the part.
2. **The source record (this round).** The character in the fields above, *in their own world*, written from the source alone. Everything in it can be checked against the work. Nothing comes from our world.
3. **The play-test.** The source record goes into a small test world with the name and city changed, so the narrator plays from the record and not from its memory of the film. It's played through the five tests above on the narrator model. Pass: someone who knows the film recognises the man.
4. **The adaptation (round 2).** The source record, plus the person's line in our world, gives the adapted record, with a table of what was kept, translated, added and dropped.
5. **The same play-test, in our world.** Compared with step 3.

## What an adaptation adds (round 2, for the critique)

What carries over unchanged is the person: Manner, the shape of Speech, Today's kind of want, The read. What the adaptation adds:

1. **A name** the reader can say on first sight. Source names, famous lines and signature details never carry over: known stories model dynamics, never names or details.
2. **A kind:** their species in one or two traits and a colouring, and how being that kind changes how others treat them.
3. **A job and a place:** our world's equivalent of their role; home, work and a daily schedule.
4. **A background** in our world's history that would produce the same person. The source's turning point is re-rooted, not copied.
5. **Groups:** faction, family and species, and their standing in each.
6. **Ties:** the source's key relationships mapped onto people in our world. The shape of a relationship carries; the people are ours.
7. **Words:** their idiom translated into our world's terms, with one special word at most.
8. **Things:** their props re-skinned. A roulette wheel becomes a knucklebones table.
9. **The plot hook, last:** Wants and When sections, as what this person does about our thread.
10. **The rules:** a tier, approaches, difficulties, a price and goods.
11. **What they explain:** what this person tells a newcomer, in their own interest. A man who sells something explains what it is.

## Do different people need different processes?

The proposal is one record shape, at different scales:

| Scale | Who | What changes |
| --- | --- | --- |
| **Lead** | A person a thread turns on | Everything above, from a named source |
| **Support** | A regular, a worker, a face in the place | Line, Appearance, Manner (1), (2) and two reactions, and Speech. The source can be a type (*the barman who has heard everything*) rather than a named character |
| **Crowd** | A gang, a crew, a band of Golkin | A look, its moves and its talk. A function by design |
| **Power** | A ruler or force mostly offstage, such as the Witch Queen | Two records. **(a) Lore:** how her reach looks in each place (her coin, her agents, what people say), keyed to where the player is. **(b) The person:** written as a lead, but met rarely, as an event. Her source is chosen for how she rules |
| **Family member** | One of a family | **The family is sourced first, as a unit:** who rules it, who rebels, what they fight about, and what the city thinks of them. It becomes a family group record, which holds what members share so no member repeats it. Then each member, from the family's source, with a family role (heir, the one who left, the fixer) in their Ties |

## What to hand back

1. **Captain Louis Renault's source record** (*Casablanca*, 1942), in the fields above, in his own world. Use about the sizes above. Paraphrase rather than quote; a few words of a famous line at most.
2. **A table:** for each field, the moment in the film it rests on.
3. **The five tests,** run in your head: one or two lines each on what the narrator would show.
4. **Your critique of the record** in at most ten bullets: a missing field, one that should go, a reach that's wrong, a size, and anything about the scales or the adaptation list.

Hand back one markdown file.

## If you can read the repository

`Tulivu89/mercurial-muse`. Read in this order:
1. `CLAUDE.md`, for the writing rules.
2. `docs/content/volungraiv/run-1.md` and `review-1.md`, for what failed and why.
3. `docs/content/standard.md`, *A character's fields*.
4. `docs/content/modules/process.md`, *Every field has one job*. This is the version that failed.
5. `adventure/src/engine/context.ts`, `profile()`, for what the narrator is sent.
6. `content/volungraiv/world.json`, record `hollis`, for the record that failed.

Don't read this folder's `claude.md` before your answer is written.
