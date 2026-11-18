# Group chat: compared with our plan

Nov 18, 2026 · @AmbiProp · Answered by the owner Nov 18

These are from:
- SillyTavern 1.19.0, Agnai 1.0.555, RisuAI (main) and Marinara Engine 2.5.2, read from source;
- our plan in `docs/model-jobs.md` (Group chat, G1 onward).

All AGPL-3.0 except RisuAI (GPL-3.0); ideas only.

## How they do it

| | SillyTavern | Marinara | RisuAI | Agnai |
| --- | --- | --- | --- | --- |
| **Who speaks** | Four ways: named in your message, then a talkativeness roll per member (several may answer); everyone in order; whoever hasn't spoken; or by hand | Everyone in order; or "Smart": `@Name` wins, else a yes/no model per candidate, else a hidden picker call at low temperature; or by hand | SillyTavern's first way | By hand, or one fixed character answers |
| **Several answers to one message** | Yes | Yes | Yes | No |
| **Characters talk without you** | Auto-mode on a timer | "Character exchanges" after 30 s idle (off by default, daily cap), and `@Name` handoffs with one reply each per turn against loops | No | No |
| **The speaker's prompt** | Only the speaker's card (default), or every card joined | One prompt, then other cards cut out per speaker; or one reply voicing everyone | Only the speaker's card | The speaker's card; the others are described only if a template asks |
| **Other characters' lines** | Model's turns, with `Name:` | **Your turns**, from each speaker's view | Your turns, wrapped in `<Name's Message>` | `Name:` lines |
| **Stops** | Names, only for prompt-style models | None: clean-up after the reply | Your name only | Every other name |
| **After the reply** | Cut at your name | Strip the speaker's own name, skip to their own label, **drop a reply that is only someone else** | — | Cut at end tokens |
| **Lore and memory** | The speaker's lorebook; entries can be limited to some characters | Lore filtered to the speaker; messages hidden per character; whispers | The group's lore only | The speaker's book |

Marinara's lessons, from its changelog:
- cutting other cards out by matching text fails on unusual names;
- replying to a message should make its author answer;
- some models refuse a request that ends on their own turn;
- summaries went wrong when someone joined partway;
- "Individual replies can use many tokens."

## Where our plan is ahead

- **The cast list,** each person by their line: between nothing (theirs, by default) and every full card.
- **A prompt laid out for the provider's cache.** Layout C is new; theirs are our A and B.
- **Private memories enforced by what the code puts in.**
- **Presence from the schedule.**
- **A model per character.**
- **A lab with a bleed score,** and a test that the prefix holds between speakers.
- **The scenario as the world's own record.**

## What to add to the plan

| From them | Add | Why |
| --- | --- | --- |
| Several answers to one message | **A setting per group: one speaker (default) or "whoever has something to say"** (up to three, each seeing the ones before) | Every app but Agnai allows it; the cost warning goes beside it |
| Talkativeness, muting | **Per member:** how often they speak up (quiet, usual, chatty), and a mute | Three apps have it; the schedule alone can't say "she's shy" |
| Replying to a message | **Its author answers** | Marinara fixed exactly the bug "quiet longest" would cause |
| `@Name` handoffs | **A character may hand to another by name,** each at most once per turn | Characters talking to each other, with Marinara's guard against loops |
| Characters talking unprompted | **Later, off by default,** with a cap | Costly; after the basics |
| A cheap picker | **The Side call asks one question with a JSON answer,** at low temperature, falling back to quiet-longest | Marinara's shape; answers question 4 in `docs/model-jobs.md` |
| Clean-up after the reply | **The parser is the guarantee:** strip the speaker's own name; keep the speaker's text when it comes after someone else's line; drop a reply that is only someone else and say so | Stops don't work on every chat model; SillyTavern sends none to them |
| Opening a group | **Each member present gives their greeting,** or the scenario's opener | The plan didn't say |
| Lines someone didn't witness | **Name it as layout C's limit:** a character who arrives later sees what was said before. B can hide lines per speaker | The shared prefix can't hide them; Marinara's summaries broke on this |
| The journal and chapters | **In the shared part:** the journal is about the player; chapters record the scene | Settles what the plan left open |
| Roles in layout C | **A lab variant with everyone's lines as the user's turn, named,** beside the all-assistant one | Marinara and RisuAI found other characters as the user's turn cuts down speaking for them |
| Prefill | **Per model, not per provider** | Some models refuse a request that ends on their turn |
| Xialong in a group | **Specify how others' lines enter CharacterRoom's kernel** before G1 builds it | The parity fixtures don't cover groups |

## The owner's answers (Nov 18)

1. **One speaker per message by default;** "whoever has something to say" as a setting.
2. **Characters talking on their own comes after group chat,** on the same architecture.
3. **Picking who speaks:**
   - **A group button, or a long press on Send,** offers: pick who answers, or push their reply; the quietest; or the agent's pick.
   - **When nobody is named,** the agent's pick is the default, behind a setting. With it off, the quietest answers.

## Questions for the owner

1. **Several answers to one message:** default one speaker, with "whoever has something to say" as a setting?
2. **Characters talking to each other on their own:** wanted soon, or after group chat works?
3. **The next speaker when you name nobody:** quiet longest, or the cheap Side call from the start?
