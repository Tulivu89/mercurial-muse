# Worldbuilding tools: the plan

Nov 12, 2026, revised the same day · @AmbiProp · Claude's informed proposal, written after reading both bids and its own, then revised after reading Story Engine 0.15 and *Prompt Engineering Principles*. **Approved by the owner on Nov 12**, with every suggestion under *For the owner* taken except the second: talks get an export of their own. W1 was built the same day (Studio 0.13.0).

The brief is `brief.md`. Claude's own proposal, written before any bid was read, is `claude.md`. The bids are `chatgpt.md` and `gemini-3-8-worldbuilding.md`. ChatGPT says it read the repository's code but not the other proposal. Where it agrees with `claude.md`, that counts as two separate votes.

## How the plan got here

| When | What | Why |
| --- | --- | --- |
| Nov 12, first | The plan from the two bids and `claude.md`. | The bid process (`docs/bids/README.md`). |
| Nov 12, second | Errata asks in rounds of answers to pick from. The record's own Never sections become the canon behind what the narrator sees. Prompts no longer name the words they forbid. A wrong answer is sent back once with the fix. A record can be tried in a scene before it's kept. A Check call is added. Prompts are tested by how they behave, not by their wording. | The owner shared Story Engine 0.15 (`keilladraconis/NAI-story-engine`, pull request 40, built on GLM 4.6) and added `docs/Prompt Engineering Principles.md`. What each changed is below, under *What Story Engine and the principles changed*. |
| Nov 12, approved | The owner's answers: every suggestion stands, and talks and drafts get an export of their own, apart from the world's. | The owner. |

## The plan in seven lines

1. **One field per call, plain text out.** Each draft is one field, written by a call that knows that field's shape. It comes back as text, never JSON, and the Studio does all the structure: IDs, links, reach and every write. That's why it works on every model.
2. **Errata asks in rounds you pick from.** The Studio chooses the next questions from the author's own list, and the model offers three or four concrete answers to each. A pick goes straight into **Settled**, and the Studio writes that line, not the model. Free talk stays open beside it.
3. **Settled writes the fields.** Field writes read Settled first, and the recent talk only when there's room. Errata has no part in a field write: it gets the house rules and the world's own records as examples.
4. **What's kept back stays behind; what's seen goes in front.** A record's Never sections are its canon. A visible section is written to show them only as something a person could notice. The narrator treats everything it reads as known to everyone in the scene.
5. **A draft sits under its field until the author keeps it.** Keep, Edit, Again and Drop. Keep checks first that the field hasn't changed since the draft was made, and Undo puts the old text back. A wrong answer goes back to the model once, with the exact fix.
6. **Ideas get proof.** **Try a scene** plays a record, drafts included, in a short scene through the play prompt itself. The author sees how it plays before keeping anything.
7. **Questions and templates belong to the author,** in a library in this browser that each world picks from. Build in the order each part works alone: generate buttons, Errata, Try a scene, the library, the workshop with Check, then the harder fields.

## Where the bids agree, taken as settled

All three proposals:
- generate buttons ship first, before any chat;
- one field per call, with the field's shape spelled out in that call;
- the field write is a separate request with **no Errata in it**, so her voice can't leak into a draft;
- no JSON from the model and no tool calling; the Studio reads plain text and builds the record itself;
- the model never writes a record, and nothing changes without the author's Keep;
- on a wide screen the helper sits in the right-hand column, beside the writing;
- chats and drafts live in this browser and stay out of the world file; they have an export of their own (the owner, Nov 12);
- names get their own call, with the world's existing names listed;
- on weak models every action shrinks to one field, one question or one proposal;
- the author starts every call and sees its cost.

## Where they differ, and the call

| Question | The bids | The call |
| --- | --- | --- |
| How a field write returns | Claude, ChatGPT: plain text. Gemini: inside `<draft>` tags, found by regex. | **Plain text.** A loose model misses a closing tag just as easily as any other instruction. If a model adds tags anyway, they count as decoration and are ignored. |
| What a field write reads | Claude: Settled and the record, not the transcript. ChatGPT: confirmed facts plus a bounded slice of the talk. Gemini: the relevant turns. | **Settled first, then the recent talk when it fits.** At 8,000 tokens it's Settled alone. Settled is what the author has checked; the transcript is only what was said. |
| Prefill | Claude: start the reply with the field's title. ChatGPT: don't rely on it, especially on Xialong. | **Use it where the connection writes the start of the reply** (completions, which includes NovelAI). The reading code doesn't need it. |
| Can a write refuse | ChatGPT: reply `NEEDS:` and one question rather than invent. The others: no. | **Yes** (ChatGPT). The question lands in the chat, or under the field for a generate button. |
| The helper on a phone | Claude: a half-height sheet. ChatGPT: a full-height sheet with Back. Gemini: an 85% sheet with a floating pill. | **A door**, as the UI decision built: it fills the phone and has its Back in words. The keyboard squeezes a bottom sheet into a slit (Gemini's own risk). |
| Where a draft shows | Claude, Gemini: under its field on the page. ChatGPT: a Current/Draft switch. | **Under its field.** On a phone, where the page is hidden behind the door, the draft also shows in the door. Both are the same draft. The door's row reads *2 drafts waiting* (Gemini's pill, as a door sentence). |
| Never sections | Claude, Gemini: not raised. ChatGPT: excluded unless the author opts in on each request. | **The record's own Never sections go, as canon the draft must not give away.** Other records' Never sections and every Notes field never go. Story Engine reached the same split from the other side (*For the owner*, 1). |
| Names | Claude: 8. ChatGPT: 3, asked for before any prose. Gemini: 5. | **Six, offered first on a new record**, because every later draft writes the name in (ChatGPT). The Studio checks them against every name and key in the world, whatever the model was shown. |
| Workshop proposals | Claude: `NEW/NAME/LINE/WHY` blocks. ChatGPT: up to three cards (Kind, Working name, Use, Facts, Open question), or *No new record needed*. Gemini: up to four `<record>` blocks with `inside:`. | **ChatGPT's cards plus Gemini's Inside, after a READING line.** Three at most, one at 8,000. *No new record needed* is a valid answer. |
| Accepting a proposal | Gemini: Create makes it. ChatGPT: build every field as a draft, then Create. Claude: a draft record. | **Make it** creates a thin record: kind, name, line, template sections, and a parent chosen with the picker. The card's Facts go into its Settled, Use goes into its Notes, and Open becomes its first question. |
| Questions' home | Claude: on the world. ChatGPT: the author's library, each world picking from it, plus a kit file to share. Gemini: hidden records inside the world. | **ChatGPT's.** The owner said everyone has their own template, so the questions belong to the author. |
| Temperature | Gemini: 0.3, to stop rambling. ChatGPT: 0.5 for writes, 0.7 for talk and names. | **ChatGPT's, as starting values.** The live tests below set the final ones. |
| Keeping the chat | Claude, ChatGPT: kept per record in this browser. Gemini: capped at ten turns and purged on export. | **Kept, with both sides editable and a Delete.** Settled holds what was decided; the talk is kept so the author can go back to it. |
| The workshop's reach | All: the whole world, cut down for a small window. | **The world, or one place and what's directly in it.** This is the same one-level unit the list and the map's sheets use, and it keeps a big world inside a small window. |

## What Story Engine and the principles changed

Story Engine 0.15 drops "yes-and" chat for rounds of multiple choice. It keeps a canon behind the lorebook and distills the lorebook from it, proves ideas with short vignettes before writing canon, and has a critic file problems for the author to fix. Its author says GLM 4.6 isn't the right tool for this job, so these are ideas, not a model to copy. *Prompt Engineering Principles* is written for prompts that must decide the same way every time. Its rules on what the model is given to read, sampling and reading the output apply to ours too.

| The idea | From | What changes here |
| --- | --- | --- |
| Rounds of options instead of yes-and talk. Options are where the model shows it understands the premise, and an option nobody picks costs nothing. | Story Engine's facilitator | Errata's questions come with three or four answers each. A pick is settled by the Studio. This is easier for a weak model too: picking one of four concrete answers asks less than holding a conversation. |
| The code decides what's still needed; the model reads and invents. | Both | The Studio picks the next questions from the author's list and the empty fields, then checks names, duplicates, kinds and lengths. The model is never asked to count anything or check whether something is in a list. |
| A canon behind what the story model reads. *The story model writes whatever it is shown as known to everyone.* | Story Engine's distill | Never sections are the record's canon. Writes for visible sections read them and show them only as behaviour. Check reports a visible section that gives one away. |
| Telling a model what must not happen puts it in front of it. | Story Engine's limits; the principles' *examples are copied* | Generation prompts no longer list *tapestry* and the like. They state the rule positively and show a weak line next to a better one. The word list moves to the check. |
| Invalid output is rejected and resent with the exact fix, a bounded number of times. A parser that repairs wrong content hides the defect. | The principles | **One resend with the fix**, counted before the call (*1 call, 2 if the first is rejected*). A second failure shows as Unfinished. Decoration is tolerated: case, spacing, Markdown, a preface line. Wrong content is rejected: two sentences in a Line, a sentence among the keys, a kind that isn't one, an answer over its length. The silent cut at a sentence end is gone. |
| Write the reasoning before the verdict: a READING line or a fix plan before the answer. | Both | Rounds, proposals and Check open with a READING line, which is kept in What this sends and never shown as the answer. A fix from Check writes its plan, then the section. |
| Never truncate the input; reduce each call's scope instead. | The principles | The record being written always goes whole. Its neighbours go as their lines. When a call still won't fit, its scope shrinks (a write drops the talk) or it stops and says so. Old talk falls out of the window only once Settled carries what it decided. |
| Ideas need proof before they become canon. | Story Engine's vignettes | **Try a scene**, its own phase. |
| A critic that only reports real problems, quoting the words at fault, with NONE allowed. | Story Engine's critic | **Check** on a record or a workshop scope. Fix turns one problem into a draft. |
| A prompt is tested by what the model does, never by its wording. Weak models expose ambiguity. | The principles | A live test kit the owner runs with their own keys: each prompt runs twenty times at its shipped temperature, and every failing run is counted. CI keeps tests with canned replies for the reading code. |
| Story models get frames, not instructions. | Story Engine's workshop sends | Where the helper's model is a story model through completions, a field write can go as a frame instead: the record as the narrator reads it, with the field's title left open at the end. The live tests decide, for each format, whether the frame or the instruction prompt is kept. |
| An instruction model for the structure, the story model for the prose. | Story Engine (GLM beside the story model) | **A helper model** in Settings, apart from the model used for play. It's the same model unless the author picks another (*For the owner*, 10). |

**Not taken:**
- **Building the whole canon hands-off.** Story Engine plans the documents and drafts every one in turn. That breaks the owner's rule that the model never writes a record. The workshop on a place (*what's missing in Fenmire?*) is the version under the author's hand, one level at a time, each card taken by hand.
- **A model rewriting the whole brief every turn.** Story Engine spends two calls a turn, and on a weak model a full rewrite drops facts. Settled is held by the Studio and only grows by the author's taps.

## The helper, on screen

Errata is a **door** on every record's page, after In context now. Its row says what's waiting: *Talk it through*, *3 settled*, or *2 drafts waiting*.

| Width | Where Errata is |
| --- | --- |
| Under 900 px | The door fills the screen. Its top line is *‹ Back to Dee Harlow*. A draft shows in the door with its buttons and *See it on the page*. |
| 900 to 1199 | The door takes the page's place, the same as other doors. Drafts land under their fields for when you go back. |
| 1200 and up | The door sits at the right, beside the writing. Drafts appear under their fields as they come. |

**In the door:**
- **A round** at the top: up to three of the author's questions, each with its answers as chips, a line on what each one means, and room to type your own. **Take these** settles the picks. **Other answers** asks again with what was passed over listed, so it isn't offered twice. **Ask me something** starts a new round.
- **Settled**, folded to its count. Open it to read, edit or remove a line.
- **The talk:** a box and Send for anything that isn't a question, with Errata's replies.
- **Write ▾**, listing the record's fields with the empty ones first. **Write all empty** shows how many calls it will make and what they'll cost before it starts, then runs them one at a time.
- **Try a scene.**

```
┌ ‹ Back to Dee Harlow ─────────── Errata ┐
│ When a driver she doesn't like pulls up │
│ ( Makes them ask twice ) ( Slow change )│
│ ( Wrong ticket, on purpose ) ( Smiles ) │
│ [ your own…                           ] │
│ Who does she let through for free?      │
│ ( Her brother's van ) ( Nobody, ever )  │
│ ( Off-duty police ) ( Anyone at 3 a.m. )│
│ [Take these]  Other answers · Ask more  │
│ Settled (4) ▸                           │
│ [ talk…                          ] Send │
│ Write ▾ · Try a scene                   │
└─────────────────────────────────────────┘
```

**On every field:** a small **Draft** button, which is the generate button: the same call with no talk.

**The draft card** under a field:
- The text, which you can edit in place, then **Keep**, **Again** and **Drop**.
- A `NEEDS:` answer shows as a question with a box to answer it.
- **Again** keeps the edited draft and makes a second one beside it, up to three.
- **Keep** writes that field only. If the field changed after the draft was made, Keep shows both versions and asks before writing. **Undo** stays on the field until it changes again.

**Try a scene:** pick who and where, as In context now does, and the moment it's set in. The record goes in **as kept** or **with its drafts**. A short scene (about 300 words) comes back through the same prompt play uses: Chat's for a character on its own, the narrator's for a world. It's never saved. **Again** and **Change who's here** are there to try more. A scene that shows the problem is the cue to go back and redraft.

**What this sends:** every call can show what it sends, laid out like In context now: the token count, what was left out to fit, each Never section by title, and the model's READING line once the reply is back.

**The workshop** is a row on the world's page, beside About, Rules, Checks and Map. It's also on a place's page: *Talk about Fenmire* scopes it to that place and what's directly inside it. It has the same rounds, Settled list and talk, plus **Propose records** and **Check**:
- Proposals are cards under the chat: kind, name, line, inside, use, facts and open question, each with **Make it** and **Not this**. A card is never in the record list until it's made. Anything the Studio can't read as a card shows as plain text with **Make a record from this**, which opens the same form for the author to fill.
- **Check** (also on a record's Errata door) lists problems, each quoting the words at fault, with **Fix** (a draft for that section, solving that one problem) and **Dismiss**.

**One session:** the author makes a character and opens Errata, who offers six names first. The author picks one or types their own. A round of three questions follows, and the author picks and adds a line of their own. Two more rounds, then **Write ▾ › Write all empty**: drafts land under the fields. **Try a scene with the drafts** shows her at the booth with a driver, and her Speech draft reads stiff in play. **Again** on Speech, then Keep. If the talk turns up a place that doesn't exist, **Take this to the workshop** carries the Settled lines the author picks, never the whole chat.

## What one call sends

Least changing first, so a provider that reuses a prompt's start can do so, and what's being decided last:

| In order | At 8,000 tokens | When it's short |
| --- | ---: | --- |
| The job: the round's, the talk's, the writer's or the checker's | 300 | Never left out |
| The house rules, plus the kind's own rule | 300 | Never left out |
| The world: name, genre, tone, premise | 300 | The premise goes as its first two sentences, its compact view |
| The record: kind, name, line, and every section's title and text, its own Never sections included | 1,500 | **Never left out.** If the record alone won't fit, the call stops and says so |
| What's near it, by line only: its place, its groups, records it names | 300 | **Left out first** |
| Settled, and the questions for this round | 600 | Never left out |
| The recent talk, whole exchanges, newest first | 2,000 | **Left out second**, oldest first, and only exchanges whose picks and settled lines are already in Settled |
| The author's words, or the field's shape and examples | the rest | Never left out |

Each call keeps room for its reply (512 tokens for talk, the field's own cap for a write) plus 1,000 tokens of margin, because estimates miss. The window is what the connection lists for the model. When the provider doesn't list it, the Studio assumes 8,000 until the author sets a figure. When the parts that are never left out won't fit, nothing is sent: the Studio says what's too long. A provider that rejects a request for its length gets the same treatment.

## The prompts

`{braces}` are filled in by the Studio. Each prompt goes out in the model family's own format through the relay, the way Chat's side generations do (`core/chat/build.ts`, `kit/src/connection.ts`). No prompt carries history, rationale or a list of banned words. Every example is filled in, because a model copies a placeholder back (Story Engine found this with GLM). Every example is from a setting the worlds don't use, and shows a weak line beside a better one.

**The house rules** (`{house_rules}`):
```
How this world's records are written:
- Concrete and plain: what someone could see, hear or do in a scene.
- Behaviour, not adjectives. Weak: "She is pragmatic and guarded." Better: "Sells first and asks nothing."
- Names a reader can say on first sight, and plain words for things.
- The genre is {genre}. Its own things, in its own words.
```
**The kind's rule** (`{kind_rule}`): for a character, *Their kind shows in one or two traits and a colouring.* For a place, *At most four named people here at once.* For proposals, *A place or a person exists only if a scene or a rule uses it.*

**A round** (system):
```
You are Errata, the helper in Inkwyrm's Studio. You are helping the author build {kind} "{name}" for the world "{world}".
The author answers your questions by picking. Under each question below, write three or four answers the author could pick.
Each answer:
- fits this record, this world and its genre, and is clearly different from the others;
- is something you could see happen in a scene;
- stays inside what the author has given: no secret, danger or twist they didn't ask for.
The author can always answer in their own words, so never offer "other".
{house_rules}
{kind_rule}
Write exactly this, nothing else:
READING: one or two sentences for yourself: what the record already has, and what these questions turn on.
LEAD: one short sentence to the author, dry and brief.
then, for each question, its number, and its answers as a dash, the answer, a bar, and a few words on what it means, like this:
### 1
- Counts the change twice | makes a show of not trusting anyone
- Pockets the tip without a word | quiet, and keeps a little back
Write real answers only; never copy the example.
```
The user message: `World:`, `This record:`, `Near it:`, `Settled:`, any answers already passed over for these questions (*Don't offer these again:*), then `Questions:` numbered, in the author's own words. The Studio reads each `###` number back to its question. An answer whose bar is missing is read as the answer with no note. A pick becomes the Settled line *`{question}`: `{answer}` (`{note}`)*, written by the Studio.

**A talk turn** (system):
```
You are Errata, the helper in Inkwyrm's Studio. You are helping the author build {kind} "{name}" for the world "{world}".
How you talk: dry and brief. Call something good only when it is, in a few words. No flattery, no stage directions, no talk about yourself.
The record and the settled facts are true. Your own ideas are not settled until the author agrees to them. If the author says something that can't be true alongside a settled fact, quote the fact.
You don't write the record. When a part is ready, name it and tell the author to use Write.
{house_rules}
End with each fact the author said or agreed to in this reply, one per line, starting "Settled: ". If there are none, just end.
Keep it under 120 words.
```
The user message: the world, the record, `Near it:`, `Settled:`, the talk as turns, then the author's words. `Settled:` lines show as one-tap offers; they are never settled until tapped. With **Plain voice** set, the first two lines of both prompts become *You are the helper in Inkwyrm's Studio… Talk plainly and briefly.* The workshop's version says *building the world "{world}"* or *working on {place} in "{world}"*, and its near part is the lines of the records in scope.

**A field write** (system, no Errata):
```
You write one part of a record for a story world. Write only that part, in the world's own voice: no heading, no preface, no quotes, no note to the author.
World: {world}. {genre}. {tone}
{house_rules}
{kind_rule}
{visible_rule}
Keep every settled fact. Don't contradict the record. Don't name a person or place the record and the settled facts don't name.
If this part can't be written without a decision only the author can make, reply with exactly "NEEDS:" and one short question.
The part: {title}, {reach_words}. {shape}
{template_hint}
Like this, from this world:
{examples}
```
`{visible_rule}`, for a target the narrator reads (Always, Here, Named or When) on a record with Never sections: *The story's narrator reads this part and treats all of it as known to everyone in the scene. The author's notes, under "Kept back", are for you only. Where they matter here, show them as something a person could notice; never state them, and never call anything secret.*

The user message: `{kind} "{name}": {line}`, `Already written:` (the visible sections, title and text), `Kept back:` (its own Never sections), `Settled:` (or *Nothing yet*), the recent talk if it fits, the author's direction if they gave one, and `Write {title}.` The prefill, where the connection allows one, is `{title}:` and a new line. `{examples}` holds up to two sections with the same title from other records of the same kind, kept text only, shortest first. With none, it's empty, since the house rules already show a weak line and a better one. A generate button sends the same prompt with no Settled and no talk.

**The shapes** (`{shape}`) and what the Studio checks:

| Field | Shape sent | Cap | Sent back with the fix when |
| --- | --- | ---: | --- |
| Line | One sentence, under 25 words. | 60 | It's more than one sentence, or over 25 words |
| Keys | Other names someone in the story would use, separated by commas, at most six. | 60 | A key is over four words, or one is the record's own name |
| An Always section | One or two sentences, under 40 words. It goes out every turn. | 100 | Over 40 words |
| A Here section | Two to four sentences. | 250 | Over six sentences, or cut off |
| A Named or When section | Two to five sentences. | 300 | Over seven sentences, or cut off |
| Its own Never section | Notes for the author, one to three sentences. | 200 | Cut off |
| Set entries (W6) | One per line, "Name: what it is". | 400 | A line has no name |
| A greeting (W6) | The character's first message. Actions in *asterisks*, speech plain. | 400 | Cut off |
| An event's words (W6) | One line: what they're doing. Never how they arrive. | 60 | More than one line |

**Reading every reply.** Decoration is ignored: case, spacing, Markdown, a preface line (*Sure*, *Here is*), the field's own title, wrapping quotes and `<draft>` tags. Wrong content goes back once, with the original request plus one line: what was wrong and the exact fix, for example *That was two sentences. Write the line as one sentence under 25 words.* A second failure shows as **Unfinished**, with the raw text to copy from and no Keep until it has been edited. Faults on the connection's side (a timeout, a refused key) are never resent. The word list (*tapestry*, *palpable*, *a testament to* and the rest), kept in one file, underlines matches in a draft and never sends anything back.

**A name call:**
```
Suggest six names for a {kind} in "{world}" ({genre}). Names a reader can say on first sight: no invented languages, no titles.
One per line, nothing else.
What it is: {line}
{settled}
```
The model sees the names in scope under *Names already used here*. The Studio checks every suggestion against the whole world, folding case and spaces. A name that's already used is dropped from the list and shown as *taken*.

**Proposing records** (system):
```
You propose new records a story world needs, for its author to accept or not. Propose one only if a scene or a rule would use it and none of the records listed already does that job.
{house_rules}
A place or a person exists only if a scene or a rule uses it.
Write exactly this, nothing else:
READING: two or three sentences for yourself: what the talk needs that the world doesn't have yet.
then up to {n} cards, each like this, with a blank line between them:
Kind: character, place, group, item, lore, thread or scenario
Name: a short name, or Unnamed
Line: who or what it is to a stranger, in one sentence
Inside: the place it sits in, or nothing
Use: the scene or rule that needs it
Facts: up to two sentences, only from the talk
Open: one decision for the author
If none is needed, write the READING line, then "No new record needed" and why.
```
The user message: `World:`, `Already here:` (the scope's records, one line each, by kind), `Settled:`, the talk, and the author's request. The Studio reads labels in any case and any order. A card with a kind that isn't one goes back once with the list of kinds. Inside only pre-fills the picker; the author confirms the parent. A card whose name is already in the world says so and offers **Open that one**.

**Check** (system):
```
You check one record of a story world against the rest of it. You report problems; you never rewrite.
Report each problem on its own line, as: KIND | "the words at fault, quoted exactly from this record" | what they disagree with
KIND is one of:
contradiction | it can't be true alongside another record or a settled fact
given-away | a part the narrator reads states what the author's notes keep back, or says someone hides or doesn't know something
label | a part the narrator reads names a trait where it could show what the person does
Only real problems: style and length are not problems. One cause is one problem; if it recurs, quote its first instance and say so.
Write exactly this, nothing else:
READING: one or two sentences for yourself: what this record says, and what it must agree with.
then one line per problem, or exactly NONE.
```
The user message: the record (visible sections, then *Kept back*), `Settled:`, and `The rest of the world:` (the scope's records by line, and in full for the records this one names). The Studio drops a problem whose quote isn't in the record. **Fix** sends the section, the one problem and this instruction: *Write a plan line, FIX: the words, then what replaces them. Then a line with only "---". Then the whole section, changed there and nowhere else.* The plan shows under the draft.

## Default questions

Each question has its words, the field it mostly feeds, and whether it's on. These are the site's defaults. They're copied into the author's library the first time it's opened, and nothing reads them from the site after that. A round asks up to three at a time, in order, skipping any whose field is already filled.

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
10. What do they keep back, and what would someone notice of it? → a Never section, then the visible one it shows in

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

**The rest, short:**
- A group: what members do together, what it asks of them, how a member shows it.
- An item: what someone does with it, how you'd know it in a hand, what stops it being used.
- Lore: when someone would need to know it, who acts differently because of it, and whether it's fact, belief or dispute.
- A scenario: what's true at the first scene; what hasn't happened yet that play should be able to reach (Story Engine's *Now* and *Not yet*); who is there.
- A persona: who you are to these people, and what gives you a reason to act.

**The library**, opened from Settings › Questions and templates, and from Errata's own *Change these questions*:
- **Lists**, one per kind, as many as the author wants, each with a name (*Hard SF*, *Village*). Every question can be reworded, switched on or off, moved up or down, deleted, or pointed at a different field. Add puts a new one in.
- **Templates:** the sections a new record of each kind starts with, with their titles, reach and hints. Changing a template never touches a record that already exists.
- **A world picks** which list and which template each kind uses. That choice is stored in this browser beside the world, not in its file.
- **As a form:** the same list as boxes, one per question, each with **Ask Errata** for the ones the author is stuck on, and **Write all** at the end (Character Engine found that talking is the long way to type an answer you already know).
- **Sharing:** export as `<name>.kit.json` (`inkwyrm-kit/1`: lists and templates, never keys, chats or records). Import shows the list first, then adds it as a copy or replaces a list the author chooses.

## Weak models

| The model | What changes |
| --- | --- |
| 32,000 tokens and up | Everything. The workshop sees every line in its scope, proposals go up to three, and rounds ask three questions. |
| 16,000 | Six exchanges of talk at most. The workshop sends only the kinds being discussed. Rounds ask two questions. |
| 8,000 | Field writes read Settled and the record, with no talk. Three exchanges of talk. One example per write. One proposal at a time. Rounds ask one question. Check covers one record and the lines of its neighbours. |
| Xialong, and other loose followers | Their own format, as Chat already sends them. Answers and cards are read leniently, and anything unreadable becomes text the author picks from by hand. |
| A story model through completions | Field writes may go as a frame (the record as the narrator reads it, with the title open at the end), where the live tests show that it does better. |
| A strong instruction model as the helper model | The helper's calls go to it, and Try a scene goes to the play model. |
| No model, or a failed call | Templates, questions, the form, Settled and drafts already made all work. Only the calls stop. |

Nothing breaks when a model ignores a convention. Without `Settled:` lines, picks still settle and the author can tap lines in by hand. Without card labels, *Make a record from this* takes over. Without prefill, nothing is lost. A model that overplays Errata is fixed by **Plain voice**, and the workflow stays the same.

## Testing the prompts

- **In CI:** the reading code, against canned replies: missing labels, prefaces, tags, a reply cut off, `NEEDS:`, a round with no bars, a Check quote that isn't in the record. These tests check the code, not the prompts.
- **Live, run by the owner:** `npm run prompts:live` with their own keys. Each prompt runs against fixtures in settings the real worlds don't use (a ferry town in 1979, a flood barrier, a tidal lighthouse), twenty times at its shipped temperature. The results say how many runs out of twenty failed, against a one-sentence contract for each prompt, on a small local model, Xialong and a strong model. For example: *a Line draft is one sentence that names nothing the record doesn't*; *a visible section written from a record with a secret never states the secret*; *a round gives three or four answers to each question, none of them "other"*.
- **Changing a prompt** follows the principles' checklist, and its live count is set beside the count from before the change. A prompt that scores worse doesn't ship.

## What it won't do

- Write a record, a link, a reach, a condition or a rule number from what a model says. The Studio does those through its own controls.
- Read another record's Never sections, any Notes field, or an unkept draft into any call. Try a scene is the one exception: it reads drafts when the author chooses *with its drafts*.
- Build the canon hands-off, or let a model rewrite the author's Settled list.
- Resend without telling the author first, or resend more than once.
- Treat a matched word as proof of bad prose, or no match as proof of good prose.
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
  rounds: { id: string; questions: { questionId: string; answers: { text: string; note: string }[]; picked: number[]; own: string }[]; reading: string }[];
  settled: { id: string; text: string; taken: boolean }[];  // offered Settled: lines wait untaken; picks are taken
  asked: string[];                  // questions answered or skipped
}

// A draft waiting under a field.
interface Draft {
  id: string; worldId: string; recordId: string;
  target: { field: 'name' | 'keys' | 'line' } | { field: 'section'; sectionId: string }
        | { field: 'set'; setId: string } | { field: 'greeting' } | { field: 'event'; eventId: string };
  base: string;                     // the field as it was when the draft was made; Keep compares it
  text: string;                     // edited in place
  plan: string;                     // a fix's plan line, or ''
  state: 'ready' | 'needs' | 'unfinished';
  sent: { model: string; tokens: number; calls: 1 | 2; at: number };
}

// A workshop proposal, until it is made or dropped.
interface Proposal { id: string; worldId: string; kind: RecordKind; name: string; line: string; inside: string; use: string; facts: string[]; open: string }

// The author's library: inkwyrm-kit/1, which is also the export.
interface Kit {
  format: 'inkwyrm-kit/1';
  lists: { id: string; name: string; kind: RecordKind; questions: { id: string; text: string; feeds: string; on: boolean }[] }[];
  templates: { id: string; name: string; kind: RecordKind; sections: { title: string; reach: Reach; hint: string }[] }[];
}
// Beside it: which list and template each world uses, by world id; and the helper model, if it differs from play's.
```

**Export talks** (W2) saves a world's talks and waiting drafts as `<world>.talks.json`, format `inkwyrm-talks/1`: `{ format, worldId, worldName, talks: Talk[], drafts: Draft[] }`. Opening it on a world with the same id brings them back, and a talk or draft already there is kept rather than overwritten. It never carries keys, and the world's own export never carries it.

The pure parts (packing a call, the prompts, the reading code with its fixes, the name check) go in `studio/src/author/`. Following the repository's rule, they move to `core/` only when Chat needs them. `newRecord` in `core/records/world.ts` takes an optional template in place of `TEMPLATES`. That's the only core change. Try a scene uses the builders play already has (`core/chat/build.ts` for a character, the narrator's for a world) through what In context now already assembles.

## Phases

| Phase | What | Shippable alone because | Done when |
| --- | --- | --- | --- |
| W1 | **Draft** on the line and every section; names first on a new record; the draft card with Keep, Edit, Again, Drop and Undo; the stale check; reading every reply, with one resend and the fix; `NEEDS:`; Never sections as Kept back; What this sends; the live test kit. | One tap gives an author something to react to. | The canned replies never overwrite a field. A changed field stops Keep. The live counts for the line and section prompts are recorded on three models. |
| W2 | **The Errata door:** rounds with picks, the talk, Settled, the default questions, Write ▾ and Write all empty, drafts in the door and on the page, Plain voice, the helper model, and **Export talks** with its import. | It's the conversation the owner asked for, and it's quicker by picking. | Claude's Low Water character goes from blank to kept by rounds alone, and by talk alone. |
| W3 | **Try a scene**, as kept or with its drafts. | It proves a record plays before anything is kept. | A draft that gives away a Kept back fact shows it in the scene. |
| W4 | **The library:** lists and templates, a world's pick, the form, the kit file. | Every author gets their own template. | A kit exported and imported keeps every word and reach. A changed template moves no existing record. |
| W5 | **The workshop,** on the world and on a place, with rounds, proposals, Make it, Make a record from this, Take this to the workshop, and **Check** with Fix. | It covers the bigger setting once single records draft and play well. | ChatGPT's flood-barrier session works with the card labels broken. *Not this* makes nothing. Check finds a planted contradiction and a planted give-away in at least 18 runs of 20 on the strong model. |
| W6 | **More fields:** keys, set entries, greetings, example messages, an event's words. | Each new field works on its own. | No draft changes anything but its own text. |

## Where it meets the maps work

Maps M1 to M3 have landed (Studio 0.11.0). They barely meet this plan, and where they do it's additive:
- **The world file.** Maps owns `world.map` and the travel rules. This plan adds nothing to the world file.
- **`studio/src/route.ts`.** This plan adds the door `errata`, the page `workshop` and a `scope`.
- **New places.** A place made by the workshop's **Make it** lands on a refined sheet with nothing extra: a sheet's stored centres come first, and any place without one finds a spot (`core/map/sheet.ts`). There's nothing to pass on to the maps session.
- **The world's page.** Workshop is a new row beside About, Rules, Checks and Map.
- **Later:** the map's **Add a place here** can offer **Draft** for the new place's line (W1), and a place's **Talk about** is the same one-level scope as its sheet.
- **Shared files:** `studio/package.json`, `studio/README.md`, `docs/roadmap.md` and `docs/studio-brief.md`. Keep pull requests small and rebase before pushing.

## Where `claude.md` was beaten

- **Never** (ChatGPT, then Story Engine). Claude missed it completely, even though a thread's five questions all sit in Never sections. Story Engine showed what the right use is: a canon behind what the narrator reads.
- **Yes-and talk** (Story Engine). Claude's helper asked one open question at a time, which is the loop Story Engine found tiring and full of rejections.
- **The stale check on Keep and Undo** (ChatGPT). Claude's Keep would have written over an edit made while the draft was coming.
- **`NEEDS:`** (ChatGPT). Claude gave a write no way to refuse, so a gap got filled with an invention.
- **Names before prose, checked by the Studio against the whole world** (ChatGPT). Claude only listed names to the model.
- **The proposal card** (ChatGPT, with Gemini's Inside), over `NEW/NAME/LINE/WHY`.
- **Questions in the author's library, not on each world** (ChatGPT).
- **A list of banned words in the prompt** (Story Engine, the principles). It put those words in front of the model.
- **Trimming a long answer to fit** (the principles). It hid the fault instead of fixing it.
- **Cutting the record to fit a small window** (the principles). The record being written now always goes whole.
- **No way to test a prompt** (the principles). Claude had none.
- **The half-height sheet on a phone,** overtaken by the doors the UI decision built.

What held: one field per call in plain text; Settled, which ChatGPT reached on its own as *confirmed facts*; Errata only in the chat; prefill where it's available; the form; Write all empty with its cost shown; lenient reading of decoration with a hand-made fallback; and the phase order, generate first.

## Credit

- **ChatGPT:** Never as a real boundary; the stale check and Undo; `NEEDS:`; names first and the whole-world name check; the proposal cards and *No new record needed*; the author's library with a kit file; the budget table and stopping before an oversized send; temperatures; set entries never made active or locked; links set through pickers, never by a model's name.
- **Gemini:** the Inside label; the drafts count on the way into the helper; sharper questions (*what happens in three days if nobody does anything*, *what breaks or costs money if you stay*, *what do they keep on them*); the keyboard warning on phones; question lists named by genre.
- **Story Engine 0.15** (`keilladraconis/NAI-story-engine`): rounds of options; the code deciding what's still needed; a canon behind what the narrator reads, and *it writes whatever it is shown as known to everyone*; keeping what must not happen out of the prompt; vignettes as proof; the critic's quoted problems, NONE and one fix per problem; filled-in examples, not placeholders; frames for story models; a structure model beside the story model; *Now* and *Not yet*.
- **Prompt Engineering Principles:** what goes to code and what to the model; reasoning written before the answer; never truncating, only rescoping; rejecting wrong content with the exact fix, a bounded number of times, instead of repairing it; examples are copied; testing by behaviour, counted in failing runs of twenty.
- **Claude:** one field per call in plain text; Settled; prefill; the form, from Character Engine; Write all empty; the phase order.
- **New here:** the workshop scoped to a place, on the same one-level unit as the list and the map; Make it seeding the new record's Settled, Notes and first question from its card; a pick written into Settled by the Studio, never by the model.

## For the owner

1. **Never sections as the record's canon.** The helper reads a record's own Never sections, and writes the visible ones to show them only as behaviour. It never reads another record's Never sections or any Notes. *Suggest:* yes, with the reach's hint reworded to *Your notes. Never sent in play; the helper reads them on this record, and keeps them back.*
2. **Chats stay in this browser.** A world's export doesn't carry its talks or drafts. *Suggest:* yes. **Answer:** yes, and talks get an export of their own: **Export talks** on the world's page saves `<world>.talks.json` (`inkwyrm-talks/1`: talks, Settled and waiting drafts, never keys), and opening it brings them back beside the same world.
3. **Questions and templates belong to the author.** A world points at a list and doesn't carry it. *Suggest:* yes.
4. **Plain voice.** A switch that turns Errata's manner off and leaves the same helper. *Suggest:* include it, off by default.
5. **Four people in a place.** A proposal that would put a fifth named person in one place gets a warning on its card, not a block. *Suggest:* warn.
6. **Write all empty.** Six calls for a new character, shown with their count and cost before it asks once. *Suggest:* keep it.
7. **Rounds of options.** Errata asks by offering answers to pick, and talk stays open beside it. *Suggest:* yes, with rounds as the default.
8. **One resend with the fix.** A wrong answer goes back once, automatically, and the possible second call is shown before the first is made. *Suggest:* yes.
9. **Try a scene.** Its own phase, W3, before the library and the workshop. *Suggest:* yes.
10. **A helper model.** Settings lets the Studio's helper use a different model from play's, so a strong instruction model can help while a favourite story model plays. *Suggest:* yes, the same model unless the author changes it.
