# Worldbuilding tools: the plan

Nov 12, 2026 · @AmbiProp · Claude's informed proposal, written after reading both bids and its own. **Waiting on the owner's approval.** The questions are under *For the owner*, each with a suggestion.

The brief is `brief.md`. Claude's own proposal, written before any bid was read, is `claude.md`. The bids are `chatgpt.md` and `gemini-3-8-worldbuilding.md`. ChatGPT says it read the repository's code but not the other proposal. Where it agrees with `claude.md`, that counts as two separate votes.

## The plan in six lines

1. **One field per call, plain text out.** Each draft is one field, written by a call that knows that field's shape. It comes back as text, never JSON, and the Studio does all the structure: IDs, links, reach and every write. That's why it works on every model.
2. **The talk settles facts, and the facts write the fields.** A short list, **Settled**, sits beside the chat. Errata proposes lines for it and the author takes them with a tap. Field writes read Settled first, and the recent talk only when there's room.
3. **Errata talks and never writes.** Her voice is in the chat's prompt and nowhere else. The calls that write drafts have no persona. They get the house rules and the world's own records as examples.
4. **A draft sits under its field until the author keeps it.** Keep, Edit, Again and Drop. Keep checks first that the field hasn't changed since the draft was made, and Undo puts the old text back.
5. **Questions and templates belong to the author, not the world.** They're a library in this browser. A world picks which list it uses. You can switch a question off, reword it or add your own, answer the list as a form, and share it as a small file.
6. **Build it in the order each part works alone:** generate buttons, then Errata on a record, then the questions, then the workshop, then the harder fields.

## Where the bids agree, taken as settled

All three proposals:
- generate buttons ship first, before any chat;
- one field per call, with the field's shape spelled out in that call;
- the field write is a separate request with **no Errata in it**, so her voice can't leak into a draft;
- no JSON from the model and no tool calling; the Studio parses lenient text and builds the record itself;
- the model never writes a record, and nothing changes without the author's Keep;
- on a wide screen the helper sits in the right-hand column, beside the writing;
- chats and drafts live in this browser and stay out of the world file;
- names get their own call, with the world's existing names listed;
- on weak models every action shrinks to one field, one question or one proposal;
- no background calls: the author starts every call and sees its cost.

## Where they differ, and the call

| Question | The bids | The call |
| --- | --- | --- |
| How a field write returns | Claude, ChatGPT: plain text. Gemini: inside `<draft>` tags, found by regex. | **Plain text.** A loose model misses a closing tag just as easily as any other instruction. If a model adds tags anyway, the cleanup strips them. |
| What a field write reads | Claude: Settled and the record, not the transcript. ChatGPT: confirmed facts plus a bounded slice of the talk. Gemini: the relevant turns. | **Settled first, then the recent talk when it fits.** At 8,000 tokens it's Settled alone. Settled is what the author has checked; the transcript is only what was said. |
| Prefill | Claude: start the reply with the field's title. ChatGPT: don't rely on it, especially on Xialong. | **Use it where the connection writes the start of the reply** (completions, which includes NovelAI). The cleanup does the same job without it, so nothing depends on prefill. |
| Can a write refuse | ChatGPT: reply `NEEDS:` and one question rather than invent. The others: no. | **Yes** (ChatGPT). The question lands in the chat, or under the field for a generate button. It's the plain fix for a model filling a gap with an invention. |
| The helper on a phone | Claude: a half-height sheet. ChatGPT: a full-height sheet with Back. Gemini: an 85% sheet with a floating pill. | **A door**, as the UI decision built: it fills the phone and has its Back in words. The keyboard squeezes a bottom sheet into a slit (Gemini's own risk). |
| Where a draft shows | Claude, Gemini: under its field on the page. ChatGPT: a Current/Draft switch. | **Under its field.** On a phone, where the page is hidden behind the door, the draft also shows in the door. Both are the same draft. The door's row on the page reads *2 drafts waiting* (Gemini's pill, as a door sentence). |
| Never sections | Claude, Gemini: not raised. ChatGPT: excluded unless the author opts in on each request. | **The record's own Never sections go, listed by title in What this sends. Other records' Never sections and every Notes field never go.** A thread's five questions are all Never, so writing Objective needs Pressure. The reach's hint changes to say so. This needs the owner's word (*For the owner*, 1). |
| Names | Claude: 8. ChatGPT: 3, asked for before any prose. Gemini: 5. | **Six, offered first on a new record**, because every later draft writes the name in (ChatGPT). The Studio checks them against every name and key in the world, folding case and spaces, whatever the model was shown. |
| Workshop proposals | Claude: `NEW/NAME/LINE/WHY` blocks. ChatGPT: up to three cards (Kind, Working name, Use, Facts, Open question), or *No new record needed*. Gemini: up to four `<record>` blocks with `inside:`. | **ChatGPT's cards plus Gemini's Inside.** Three at most, one at 8,000. *No new record needed* is a valid answer. |
| Accepting a proposal | Gemini: Create makes it. ChatGPT: build every field as a draft, then Create. Claude: a draft record. | **Make it** creates a thin record: kind, name, line, template sections, and a parent chosen with the picker. The proposal's Facts go into its Settled list, Use goes into its Notes, and Open becomes its first question. Then its fields draft like any record's. |
| Questions' home | Claude: stored on the world. ChatGPT: the author's library, with each world picking from it and a kit file to share. Gemini: hidden records inside the world. | **ChatGPT's.** The owner said everyone has their own template, so the questions belong to the author. Hidden records in a world would pollute its list and its export. |
| Temperature | Gemini: 0.3, to stop rambling. ChatGPT: 0.5 for writes, 0.7 for talk and names. | **ChatGPT's, as starting values.** At 0.3 the house's pulp comes out flat. |
| Keeping the chat | Claude, ChatGPT: kept per record in this browser. Gemini: capped at ten turns and purged on export. | **Kept, with both sides editable and a Delete.** No cap: packing trims what's sent, and Settled holds what was decided (Character Engine: the conversation is the prompt). |
| The workshop's reach | All: the whole world, cut down for a small window. | **The world, or one place and what's directly in it.** This is the same one-level unit the list and the map's sheets use, and it keeps a big world inside a small window. |

## The helper, on screen

Errata is a **door** on every record's page, after In context now. Its row says what's waiting: *Talk it through*, *3 settled*, or *2 drafts waiting*.

| Width | Where Errata is |
| --- | --- |
| Under 900 px | The door fills the screen. Its top line is *‹ Back to Dee Harlow*. A draft shows in the door with its buttons and *See it on the page*. |
| 900 to 1199 | The door takes the page's place, the same as other doors. Drafts land under their fields for when you go back. |
| 1200 and up | The door sits at the right, beside the writing. Drafts appear under their fields as they come. |

**In the door:** the chat, **Settled** (folded to its count, and open shows the list), the next question as a chip (*Ask me something* gives another), the box and Send, and **Write ▾**. Write lists the record's fields, empty ones first. **Write all empty** shows how many calls it will make and what they'll cost before it starts, then runs them one at a time.

**On every field:** a small **Draft** button, which is the generate button. It's the same call with no talk.

**The draft card** under a field: the text, which you can edit in place, then **Keep**, **Again** and **Drop**. Flagged words are underlined but never blocked. A `NEEDS:` answer shows as a question with a box to answer it. **Again** keeps the edited draft and makes a second one beside it, up to three. **Keep** writes that field only. If the field changed after the draft was made, Keep shows both versions and asks before writing. **Undo** stays on the field until it changes again.

**What this sends:** every call can show what it sends, laid out like In context now, with the token count, what was cut to fit, and any Never section by title.

**The workshop** is a row on the world's page, beside About, Rules, Checks and Map. It's also on a place's page: *Talk about Fenmire* scopes it to that place and what's directly inside it. It's one chat with its own Settled list, plus **Propose records**. Proposals are cards under the chat: kind, name, line, inside, use, facts and open question, each with **Make it** and **Not this**. A card is never in the record list until it's made. Anything the Studio can't read as a card shows as plain text with **Make a record from this**, which opens the same form for the author to fill.

**One session:** the author makes a character and opens Errata, who offers six names first. The author picks one or types their own. Errata asks the first question that's switched on. They talk, and the author takes Settled lines. Then **Write ▾ › Write all empty**: drafts land under the fields, and the author keeps, edits, asks again or drops each one. If the talk turns up a place that doesn't exist, **Take this to the workshop** carries the Settled lines the author picks, never the whole chat.

## What one call sends

Least changing first, so a provider that reuses a prompt's start can do so, and the author's words last:

| In order | At 8,000 tokens | What goes when it's short |
| --- | ---: | --- |
| The job: Errata's lines, or the writer's | 300 | Never cut |
| The house rules, plus the kind's own rule | 400 | Never cut |
| The world: name, genre, tone, premise | 300 | The premise drops to its first two sentences |
| The record: kind, name, line, and each section's title and text | 1,500 | Named, When and its own Never sections go first; then the rest shorten to their first sentence. The line never goes |
| What's near it, by line only: its place, its groups, records it names | 300 | **Cut first** |
| Settled and the next question | 600 | Never cut |
| The recent talk, whole exchanges, newest first | 2,000 | **Cut second**, oldest exchange first |
| The author's words, or the field's shape and examples | the rest | Never cut |

Each call keeps room for its reply (512 tokens for talk, the field's own cap for a write) plus 1,000 tokens of margin, because estimates miss. The window is what the connection lists for the model. When the provider doesn't list it, the Studio assumes 8,000 until the author sets a figure. If the parts that are never cut won't fit, nothing is sent: the Studio says what's too long and lets the author shorten it. A provider that rejects a request for length gets the same treatment, never an automatic retry.

## The prompts

`{braces}` are filled in by the Studio. Each prompt goes out in the model family's own format through the relay, the way Chat's side generations do (`core/chat/build.ts`, `kit/src/connection.ts`).

**The house rules** (`{house_rules}`, used by every prompt):
```
- Concrete and plain: what someone could see, hear or do in a scene.
- Behaviour, not adjectives: "Sells first and asks nothing", not "pragmatic and guarded".
- No metaphor, no stated feelings, no hedging. Never "a testament to", "tapestry", "palpable", or lists of three for effect.
- Names a reader can say on first sight. Plain words for things: dock, not staithe.
- The genre is {genre}. Don't assume swords or a medieval world unless it says so.
```
**The kind's rule** (`{kind_rule}`): for a character, *Show their kind in one or two traits and a colouring; never restate it.* For a place, *At most four named people here at once.* For proposals, *A place or a person exists only if a scene or a rule uses it.*

**A helper turn** (system):
```
You are Errata, the helper in Inkwyrm's Studio. The author is building {kind} "{name}" for the world "{world}".
How you talk: dry and brief. One question at a time. Call something good only when it is, in a few words. No flattery, no stage directions, no talk about yourself.
Your job: get answers that could be used in a scene. What someone does, what a place sounds like at night, who wants what. When an answer is vague, ask for the version you could see happen.
The record and the settled facts are true. Your own ideas are not settled until the author agrees. If the author contradicts a settled fact, say which one.
You don't write the record. When a part is ready, name it and tell the author to use Write.
When you suggest wording, follow these rules:
{house_rules}
{kind_rule}
End with each fact the author said or agreed to in this reply, one per line, starting "Settled: ". If there are none, just end.
Keep it under 120 words.
```
The user message: `World:` the world part, `This record:` the record, `Near it:`, `Settled:`, `Not yet asked:` (the next one or two questions that are on), then the talk as turns, then the author's words. With **Plain voice** set, the first two lines become *You are the helper in Inkwyrm's Studio… Talk plainly and briefly. One question at a time.* The workshop uses the same prompt, with *building the world "{world}"* or *working on {place} in "{world}"*, and its near part is the lines of the records in scope.

**A field write** (system, no Errata):
```
You write one part of a record for a story world. Write only that part, in the world's own voice: no heading, no preface, no quotes, no note to the author.
World: {world}. {genre}. {tone}
{house_rules}
{kind_rule}
Keep every settled fact. Don't contradict the record. Don't name new people or places the settled facts don't name.
If this part can't be written without a decision only the author can make, reply with exactly "NEEDS:" and one short question.
The part: {title}, {reach_words}. {shape}
{template_hint}
Like this, from this world:
{examples}
```
The user message: `{kind} "{name}": {line}`, `Settled:` (or *Nothing yet*), `Already written:` (the other sections, title and text), the recent talk if it fits, the author's direction if they gave one, and `Write {title}.` The prefill, where the connection allows one, is `{title}:` and a new line. `{examples}` holds up to two sections with the same title from other records of the same kind, kept text only, shortest first. With none, it's the pair *Weak: She is pragmatic and guarded. / Better: Sells first and asks nothing.* A generate button sends the same prompt with no Settled and no talk.

**The shapes** (`{shape}`) and their limits:

| Field | Shape sent | Cap | The Studio's check |
| --- | --- | ---: | --- |
| Line | One sentence, under 25 words. | 60 | Cut at the first sentence end |
| Keys | Other names someone in the story would use, separated by commas, at most six. | 60 | Split, trim, drop the record's own name and duplicates |
| An Always section | One or two sentences, under 40 words. It goes out every turn. | 100 | Cut at a sentence end |
| A Here section | Two to four sentences. | 250 | Cut at a sentence end |
| A Named or When section | Two to five sentences. | 300 | Cut at a sentence end |
| Its own Never section | Notes for the author, one to three sentences. | 200 | Cut at a sentence end |
| Set entries (W5) | One per line, "Name: what it is". | 400 | Each line becomes a separate new entry, kept on its own, never active or locked |
| A greeting (W5) | The character's first message. Actions in *asterisks*, speech plain. | 400 | Text only; the emotion is the author's |
| An event's words (W5) | One line: what they're doing. Never how they arrive. | 60 | The time, place and condition stay in their own controls |

The cleanup applies to every write: strip *Sure*, *Here is*, the field's own title, wrapping quotes, Markdown and `<draft>` tags. Cut to the cap at a sentence end. Underline the flagged words, from one list in one file. A reply that's empty, cut off or unreadable shows as **Unfinished**, with the raw text to copy from, and no Keep until it has been edited.

**A name call:**
```
Suggest six names for a {kind} in "{world}" ({genre}). Names a reader can say on first sight. No invented languages, no titles.
One per line, nothing else. None of these: {names_in_scope}
What it is: {line}
{settled}
```
The model sees as many existing names as fit. The Studio then checks every suggestion against the whole world.

**Proposing records** (system):
```
From the talk below, propose up to {n} new records this world needs. Propose one only if a scene or a rule would use it and no record already does that job. If none is needed, reply "No new record needed" and why.
Write each one like this, with a blank line between them:
Kind: character, place, group, item, lore, thread or scenario
Name: a short name, or Unnamed
Line: who or what it is to a stranger, in one sentence
Inside: the place it sits in, or nothing
Use: the scene or rule that needs it
Facts: up to two sentences, only from the talk
Open: one decision for the author
No JSON, no tables, no IDs.
{house_rules}
A place or a person exists only if a scene or a rule uses it.
```
The user message: `World:`, `Already here:` (the scope's records, one line each, by kind), `Settled:`, the talk, and the author's request. The Studio reads the labels in any case and any order, and fills a missing label from where the line sits. Inside is matched against the world's places, but the match only pre-fills the picker; the author confirms the parent. A proposal whose name is already in the world says so and offers **Open that one**.

## Default questions

Each question has its words, the field it mostly feeds, and whether it's on. These are the site's defaults. They're copied into the author's library the first time it's opened, and nothing reads them from the site after that.

**Character:** on by default: 1 to 6.
1. Who are they to a stranger, in one sentence? → Line
2. What would someone notice across a room? If their kind shows, how? → Appearance
3. What do they do when they don't like what they're seeing? → Personality
4. How do they talk to a stranger, and to someone they trust? → Speech
5. What do they do all day, and for whom? → Background
6. What do they want this month, and what's in the way? → Wants
7. Who would they lie for? → Background
8. What won't they do, even when it would help? → Personality
9. What do they keep on them? → Appearance

**Place:**
1. What is it to someone standing outside? → Line
2. Who runs it, and what happens here? → Entry
3. What do you hear or smell before you see it? → Atmosphere
4. Who's here at night that isn't here by day? → Atmosphere
5. What does a newcomer get wrong here? → Entry
6. What breaks, costs money or brings trouble if you stay? → Entry (off)

**Thread** (the five questions, worded for an author, then the beat):
1. What happens in three days if nobody does anything? → Pressure
2. What would someone see happen that makes this over? → Objective
3. Who or what resists, and what will it do next? → Opposition
4. What does chasing it cost whoever does? → Cost
5. What's different after, win or lose, and if it's left alone? → Consequence
6. What's the next thing that should happen in play? → Next beat

**The rest, short:** a group (what members do together, what it asks of them, how a member shows it); an item (what someone does with it, how you'd know it in a hand, what stops it being used); lore (when someone would need to know it, who acts differently because of it, whether it's fact, belief or dispute); a scenario (where and when play starts, who is there, what's already happening); a persona (who you are to these people, and what gives you a reason to act).

**The library**, opened from Settings › Questions and templates, and from Errata's own *Change these questions*:
- **Lists**, one per kind, as many as the author wants, each with a name (*Hard SF*, *Village*). Every question can be reworded, switched on or off, moved up or down, deleted, or pointed at a different field. Add puts a new one in.
- **Templates:** the sections a new record of each kind starts with, with their titles, reach and hints. Changing a template never touches a record that already exists.
- **A world picks** which list and which template each kind uses. That choice is stored in this browser beside the world, not in its file.
- **As a form:** the same list as boxes, one per question, each with **Ask Errata** for the ones the author is stuck on, and **Write all** at the end (Character Engine found that talking is the long way to type an answer you already know).
- **Sharing:** export as `<name>.kit.json` (`inkwyrm-kit/1`: lists and templates, never keys, chats or records). Import shows the list first, then adds it as a copy or replaces a list the author chooses.

## Weak models

| The model | What changes |
| --- | --- |
| 32,000 tokens and up | Everything. The workshop sees every line in its scope, and proposals go up to three. |
| 16,000 | Six exchanges of talk at most. The workshop sends only the kinds being discussed. |
| 8,000 | Field writes read Settled and the record, with no talk. Three exchanges of talk. One example per write. One proposal at a time. Names and the questions are unchanged. |
| Xialong, and other loose followers | Their own format, as Chat already sends them. `Settled:` and the card labels are read leniently, and anything unreadable becomes text the author picks from by hand. |
| No model, or a failed call | Templates, questions, the form, Settled and drafts already made all work. Only the calls stop. |

Nothing breaks if a model ignores a convention. Without `Settled:` lines, the author taps lines from the chat into Settled. Without card labels, *Make a record from this* takes over. Without prefill, the cleanup does the same job. Nothing retries without a tap, and **Shorter**, **Plainer** and **Again** each say they're a new call. A model that overplays Errata is fixed by **Plain voice**, and the workflow stays the same.

## What it won't do

- Write a record, a link, a reach, a condition or a rule number from what a model says. The Studio does those through its own controls.
- Read another record's Never sections, any Notes field, or an unkept draft into any call, play included.
- Retry, summarise, critique or repair in the background.
- Treat a flagged word as proof of bad prose, or a missing flag as proof of good prose.
- Assume a genre, or replace the author's own questions.

## The data

Nothing here touches the world file (`studio-world/1`). It sits in a separate IndexedDB database, `inkwyrm-author`, that belongs to the Studio, so `kit/src/worlds.ts` and its database stay as they are.

```ts
// One talk per record, and one per workshop scope.
interface Talk {
  worldId: string;
  recordId: string | null;          // null: the workshop
  scope: string | null;             // the workshop on one place, or the whole world
  turns: { id: string; from: 'author' | 'errata'; text: string; at: number }[];  // both sides editable
  settled: { id: string; text: string; taken: boolean }[];  // Errata's proposed lines wait untaken
  asked: string[];                  // questions answered or skipped
}

// A draft waiting under a field.
interface Draft {
  id: string; worldId: string; recordId: string;
  target: { field: 'name' | 'keys' | 'line' } | { field: 'section'; sectionId: string }
        | { field: 'set'; setId: string } | { field: 'greeting' } | { field: 'event'; eventId: string };
  base: string;                     // the field as it was when the draft was made; Keep compares it
  text: string;                     // edited in place
  state: 'ready' | 'needs' | 'unfinished';
  sent: { model: string; tokens: number; at: number };
}

// A workshop proposal, until it is made or dropped.
interface Proposal { id: string; worldId: string; kind: RecordKind; name: string; line: string; inside: string; use: string; facts: string[]; open: string }

// The author's library: inkwyrm-kit/1, which is also the export.
interface Kit {
  format: 'inkwyrm-kit/1';
  lists: { id: string; name: string; kind: RecordKind; questions: { id: string; text: string; feeds: string; on: boolean }[] }[];
  templates: { id: string; name: string; kind: RecordKind; sections: { title: string; reach: Reach; hint: string }[] }[];
}
// Beside it: which list and template each world uses, by world id.
```

The pure parts (packing a call, the prompts, the cleanup, reading cards, the name check) go in `studio/src/author/`, tested with canned bad replies: missing labels, prefaces, tags, a cut-off reply, a `NEEDS:`. Following the repository's rule, they move to `core/` only when Chat needs them. `newRecord` in `core/records/world.ts` takes an optional template in place of `TEMPLATES`. That's the only core change.

## Phases

| Phase | What | Shippable alone because | Done when |
| --- | --- | --- | --- |
| W1 | **Draft** on the line and every section; names first on a new record; the draft card with Keep, Edit, Again, Drop and Undo; the stale check; the cleanup and flags; `NEEDS:`; What this sends. | One tap gives an author something to react to. | Bad canned replies never overwrite a field. A changed field stops Keep. It works at 390 and 1280 px. |
| W2 | **The Errata door:** the talk, Settled, the default questions as chips, Write ▾ and Write all empty, drafts in the door and on the page, Plain voice. | It's the conversation the owner asked for. | Claude's Low Water session works end to end, with and without `Settled:` lines. |
| W3 | **The library:** lists and templates, a world's pick, the form, and the kit file. | Every author gets their own template. | A kit exported and imported keeps every word and reach. A changed template moves no existing record. |
| W4 | **The workshop,** on the world and on a place: proposals, Make it, Make a record from this, and Take this to the workshop. | It covers the bigger setting once single records draft well. | ChatGPT's flood-barrier session works with the card labels deliberately broken. *Not this* makes nothing. A duplicate name is caught. |
| W5 | **More fields:** keys, set entries, greetings, example messages, an event's words. | Each new field works on its own. | No draft changes anything but its own text. |

Before calling W1 and W2 done, the owner runs the same short tasks on a small local model, on Xialong and on a strong model, with their own keys. The Studio's version notes record what needed fixing by hand.

## Where it meets the maps work

Another session is building maps (M3, refining the ground, is next). The two pieces barely meet, and where they do it's additive:

- **The world file.** Maps owns `world.map` and the travel rules. This plan adds nothing to the world file.
- **`studio/src/route.ts`.** This plan adds the door `errata`, the page `workshop`, and a `scope`. M3 may add a tool to the map's address. Both changes are additive; whichever merges second rebases.
- **New places.** The workshop's **Make it** and M3's **Add a place here** both make a place with a parent through `newRecord`. M3 has to find a gap on a sheet whose centres are already stored. It should do that for **any child without a centre**, however it was made. Then a workshop place lands on a refined map with nothing extra. This is the one thing to pass to the maps session.
- **The world's page.** Workshop is a new row beside About, Rules, Checks and Map. M3 doesn't change that row.
- **Later, once both have landed:** M3's **Add a place here** can offer **Draft** for the new place's line (W1), and a place's **Talk about** is the same one-level scope as its sheet.
- **Shared files:** `studio/package.json`, `studio/README.md`, `docs/roadmap.md` and `docs/studio-brief.md`. Keep pull requests small and rebase before pushing, as `docs/studio-brief.md` already says.

W1 can start now, beside M3. Nothing in either waits on the other.

## Where `claude.md` was beaten

- **Never** (ChatGPT). Claude missed it completely, even though a thread's five questions all sit in Never sections, where the reach's own hint promises the model never sees them.
- **The stale check on Keep and Undo** (ChatGPT). Claude's Keep would have written over an edit made while the draft was coming.
- **`NEEDS:`** (ChatGPT). Claude gave a write no way to refuse, so a gap got filled with an invention.
- **Names before prose, checked by the Studio against the whole world** (ChatGPT). Claude only listed names to the model.
- **The proposal card** (ChatGPT, with Gemini's Inside), over `NEW/NAME/LINE/WHY`: Use, Facts and Open carry the house rule, and *No new record needed* lets the model say nothing is missing.
- **Questions in the author's library, not on each world** (ChatGPT). It matches what the owner said about templates better.
- **Real numbers for the budget, and stopping when the parts that can't be cut don't fit** (ChatGPT).
- **The half-height sheet on a phone,** overtaken by the doors the UI decision built and by Gemini's keyboard warning.
- **Field writes reading Settled alone,** softened: the recent talk goes when there's room (ChatGPT, Gemini).

What held: one field per call in plain text; Settled, which ChatGPT reached on its own as *confirmed facts*; Errata only in the chat; `Settled:` lines taken with a tap; prefill where it's available; the form; Write all empty with its cost shown; lenient reading with a hand-made fallback; and the phase order, with generate first and the workshop after questions (ChatGPT agreed).

## Credit

- **ChatGPT:** Never as a real boundary; the stale check and Undo; `NEEDS:`; names first and the whole-world name check; the proposal cards and *No new record needed*; the author's library with a kit file and templates kept separate from questions; the budget table and stopping before an oversized send; temperatures; no hidden retries; done-when tests with canned bad replies and live runs on three kinds of model; set entries never made active or locked; links set through pickers, never by a model's name.
- **Gemini:** the Inside label; the drafts count on the way into the helper; sharper questions (*what happens in three days if nobody does anything*, *what breaks or costs money if you stay*, *what do they keep on them*); the keyboard warning on phones; question lists named by genre.
- **Claude:** one field per call in plain text; Settled and `Settled:` lines; prefill; the form, from Character Engine; Write all empty; the cut order; the phase order.
- **New here:** the workshop scoped to a place, on the same one-level unit as the list and the map; Make it seeding the new record's Settled, Notes and first question from its card; the draft count as the door's sentence.

## For the owner

1. **Never sections and the helper.** Errata and the generate buttons would read a record's own Never sections. That's how a thread's questions write each other. They would never read another record's Never sections or any Notes. *Suggest:* yes, with the reach's hint reworded to *Your notes. Never sent in play; the helper reads them on this record.*
2. **Chats stay in this browser.** A world's export wouldn't carry its talks or drafts, so a shared world doesn't bring its author's working notes along. *Suggest:* yes. An *include my talks* option can come later if someone asks.
3. **Questions and templates belong to the author.** A world points at a list and doesn't carry it. Sharing a world with its questions means sending the kit file too. *Suggest:* yes.
4. **Plain voice.** A switch that turns Errata's manner off and leaves the same helper. *Suggest:* include it, off by default.
5. **Four people in a place.** A proposal that would put a fifth named person in one place gets a warning on its card, not a block. *Suggest:* warn.
6. **Write all empty.** Six calls for a new character. It shows the count and the cost and asks once. *Suggest:* keep it. One tap per field is the slow path, and it stays available.
