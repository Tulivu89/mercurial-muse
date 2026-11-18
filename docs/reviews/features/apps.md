# Notes: what five apps let a player do

Nov 18, 2026 · @AmbiProp

These are from:
- SillyTavern 1.19.0 and Agnai 1.0.555, from their packages;
- RisuAI (main, Nov 18), Marinara Engine 2.5.2 and Talemate (main, Oct 27), from read-only clones.

All are AGPL-3.0 except RisuAI, which is GPL-3.0. "Has it" means the feature was found in the source or docs; not found isn't proof it's absent.

| Area | Feature | SillyTavern | Agnai | RisuAI | Marinara | Talemate | Inkwyrm |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Chat | Alternatives (swipes), regenerate, edit, continue | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Chat | **Branches / checkpoints:** fork a chat at a message | ✓ | ✓ (a tree) | ✓ | ✓ (copies game state) | ✓ (scene revisions) | — |
| Chat | **Impersonate:** the model writes the player's turn | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Chat | Steer a reply ("start the reply with", guided) | ✓ | | | ✓ | ✓ | notes in brackets |
| Chat | Reply suggestions or choices | | ✓ | ✓ | ✓ | | — |
| Chat | Hidden messages / out-of-character | ✓ | ✓ | | ✓ | | notes |
| Chat | Logprobs viewer | ✓ | ✓ | | | | — |
| Group | **Several characters in one chat,** with who-speaks-next rules (mentions, talkativeness, in turn, by hand, or a model's pick) | ✓ | ✓ | ✓ | ✓ | ✓ | planned (`docs/model-jobs.md`) |
| Prompt | Prompt manager / templates | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (Prompt settings) |
| Prompt | Author's Note | ✓ | | ✓ | | | "After every turn", notes |
| Prompt | Structured output (JSON-schema characters, guidance fields) | | ✓ | ✓ | | ✓ | — |
| Prompt | A small decision model for yes/no calls | | | | ✓ | ✓ | helpers (emotion pick) |
| Memory | Summaries / long-term memory | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (chapters) |
| Scripting | Regex scripts | ✓ | | ✓ | ✓ | | — |
| Scripting | Slash-command language (STscript), quick-reply buttons | ✓ | | | ✓ | | — |
| Scripting | Triggers, Lua or Python, node editor, story scripts | | events | ✓ (≈100 effects, Lua) | story scripts | node editor | rules engine (adventure) |
| Life | **Characters message first,** on a weekly schedule | | timed events | | ✓ | | schedules (no first message) |
| Life | **Characters' social feed** | | | | ✓ | | ✓ (posts) |
| Media | **Text to speech** | ✓ (≈25 providers) | ✓ | ✓ | ✓ | ✓ (per-character voices) | — |
| Media | Speech to text, voice calls | | ✓ | | ✓ (Whisper calls) | | — |
| Media | **Image generation** (character, scene, selfies; inline) | ✓ (24 sources) | ✓ | ✓ | ✓ | ✓ | planned (roadmap step 7); photo lines on posts |
| Media | Emotion sprites / expressions | ✓ (classifier) | ✓ (layered) | ✓ (+3D) | ✓ (+full body) | | ✓ (portraits per emotion) |
| Media | Backgrounds, video, ambient sound, music | ✓ | ✓ | ✓ | ✓ | ✓ | room pictures in Home |
| Looks | Themes, custom CSS | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (looks) |
| Looks | HTML inside messages | ✓ | | ✓ | ✓ | | — |
| Social | **Shared live rooms** (several players) | | ✓ | ✓ (peer to peer) | ✓ | | — |
| Social | Accounts on one server | ✓ | ✓ | | ✓ | | planned (step 8) |
| Social | Discord | | | | mirror | | the bot (separate) |
| World | Trackers / HUD (moods, quests, inventory, relationships) | | | | ✓ | ✓ | states, needs, bond |
| World | **Game mode:** GM, dice, rulesets, combat, maps, time | | Sagas | dice tool | ✓ (5e SRD rulesets) | director | ✓ (the adventure) |
| World | Director agent with plans and arcs | | | | ✓ | ✓ | threads with milestones |
| World | Mini-games (chess, cards) | | | | ✓ | | — |
| Tools | Tool calling, web search | ✓ | | ✓ (MCP) | ✓ | ✓ | planned (helper with search) |
| Tools | Documents / RAG ("Data Bank") | ✓ | ✓ | ✓ | ✓ | ✓ | — (lore and keys) |
| Language | Translation | ✓ | | ✓ | ✓ | | — |
| Reach | Phone | web | web | web, desktop | **Android APK, iOS PWA** | | web |
| Sharing | Browse card sites in the app | by address | Chub browser | Realm hub | card browser | | — |
| Sharing | Chat export as Markdown / HTML | | | | ✓ | | text, JSONL |
| Extending | Plugins or extensions | ✓ | | ✓ (+ modules) | ✓ | node modules | — |

## What stands out

- **Marinara Engine is the closest to Inkwyrm's combination:**
  - characters with weekly schedules who message first;
  - a characters' social feed;
  - a game mode with an AI game master, dice, installable rulesets (5e SRD), combat, maps, time and weather;
  - trackers;
  - a Discord mirror;
  - an Android app;
  - the widest set of media features.

  It is self-hosted (Docker, a Windows installer, an APK), not a hosted service.
- **Talemate** leads on directing a story: a director agent with intentions and planned arcs, and a node editor.
- **RisuAI** leads on scripting: triggers, Lua and modules.
- **Agnai** has a Companion mode (nothing can be undone) and Sagas: typed fields generated each turn for game-like sessions.
- **Everyone has** branches, impersonate, group chat, text to speech and image generation.
