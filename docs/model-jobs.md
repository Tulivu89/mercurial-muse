# Models for each job, and group chat: design

Nov 15, 2026 · @AmbiProp · Proposal for the owner's review. Nothing here is built yet. Group chat was added the same day: the owner picked two layouts to test, and they share their plumbing with the jobs.

The site sends a model many kinds of work: a chat reply, a narrated turn, a diary entry, a drafted record, and later posts, openers and a helper with search. Today all of it goes to one model on one connection. This page splits that work into three jobs. A player can give each job its own provider and model, or leave the jobs alone and change nothing. Group chat, further down, uses the same pieces: a character can have a Voice of its own, and a speaker's turn is built the way a side task will be.

## What's there now

- **One connection for the whole site** (`kit/src/connection.ts`): one provider, one model, one mode and format. The adventure, Chat and the Studio all read it.
- **Keys are already kept per provider.** `praxis.key.<provider>` (and `praxis.novelai.token`) hold a key for each provider the player has used. Only the chosen provider's key is ever sent.
- **The relay takes the provider on every request**, with that request's key in a header. Two requests to two providers are already two ordinary requests. The server needs no change.
- **The Studio's helper can already use a model of its own** (W2, `studio/src/author/context.tsx`, kept under `inkwyrm.helper.model`). It must be a model from the same provider as play.
- **Chat's side tasks** (Reflect, Process, Plan; `core/chat/build.ts`) run on the chat's model. `buildSide` already picks its profile, AetherRoom or General, from the model it is given, so the same builder serves any model.

## The three jobs

| Job | What runs on it now | What joins it later | What it wants from a model |
| --- | --- | --- | --- |
| **Voice** | Chat replies, regenerate and continue; the adventure's narration | Group chat, Stage mode | The player's favourite writer. A long window. A prefix that stays put. |
| **Side** | Reflect, Process, Plan | Posts and comments, openers keyed to the schedule, the adventure's evaluator (a label from a closed list) | Short replies in a set shape. Cheap and quick. |
| **Build** | The Studio helper: talks, Write, Write all empty | The helper with search, image prompts | Follows a set shape and an instruction. Reads a big world. |

Voice is the connection players have now, under the same `praxis.*` keys. Side and Build each start as **Same as Voice**. A player who never opens the setting sees no change.

A new feature names its job when it is built. Something that writes in a character's voice and stays in the story is Voice. Something short, in play, read by code or seen once is Side. Something done while authoring is Build.

## How a job is set

- A job is stored in this browser under `inkwyrm.job.side` and `inkwyrm.job.build`: `{ provider, model, mode, format, base }`. Nothing stored means Same as Voice.
- **The key comes from the provider.** A job names a provider; that provider's saved key goes with the request. One key per provider is enough for now. A second key for the same provider (to keep spend apart, say) waits until someone asks.
- A job on the player's own server keeps its own address, so Voice can be on one local server and Side on another.
- The Studio's `inkwyrm.helper.model` is read once into the Build job (same provider as Voice, that model) and then removed. Plain voice stays a Studio setting.

## The settings

One **Models** part in the connection settings that all three sides already share:

- **Voice**: the provider, key and model, exactly as now.
- **Use other models for some jobs**: off by default. On, it shows a row for Side and a row for Build. Each row is **Same as Voice**, or a provider, then a model from that provider's list, and a **Test** button that sends one short request.
- A provider with no key saved says **Add a key** and opens the key field for that provider. The key is kept the way Voice's is: in memory, and in storage only when *Remember on this device* is ticked.
- One line under each row says what runs on it now ("Reflect, Process, Plan").

## Each call

- A call asks `targetFor('voice' | 'side' | 'build')` for its target, and gets Voice's target when the job is unset.
- **The window is the job's own.** A side task on a 32k model is built for 32k, even when Voice has 128k. The model list's context sizes already give this.
- **The profile is the job's model's.** Voice on Xialong with Side on GLM builds the diary request the General way.
- **Under the hood shows the job.** The last request names its job and model: *Side · glm-4-6*.
- **A failed job never moves to another provider without asking.** The error names the job ("Side: OpenRouter answered 401") and offers **Try it on Voice** for that one request. A quiet fallback would bill a different key than the player chose.

## The cache

How much a side task costs the chat's cache depends on where the model runs.

1. **Hosted providers** (DeepSeek, OpenRouter, the OpenAI-style APIs that cache prefixes) keep more than one cached prefix. A side task on the same model doesn't push the chat's prefix out; it just pays full price for its own. The risk is small.
2. **The player's own server** (llama.cpp, KoboldCpp and the like) usually keeps one working context. A side task with a different prompt replaces it, and the next chat turn reads the whole context again, which can take minutes on a home machine. Side on another model, or on a second slot where the server has one, fixes this completely. This is the case the jobs help most.
3. **What a side task writes matters more than where it runs.** A diary entry that lands early in the context changes the prefix for every turn after it, whatever model wrote it. The General layout already carries diary, feelings and plans as lines in the moment, at the tail. **The rule from here on:** anything written during play enters the context at the tail, and moves into the stable part only when the window rolls over.

What the code does today: a General side task starts with rules of its own ("You are X. Below is who you are…"), so it shares no prefix with the chat even on the same model. AetherRoom's side request leaves out plans, clock and mood, so it differs early as well. Moving side tasks to another model therefore loses no cache hit anyone has now. If the owner wants a cheaper Same as Voice, a later change can move the side task's instruction to the end, after the chat's own rules, so it shares the chat's prefix on a hosted provider.

## A caution: the character's voice

A diary entry, a feeling and a plan are written as the character, and they go back into the character's context. A much weaker or very different Side model can wear the voice down over a long chat. The voice of posts will matter the same way when they come. Two ways to handle it:

- **Let play-tests decide.** Reflect, Process and Plan go to Side. If entries drift, they get a switch: **Write these on Voice**.
- **Or keep in-character writing on Voice from the start.** Side then gets only what is read by code or seen once.

The first is proposed: it gives local players the cache fix at once, and the drift is a guess until someone tests it.

## For players: which model for which job

This is the explainer, written to sit under the Models settings and in the help.

> **You don't need any of this.** One model can do everything. Split the jobs when one model is slow, costly or weak at a job.
>
> **Voice** writes the story and the characters. Put your favourite here.
> **Side** writes short things beside the chat: diary entries, feelings, plans. A fast, cheap model that follows instructions is enough.
> **Build** helps you write worlds and characters in the Studio. A strong instruction model does best here, even one that's dull at roleplay.
>
> Some setups that work:
> - **NovelAI only.** Voice on Xialong; Side and Build on GLM-4.6. Same key, nothing extra to pay.
> - **NovelAI plus a free key.** Voice on NovelAI; Build on Gemini through Google AI Studio, whose keys come with a free daily allowance.
> - **Paying per token.** Voice on the model you like best; Side on a cheap, quick one. Side replies are short, but each one reads the whole chat.
> - **A model on your own computer.** Voice there; Side on any hosted model. Your computer keeps the chat in memory between turns, and a side task on the same model makes it start over.
>
> Each job is billed to the key of the provider it uses.

## Group chat

Several characters in one chat, with the player. Two things make it hard. Every character's sheet in context at once makes them bleed into each other and eats the window. Swapping one character's sheet for another's at the top of the context breaks the cache every time the speaker changes. Four layouts were weighed:

| | Layout | Cache | Bleed | Voice |
| --- | --- | --- | --- | --- |
| A. Joined cards | Every sheet at the top | One cache | Worst; the window fills | Muddy |
| **B. A call per speaker** | Each character's own prefix (rules, their sheet, their examples), then the shared transcript | One cache per character; a quiet one goes cold | Low | Strongest |
| **C. Shared prefix, speaker at the end** | Rules › scenario, persona, every present character's line › the transcript › the speaker's block › the moment | One cache that grows each turn, whoever speaks | Low, if the code enforces it | Strong |
| D. One narrator | One call writes everyone | Cheapest | None to speak of | Weakest |

**B and C go to the lab.** A muddies the voices. D stays the adventure's way. B is what CharacterRoom and the Discord bot do. C is new.

Neither costs more per message than a one-to-one chat: each reply is still one call. In C, the only part read fresh each turn is the speaker's block, about 1,000 to 3,000 tokens. Everything before it is one stream that only grows, so it stays cached, even on a server that keeps one context.

### What each layout sends

**B**, for the speaker: the General rules, the speaker's standing sections and examples, the persona, the scenario, a cast list of the others present by their **line** (`docs/records.md`, Line and entry), the transcript with every message under its speaker's name, then the moment. Today's one-to-one builder does nearly all of this already. What's new is the cast list and the names on the transcript.

**C**, for every speaker alike: the rules, which say once that *the last block names who you write as, and you write only as them*; the persona, the scenario and the cast list by line; then the transcript with names. Then, for the speaker alone: their full entry, a few lines from their examples, their own diary and feelings, the moment, and the cue to write as them.

Both keep these the same:
- **Private things live only in the speaker's part.** A diary, a feeling or a plan is sent only while its owner speaks. `docs/records.md` already says a memory is sent only while its owner is here. Group chat narrows that to *while its owner speaks*. This is enforced by what the code puts in, never asked of the model.
- **Examples are never shared.** They steer the voice hardest, so they go only with their owner.
- **Stop sequences on every other participant's name** and the player's, and a parser that cuts a reply at another speaker's label.
- **The reply is started with the speaker's name** where the provider can continue text. Elsewhere, the last line asks for that character's next message alone.
- **At most four named characters present**, as the writing rules already say.
- **The code picks the speaker.** If the player names someone, they answer; otherwise whoever has been quiet longest among those the schedule puts in the room. If that proves too blunt, a Side call picks one name from the list of those present.
- **Xialong uses B.** CharacterRoom's kernel is held byte for byte, and it is built for one character's prefix.

### The plumbing it shares with the jobs

- **One way to send.** Every call goes through one `send({ job, target, built, options })` in `kit/src/connection.ts`. It names the job and model in Under the hood, gives the error its job's name, and offers **Try it on Voice**. Side tasks, the Studio helper and a group speaker's turn all use it.
- **A Voice per character.** `targetFor('voice', characterId)` gives that character's own model when the chat sets one, and the chat's Voice otherwise. It's stored with the chat in this browser, never in the world file: a world someone shares can't choose the reader's provider. With B or C, each model keeps its own cache. Each character on a different model also gives the voices more distance from each other.
- **One builder for "the task goes last".** C's speaker block and the side task's instruction are the same piece: something added after the transcript, with everything before it unchanged. The General builder gets this once. Side tasks then share the chat's prefix on the same model, which is the cheaper Same as Voice raised under *The cache*, and C's speaker block uses the same code.
- **Names on messages.** A chat message gets an optional `speaker`, the character's id. A one-to-one chat leaves it out and reads as it does now.

### The lab test

The chat lab (`docs/testing/chat-lab.md`) gets group cases and three variants:

- `group-b`: the B layout.
- `group-c`: the C layout.
- `group-c-anchor`: C with one extra line straight after the transcript, *You are writing as Errata*, before her block.

A group case names the characters present, the speaker, a short scripted exchange before the turn (bleed shows after a few lines of back and forth, not on the first), what the player says, and what to watch for. The resort's three, Qiulong, Errata and Echydna, are the cast. The cases themselves are written in a content session, like the standing suite. They cover:
- the player speaking to one character by name;
- the player speaking to nobody in particular;
- two characters who disagree;
- a character who knows something the others don't.

The scorer already counts other characters named. It adds:
- **A reply that writes another participant's line**: a hard fail, caught by code.
- **Words copied from another present character's sheet or examples**: the same six-word check it runs on the speaker's own sheet, run against the others.
- **Tokens in the shared part and in the speaker's part**, for each variant.

A code test needs no model at all: in C, the requests for two different speakers on the same turn are identical up to the end of the transcript.

**Models:** GLM-4.6 on NovelAI, DeepSeek, one OpenRouter model and a local model run all three variants. Xialong runs B only.

**What decides it:** C needs to match B on bleed and come close on voice. If it does, C is the default for General models, and B stays for Xialong and as a setting. If C bleeds or reads flatter, B is the default everywhere, and the shared prefix waits for a better idea.

## Phases

| Phase | What it builds | Done when |
| --- | --- | --- |
| **J1** | `targetFor` and the stored jobs in `kit/src/connection.ts`; `send`; the Models settings with Test; the Studio helper on Build, with `inkwyrm.helper.model` read in and removed | Tests: an unset job gives Voice's target; a job on another provider sends that provider's key and no other; the old helper model comes across. The Studio drafts on Build while Voice is a different provider. |
| **J2** | Reflect, Process and Plan on Side, with the job's window and profile; the General builder's "task goes last", which the side task uses; the job named in Under the hood; **Try it on Voice** on a failed job | Tests: Voice on Xialong with Side on GLM builds the General side request inside Side's window; on the same model, a side request shares the chat's prefix up to the end of the transcript. A live check with Voice on a local server: a Reflect leaves the next chat turn's prompt cached. |
| **G1** | Group chat in the core and the lab only: `speaker` on messages, the cast list, the B and C builders, stops and the cut-off parser, the lab's group variants and scoring | Tests: the prefix test above; a one-to-one chat builds byte for byte as before; the AetherRoom parity test still passes. Lab runs on the models above, with the scores in `docs/testing/`. |
| **G2** | After the owner reads G1's scores: the default layout for each profile, Chat's group screen, who speaks next, and a Voice per character | Set by G1's results. |
| **J3** | Each later feature takes its job when it is built: posts, openers, the evaluator, the helper with search | Each feature's own phase says its job. |

The jobs' tests run in `kit/` and `chat/`. G1's run in `core/` and the lab. J2 and G1 both touch the General builder, so J2 goes first.

## Questions for the owner

1. Are three jobs right, or should posts get a job of their own once they exist?
2. Reflect, Process and Plan: on Side, with a switch back to Voice if they drift (proposed), or on Voice from the start?
3. Should J1 also bring a second key for the same provider, or wait until someone asks?
4. Group chat: is "whoever has been quiet longest" a good enough way to pick the next speaker when the player names nobody, or do you want the Side call from the start?
   **Answered Nov 18** (`docs/reviews/group-chat/decision.md`):
   - the agent's pick by default when nobody is named, behind a setting, with the quietest when it's off;
   - a group button or a long press on Send to pick who answers, push a reply, take the quietest, or ask the agent;
   - one speaker per message by default, "whoever has something to say" as a setting;
   - characters talking on their own after group chat.

   The review's additions are part of G1 and G2: talkativeness and mute, a reply's author answers, handoffs by name once per turn, clean-up after the reply, the opening greetings, the journal and chapters shared, a lab variant with others' lines as the user's turn, prefill per model, and how Xialong takes a group.
