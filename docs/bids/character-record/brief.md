# Brief: the character record in the adventure, its shape and its process

Nov 20, 2026 · @AmbiProp · A design question put to several models. Read it without the repository. If you can read the repository (Google AI Studio can), follow `ai-studio.md` in this folder, which lists the files to read and the order to read them in.

## The question

Design the **character record** that an AI narrator plays from in Inkwyrm's text adventure, and the **process** that makes one:

- **The shape:** its fields, the question each field answers for the narrator, what goes in and what stays out, when each field reaches the narrator, what order the narrator receives them in, and how long each one is.
- **The process:** from a well-known source character, to a record of that character in their own world, to a person adapted into ours.

Then show that your shape works by writing one source character in it.

Each shape that's bid will be tested the same way: its source character is played blind on the narrator model (see *How the bids are tested*). The owner decides from play, not from the documents.

## The situation

Inkwyrm is a roleplay site. One side of it is a text adventure: an AI narrator plays the world and everyone in it, and a rules engine settles checks. The world is written as **records**: places, people, groups, lore and threads. The engine picks which records the narrator sees each turn.

The first world written for the adventure, Volungraiv, failed its first play-test on its people. The places and lore held up.

The lead, Hollis Crane, a gate-warden and innkeeper, read like a job description:
- **His personality was a list of reactions to the player.** 55 of the 59 Personality sentences across the world's eleven people react to something the player does: *asked about the room, he says it's let and pours you a drink; bribed, he takes it and does what he'd have done anyway; threatened, he calls a porter by name*. Most of those reactions are about the plot.
- **His warmth was offstage.** His one human detail, a dice game, happens on rest-day evenings.
- **His secret was the plot.** The complication meant to make him human became a plot secret.
- **The narrator had nothing to show.** When the player only looked at him and tried to read what made him tick, the narrator recited his backstory.

His source had been Captain Renault in *Casablanca*. Each stage of the process took more of the man out:
1. The source line kept the role: charming, corrupt, survives every change of masters.
2. The frame kept the role's job.
3. The fill turned the job into a table of reactions.

The same world's best people, a pit fighter and a trader, came from full character cards written for chat, with their personalities first.

The site's chat side builds characters a different way, and those characters hold up over long chats. One record model is meant to serve both chat and the adventure, so that pipeline matters here. *What exists*, below, has both.

## Who reads the record, today

These are the facts of the engine as it is. Your shape may ask for them to change; say what and why.

- **The narrator is often a small, fast model.** The first test ran on Gemini 3.8 Flash, with a context of about 28,000 tokens. A scene in the test used about 3,000.
- **It plays everyone present,** up to four named people in one scene. It writes in second person and present tense, one to three short paragraphs a turn.
- **It never sees greetings or example chats.** Those are chat-only. In the adventure, whatever the record's text says is all it has, and it copies the shape and voice of what it reads.
- **A present person is sent as one block:** name, line and kind, then **Looks**, **Manner** and **Speech** (from the record's Appearance, Personality and Speech sections; up to 500, 1,200 and 600 characters), then everything else flattened together.
- **Reach exists in the record model but the adventure only partly honours it.**
  - *Named* sections are meant to arrive when the talk turns to them; the adventure sends all of them with the person.
  - *When* sections are meant to arrive once a condition holds; the adventure drops them.
  - Both are fixable, and your shape can rely on them working.
- **A person not present** reaches the narrator as one line when they're mentioned by name or key.
- **The rules engine settles checks** and hands the narrator the result as plain sentences. One check is *reading* a person: Focus against them. Success gives the player Leverage on that person, and nothing in the record says what the leverage *is*.
- **People have schedules** (where they are, doing what, in times of day), a tier (how big a threat), states, goods and prices. These are rules, not text.

## What exists

1. **The record model.** A character is a name, keys, pronouns, a **line** (who they are to a stranger in one sentence), and **sections**: titled blocks of text, each with a **reach**.
   - The reaches: *Always*, *Here* (while they're present), *Named* (when the talk turns to it, by keys), *When* (once a condition holds) and *Never* (the author's notes, mechanics).
   - The default sections: Appearance, Personality, Speech, Background, Wants and Relationships.
   - Authors add, rename and reorder sections freely. The engine reads only titles, text and reach.
   - One record serves chat and the adventure. Greetings and example chats are chat-only parts of it.
2. **The chat standard,** which works. Each field answers one question.
   - *Personality*: how does this character respond? What they do when someone asks, refuses, flirts, lies, helps or hurts one of theirs; what they go after in an exchange; what they won't do.
   - *Speech*: how do the words come out? Sound, rhythm, register, words used and avoided, habits, how it shifts with mood or with whom.
   - *Appearance*: what would someone see, and what does the body do? Including involuntary tells.
   - *Background*, *Wants*, and keyed sections for the rest.
   - Its writers run a grounding step before the personality: tastes off the clock, what makes them laugh and snap, one real flaw. They also run stress tests: the rude user, the boring user, the user courting from the first message, cover the name.
3. **The module table,** which failed. The same fields, with Personality cut down to *what do they do when the player acts on them: asked, bribed, threatened, lied to, helped*. Its frame decided each person's **use** first (a door, a lever, a threat, a prize or a mark), then job, want, pattern and an "Aside" (one hobby).
4. **Profile Plus,** the owner's older template from an earlier tool: Presence, Drive, Pattern, Resistance, Conduct, Facets. Today it's a way of thinking a character through, not a shape.
5. **The source method.** A lead starts from a **source line** of behaviour: a known character, renamed and re-rooted. Personality, relationships and role are carried; looks, powers and names are re-skinned. *Known stories model dynamics, never names or details.*

## What's settled (not for bid)

- **The house writing rules.** Concrete and plain, with no aphorisms, no narrator evaluation and no comparisons. Names a reader can say on first sight. No glossary words (*dock*, not *staithe*). A person's species shows in one or two traits and a colouring.
- **People only if they're used.** A person exists only if a scene or a rule uses them. At most four named people in a place at once.
- **Schedules** run in times of day: morning from 6, afternoon from 12, evening from 18, night from 22.
- **One record model** for chat and the adventure. The adventure's shape has to live in titled sections with reaches, and a chat character must still work.

## Questions

Answer each, numbered as here.

1. **The shape.** For each field: its title, the narrator's question, what goes in, what stays out, its reach, its size for a lead, and where it sits in the order the narrator receives.
2. **The block.** Lay out exactly what the narrator receives for one present lead, in order, as it would read.
3. **The scales.** A lead, a supporting regular, a crowd or gang, an offstage power (a ruler such as a witch queen, mostly felt through her agents and her coin), and a member of a family. One shape at different sizes, or different shapes? Different processes?
4. **The process,** from a source line to a source record to an adapted record. Where does the owner check in, what does each checkpoint show them, and what is tested when?
5. **The adaptation.** What carries from the source unchanged, what is translated, what has to be added for our world, and what is dropped?
6. **The tests** a record must pass before play, and how it's play-tested.
7. **The demonstration.** Captain Louis Renault (*Casablanca*, 1942), written in your shape, **in his own world, untouched by ours.** Give each field as its own block, marked with its reach. Then add a table tying each field to a moment in the film. Paraphrase; quote a few words of a famous line at most.
8. **The engine.** What the adventure must change to deliver your shape, in plain terms.
9. **Your doubts.** Where your shape could fail, at most five.

## How the bids are tested

Each shape's Renault is put into a one-room test world: a café in a port town under occupation, with the person and the city renamed so the narrator plays from the record and not from its memory of the film. It's played on Gemini 3.8 Flash through the same scenes:
- the player only watches him;
- the player is rude, then charming;
- the player changes the subject;
- the player asks for something he controls;
- the player tries to read what makes him tick.

The question is whether someone who knows the film recognises the man.

Write your Renault so it can be dropped in as it stands: every field a block of text, each with its reach.

## Hand back

One markdown file, with the questions as its headings. Sign it with the model you are.
