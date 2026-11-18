# Standards: decision

Nov 17, 2026 · @AmbiProp · Answered by the owner Nov 17; X1 built Nov 18 (Studio 0.16.0, Chat 0.6.2); X2 to X4 next

From the brief, the card specs, and the source of SillyTavern, Agnai and RisuAI (notes beside this page).

## The plan in a few lines

Our card import already reads the formats most apps write, but some of what it brings in arrives broken. The card's own lore can carry `@@` decorator lines and macros we don't replace, and both reach the model as raw text. And the most common card extension, the character's note at depth, is dropped without a word. Fix that first. Then lorebook files in and out, cards out, CHARX in, and SillyTavern chat files in and out. Personas, presets, regex scripts and lore that triggers by chance or by groups are not adopted here; the last two go to the memory and feature reviews.

## What the apps agree on (settled)

- **The `chara` PNG chunk with a V2 card is what every app reads.** V3 in a `ccv3` chunk is read by SillyTavern and RisuAI but not Agnai. SillyTavern writes both chunks; RisuAI's default V3 PNG has only `ccv3`.
- **A lorebook is a handful of field names, read loosely.** V2's book (`keys`, `content`, `insertion_order`, `enabled`, `constant`, `selective`, `secondary_keys`) and SillyTavern's World Info file (`{ entries: { uid: { key, keysecondary, content, order, disable, … } } }`). RisuAI reads both plus Agnai's and NovelAI's dialects in one importer, and SillyTavern reads four. Whatever we write, every app can read SillyTavern's World Info shape.
- **SillyTavern's extras travel in `extensions`.** The character's note at depth (`extensions.depth_prompt`) and each book entry's extras (`extensions.position`, `depth`, `role`, `probability`, `sticky`, `group` and so on) are honoured by the other apps too.
- **Nothing is destroyed.** V2 and V3 both require an editor to keep unknown `extensions` through import and export. Agnai and SillyTavern do.
- **SillyTavern's JSONL is the chat file others read.** One header line, then one line per message with `name`, `is_user`, `mes`, `swipes` and `swipe_id`.

## What our import gets wrong now

Checked against `core/records/tavern.ts`:

| What a card can carry | What happens now | Effect |
| --- | --- | --- |
| `@@depth 4`, `@@activate` and other decorator lines at the top of a lore entry | Kept in the text | Sent to the model as written |
| `{{random::a::b}}`, `{{roll:d20}}`, `{{// note}}`, `{{original}}`, `<USER>`, `<BOT>`, `{{charIfNotGroup}}`, `{{persona}}` | Not replaced (we do only `{{char}}`, `{{user}}`, dates, times) | Raw braces in the prompt; the model may copy them |
| `extensions.depth_prompt` (the character's note) | Dropped, with no note | The writer's strongest steering is lost |
| Secondary keys and their logic (`selective`) | Dropped | An entry meant for "Mara *and* the river" fires on any mention of Mara |
| Regex keys (`/…/` or `use_regex`) | Matched as plain words | Never fire |
| `nickname` | Becomes a key, but `{{char}}` still uses the name | Small |
| `group_only_greetings`, `assets` (in JSON) | Dropped | Lost if we ever export |
| The card's `extensions` and unknown fields | Dropped | Breaks the spec's "never destroy" the day we export |

We match keys case-insensitively on whole words, and a Named section stays until the scene moves on. That already does what SillyTavern needs `sticky` and the whole-word setting for. Nothing to adopt there.

## The calls

| Standard | Call | Why |
| --- | --- | --- |
| Decorators | **Strip all; translate a few.** `@@dont_activate` becomes Never; `@@activate` becomes Here; the rest are listed in the import notes | Never send them. Most of them are positions and timings our reaches already decide |
| V3's required macros plus SillyTavern's common ones | **Replace at send time** (random, pick, roll, comments, `{{original}}`, `<USER>`/`<BOT>`/`<CHAR>`, `{{charIfNotGroup}}`, `{{persona}}`, `{{weekday}}`, `{{trim}}`, `{{newline}}`); `{{char}}` uses the nickname | Raw braces in a prompt are a bug. A separate step before CharacterRoom's own, so the AetherRoom parity fixtures stay byte for byte |
| Variable macros (`setvar`, `getvar`, `if`) | **Skip; warn on import** | Script state that the model's text moves. Against "the model never moves a number". |
| `extensions.depth_prompt` | **Import as a Here section**, titled so the author sees where it came from | It's the writer's main steering. Placing it N messages back is a prompt-layout question for the memory review |
| Secondary keys | **Keep them on the section; match "and any of these"** | A small addition to a section (a second key list). Their other three logics come in as notes |
| Regex keys | **Keep, and flag in the import notes** | Rare; a plain-word key the author picks does the job |
| SillyTavern's per-entry extras (probability, groups, sticky, cooldown, delay, position, depth) | **Note on import, don't model** | Chance and groups are memory-review questions. Our reaches already cover position and stickiness. |
| Card `extensions` and unknown fields | **Keep on the record, write back on export** | The spec requires it, and it costs one field |
| Lorebook files in | **Adopt**: SillyTavern World Info, V3 `lorebook_v3`, a V2 book alone, Agnai's and RisuAI's exports, and NovelAI's `.lorebook`. All become Lore records in a world | How lore travels. NovelAI's matters most to us: the owner's own books are there |
| Lorebook files out | **Adopt**: a world's lore as SillyTavern World Info JSON | The one shape every app reads |
| Cards out | **Adopt**: V3 as JSON, and as PNG with both `chara` (V2) and `ccv3` chunks, as SillyTavern does. Here sections become the description, Named ones the card's book with keys, greetings and examples go across, and the whole record rides in `extensions.inkwyrm` so our own round trip loses nothing | Players will want to take a character with them. Agnai shows the lossless trick |
| CHARX in | **Adopt**: card, icon as portrait, emotion assets onto our emotion slots | RisuAI's default share and RisuRealm's downloads. Needs a small zip reader |
| CHARX out, RisuAI modules, `.risup` presets | **Skip** | Our PNG and JSON reach every app; modules and presets are RisuAI's own |
| SillyTavern chats in | **Adopt**: JSONL to one of our chats with a character the player picks; swipes become alternative replies, `is_system` lines become notes | Players arrive with long chats |
| Chats out | **Adopt**: JSONL and plain text | Cheap once the reader exists |
| Personas | **Skip** | No shared file exists (SillyTavern only backs up all of them). CharacterRoom user cards stay our way in. |
| Card's own system prompt | **Optional, flagged on import** (the owner, Nov 17) | Kept unsent, with a switch to send it and a line in the import notes that the card has one. V2 says it overrides the player's prompt; ours does real work (time, states, notes) |
| Fetching from Chub, JanitorAI and other sites by address | **Skip for now** | The server would fetch other sites' pages, with their terms in play. The player can download the file |
| Providers and prompt formats | **Nothing to do** | We already speak the OpenAI-style API and cover the main families |

## Phases

| Phase | What | Size |
| --- | --- | --- |
| **X1, nothing leaks** | Decorators stripped and translated; the macro step; the character's note as a Here section; secondary keys on sections; nickname for `{{char}}`; extensions kept; import notes that list everything not brought across. Tests with real cards from each app | One PR, core and Chat |
| **X2, lorebooks in and out** | The loose reader for every lorebook dialect (including NovelAI's, from a sample), into Lore records; World Info export from a world in the Studio | One PR, core and Studio |
| **X3, cards out, CHARX in** | V3 JSON and dual-chunk PNG from a character (Studio and Chat's collection); the record in `extensions.inkwyrm`; CHARX import with portraits | One PR |
| **X4, chats in and out** | SillyTavern JSONL in; JSONL and text out | One PR, Chat |

X1 first: it fixes what testers can already hit. The rest can go in any order.

## The owner's answers (Nov 17)

1. **A card's own system prompt:** send it where it fits, but keep it optional and flag it on import.
2. **NovelAI lorebooks:** a real file came with the answer (`lorebookVersion: 6`): entries with `text`, `keys`, `displayName`, `enabled`, `forceActivation`, `searchRange`, `category`, `contextConfig` (budget priority, insertion position, prefix and suffix), `loreBiasGroups` and `advancedConditions`; the book has `settings`, `categories` and `order`. X2 reads it: text, keys, name and enabled cross over; `forceActivation` becomes Always; categories become tags; the rest goes into the import notes.
3. **Secondary keys:** yes, a second key list on a Named section.
4. **Chat issues:** Gemini 3.8 Flash replies stop partway and need Continue, each stop ends on an emotion line, and there's no sign of a refusal. These are prompt and reply-handling problems, not standards. They go to a fix pass and to a new review of prompt setup (`docs/reviews/README.md`). The owner isn't tied to CharacterRoom's setup outside Xialong.
