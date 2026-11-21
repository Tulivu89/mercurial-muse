# The chat lab

Nov 15, 2026 · @AmbiProp · How to tell whether a weak chat reply is the model's fault or the setup's, and which part of the setup. It works without API keys: the model in another app plays the model.

## The idea

Hold the context still and change one thing at a time. Chat saves the exact turn as one file (a test pack). The lab rebuilds that turn under several setups and writes each one out as the exact request. A model in another app (Claude, ChatGPT, Gemini) reads each request and writes the reply, as if it were the model the site called. Then the lab scores the replies.

- If a strong model does well on the request the chat really sent, the setup holds, and the weak reply was the model's.
- If a strong model struggles too, the setup is at fault, and the variant that fixes it shows which part.

## 1. Save the turn from Chat

In the chat, open **Under the hood** (the ⋯ button), then **Sent**. At the top, **Save for a test** has three buttons:

- **Everything:** one file (`<name>-test.json`). It holds the chat, its world as the chat sees it (with any persona or scenario borrowed from another world), the settings it was built with, what the next reply would be sent, and the last request with what came back. Your key is never in it.
- **The chat:** the chat on its own, as before.
- **Settings:** model, provider, context size, reply length and samplers. Chat's Settings page has the same button.

To paste a request into another app without the lab: **Sent › Copy as text** gives the last request and its reply. **Context › Copy as text** gives what the next reply would be sent. **Save as text** writes either one as a file.

## 2. Run the lab

With the repository, from its root:

```bash
npm run chat:lab -- lab/errata-test.json
```

That writes `lab/errata-test.lab/` with one folder per variant, each holding `context.md` (the request as text) and `context.json`. It also writes `original.md` (what the real model wrote) and a `README.md` that says what to do next. `lab/` is kept out of git, because packs hold your chats.

The lab looks at the last reply when the chat ends on one; `--turn <n>` picks another message. `--replies <n>` sets how many tries per variant (3 by default).

| Variant | What changes |
| --- | --- |
| `as-sent` | Nothing: exactly the request the chat sends, with today's code. |
| `general` | For a Xialong chat: the General layout every other model gets. |
| `no-examples` | Her example chats taken out. |
| `only-her` | Anyone else in the world who isn't a chat character taken out, so none of their Named sections can come in on a key. Other chat characters never bring anything into her chat, so a world of chat characters has no `only-her`. |
| `with-scenario` | For a chat with no scenario: her world's scenario put in. |

After the replies are written:

```bash
npm run chat:lab -- score lab/errata-test.lab
```

That writes `scores.md`. For each reply it gives the length, catches from the content standard's failure list, other characters named, quotation marks (the house format has none), and stretches of six words or more copied from the sheet or the examples.

## The standing suite

A test pack is one turn from one real chat. The suite is the same set of openers run against the resort's three every time, so two runs can be compared: before and after a world change, or one model against another. It needs no pack.

```bash
npm run chat:lab -- suite
```

That reads `content/dragons-resort/lab-suite.json` and writes `lab/suite-<date>/`: one folder per case, each with the `as-sent` and `general` variants, and a `README.md` with what to look for in each. A case is a new chat at the hour her greeting happens: her greeting, then one message from the person. Each woman gets three: an ordinary reply to her greeting, a stranger flirting, and a push that should set her off in her own way (boredom, a lecture, fear). Score the whole suite in one go:

```bash
npm run chat:lab -- score lab/suite-<date>
```

To add a case, add an entry to the suite file: `id`, `character`, `scenario`, `relationship`, `at` (the hour, `HH:MM`), `userName`, `says` (the person's message) and `watch` (what a judge looks for). A new world gets its own suite file beside its world file; run it with `npm run chat:lab -- suite <file>`.

## Group chats (Nov 21)

A test pack from a group chat (`core/chat/group.ts`) builds the turn for whoever answers it: the writer of the reply at that turn, or whoever would answer next. Its variants are the layouts the lab has to decide between (`docs/model-jobs.md`, *The lab test*):

| Folder | What changes |
| --- | --- |
| `as-sent/` | The chat's own group settings |
| `group-b/` | A call per speaker, the others by their line, their replies as the model's turns |
| `group-b-user/` | B, the others' replies as the player's turns |
| `group-c/` | One shared prefix, the speaker's block last |
| `group-c-anchor/` | C, naming the speaker straight after the transcript |
| `group-c-user/` | C, every reply as the player's turn |

Xialong gets `as-sent` and `group-b` only. `scores.md` adds two columns: **Wrote for** (the reply wrote a line for someone else present: a hard fail) and **Lifted from others** (six-word runs from another present character's sheet or examples: bleed). A suite case becomes a group case with `cast` (everyone present, the character first) and `before` (a short scripted exchange, each line `{ "who": "<id or user>", "says": "…" }`); the cases themselves are written in a content session.

## 3. Let another app's agent run it

Each subscription comes with a coding agent that can open the repository and run commands: Claude Code, ChatGPT's Codex, Google's Jules or the Gemini CLI. `AGENTS.md` at the root tells them how to set up and run the lab (Codex and Jules read it on their own; `GEMINI.md` points Gemini's tools at it; Claude Code reads `CLAUDE.md`). Where an app asks for a setup script, it's `npm ci`.

**For the suite**, paste this:

> Read `AGENTS.md`. Run `npm ci`, then `npm run chat:lab -- suite`, and follow the `README.md` it writes, blind. Then score it, write `findings.md`, and hand back `findings.md` and `scores.md` as files. Don't commit anything.

**For a pack the owner sent**, attach the pack to the session (uploading it into the repository works too, but then it stays in the repository's history), and paste this:

> Read `docs/testing/chat-lab.md`. The test pack is `lab/<file>.json`. Run `npm ci`, then `npm run chat:lab -- lab/<file>.json`. Follow the `README.md` it writes, blind: for each variant read only its `context.md` and write the replies as the model would. Don't read the world file, the other variants or `original.md` until every reply is written. Then run the score, read everything beside `original.md`, and write `findings.md`. Hand back `findings.md` and `scores.md` as files. Don't commit the pack or the lab folder.

Run it on the lightest or oldest model the app offers as well as its best. That brackets Xialong and GLM.

**Without the repository** (a plain chat in any app), only `as-sent` is possible. Paste or attach the text from **Copy as text**, and ask for the character's next message only. Do it twice, in fresh chats, so one odd reply doesn't decide anything.

## 4. A second real model on the site

Google AI Studio is on the provider list now. Its keys have come with a free daily allowance (aistudio.google.com, **Get API key**; check the limits when you make one). With it you can play the same chat on Gemini in Chat itself, setup and all. OpenRouter also lists some free models. The model in another app's agent never sees the site's real request path; this does.

## First run: Errata, Nov 15

The owner's chat with the resort's Errata on xialong-v1, rebuilt from its export (its borrowed persona and scenario weren't in that file, so they're left out here). What the context shows, before any model plays it:

1. **She didn't know where she was.** The chat had no scenario from the resort: no Autumn's Leaves, no house, no Qiulong running it. "What a specific rumor" is a fair answer from someone who has never heard of the teahouse. *Fixed:* a new chat now starts in the scenario where her schedule puts her.
2. **The other women's sections came in on loose keys.** Three of the seven brains in her context were someone else's. "Qiulong: Wants" and "Echydna: Wants" came in on the word *want*, and "Echydna: Pampering and Worship" came in on *horns*, from Errata's own greeting. *Fixed Nov 15:* the generic triggers are out, and the real questions bring the notes in (`docs/content/dragons-resort/greetings-v2.md`). Capitalised words now fire on Xialong too.
3. **The schedule and the greeting disagree.** The greeting puts her on a parlor barstool with iced coffee. At the hour the chat ran, her schedule put her in her spare room in her sleep clothes, and the sheet says so. The model gets told both. *Eased Nov 15:* each new greeting sits at an hour her schedule agrees with. A chat on real time at another hour still gets both.
4. **Her voice and her outfit sit under the player's card.** In CharacterRoom's layout, her Speech and her outfit come after the player's name with no label saying they're hers. That's how CharacterRoom has always laid out a card's brains, so it's worth a variant before changing it.
5. **The examples are half the request:** about 1,900 of 3,600 tokens. Two of the six are romantic, played to someone she's only just met.

Points 1 and 2 are setup, and they'd confuse any model. The short, off-key replies ("tell me who paid for the tip") may still be Xialong. The lab, run on a strong model, will say how much.
