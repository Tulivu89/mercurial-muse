# Models for each job: design

Nov 15, 2026 · @AmbiProp · Proposal for the owner's review. Nothing here is built yet.

The site sends a model many kinds of work: a chat reply, a narrated turn, a diary entry, a drafted record, and later posts, openers and a helper with search. Today all of it goes to one model on one connection. This page splits that work into three jobs. A player can give each job its own provider and model, or leave the jobs alone and change nothing.

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

## Phases

| Phase | What it builds | Done when |
| --- | --- | --- |
| **J1** | `targetFor` and the stored jobs in `kit/src/connection.ts`; the Models settings with Test; the Studio helper on Build, with `inkwyrm.helper.model` read in and removed | Tests: an unset job gives Voice's target; a job on another provider sends that provider's key and no other; the old helper model comes across. The Studio drafts on Build while Voice is a different provider. |
| **J2** | Reflect, Process and Plan on Side, with the job's window and profile; the job named in Under the hood; **Try it on Voice** on a failed job | Tests: Voice on Xialong with Side on GLM builds the General side request inside Side's window. A live check with Voice on a local server: a Reflect leaves the next chat turn's prompt cached. |
| **J3** | Each later feature takes its job when it is built: posts, openers, the evaluator, the helper with search | Each feature's own phase says its job. |

The tests run in `kit/` and `chat/`; nothing in `core/` changes except, if the owner takes it, the side task's instruction moving to the end.

## Questions for the owner

1. Are three jobs right, or should posts get a job of their own once they exist?
2. Reflect, Process and Plan: on Side, with a switch back to Voice if they drift (proposed), or on Voice from the start?
3. Should J1 also bring a second key for the same provider, or wait until someone asks?
