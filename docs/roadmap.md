# Roadmap

Nov 7, 2026 · @AmbiProp

The plan for everything past the first live server. *Praxis — Charter* keeps the adventure's own decisions; this page keeps the order of the whole project and the decisions that cross its parts.

## Where we stand

- **The adventure** (Praxis, `praxis/`, 0.21.0) is live on the Hetzner server at `135-181-31-213.sslip.io`. It plays Bogwater and narrates through the player's own key. Updates are `bash /srv/muse/deploy/deploy.sh` on the server.
- **The hub** exists only as the Orbis reference copy (`orbis/`). It is the Howling Whispers archive: Discord sign-in, PostgreSQL, Coda, the Speculus bridge, Bitterroot data and branding. Most of it does not belong here.
- **The chat side** exists as the CharacterRoom NovelAI userscript and its Discord bot. Neither is in this repository yet.
- **Ember** (`ember/`) is a reference copy of a freeform adventure shell. Its storybook reader and its launch handoff are the parts worth reading.

## The four parts

| Part | Today | Goal |
| --- | --- | --- |
| Brand | Working name Mercurial Muse. Praxis and Orbis are Howling Whispers names. | Our own name for the site and for each side, our own look, no Howling Whispers name or asset anywhere a player can see. |
| Adventure | Praxis, built and live. | The rules-driven text adventure under its new name, with the same engine. |
| Hub | Orbis, someone else's deployment. | A worlds-and-characters hub of our own that feeds both sides. |
| Chat | A NovelAI userscript and a Discord bot. | Deep character chat on the site, on the same context core and provider relay as the adventure. |

## Decisions this plan makes (open to the owner's veto)

1. **Folders and code are named by job, not by brand.** `adventure/`, `hub/`, `chat/`, `core/`. Brand names live in one file of display text per side. A later rebrand is then a text change, not a move.
2. **One shared core.** What the adventure already has that chat needs moves to `core/`: the provider list and relay (`src/narration/`), the prompt formats, the context budget, the journal, and the record shapes. Both sides import it. One repository, npm workspaces, one CI job per folder as now.
3. **The hub is built fresh, not trimmed from Orbis.** Orbis is mostly the parts we must drop. We keep its record shapes (`docs/orbis-record-shapes.md`), the patterns of its editor and its import and export, and Ember's launch handoff, and write the rest on the adventure's stack.
4. **Local first, accounts later.** Hub v0 stores records in the browser, with export and import files, like adventure saves. No sign-in, no database, nothing personal on the server. Accounts come when sharing does (step 6).
5. **The format names change before outside players arrive.** `praxis-module/1`, `praxis-save/1`, `praxis-records/1`, `praxis-export/1`, the `praxis` browser database and `PRAXIS_PROVIDERS` carry the old brand. They get neutral names, and the importer keeps reading the old ones so no save is lost.

## Order

Each step is one or more pull requests. The adventure's own list (charter, *Next, in order*) runs alongside from step 2 on.

### 1. Brand (the owner's call, Claude drafts)

- One name for the site, and a name or plain label for each side (adventure, hub, chat). Plain labels ("Adventure", "Characters", "Worlds") under one site name are the cheap option and never collide with anyone.
- Checks before choosing: the .com or a good alternative is free, no live product in AI chat or games uses it, and it reads aloud on first sight.
- A look: one logo mark, two typefaces, a colour set. The adventure's current look (dark ground, Literata, Atkinson Hyperlegible Next) is a fair start.
- A domain, which replaces the sslip.io address.

Nothing else waits on this except step 3's display text.

### 2. Shape the repository

- Move `praxis/` to `adventure/`, pull `core/` out of it, and keep every test passing. The server account, service and paths move with it (`/srv/muse/adventure`); `deploy.sh` handles the move once.
- Rename the formats and the browser database, with old names still read.
- Trim `orbis/` and `ember/` to the parts listed in decision 3, or archive them out of the tree once the hub has what it needs.

### 3. The new name on the adventure

- The display text, the page title, the in-app guide's title, and the README.
- The adventure keeps its own development pace: the evaluator, NPC opposition dice, branches, Bogwater's engine asks.

### 4. Hub v0

- Records for worlds, places, people, groups, things and notes, in the shapes the adventure already reads.
- An editor per record kind, a world view that lists what is inside a place, and export and import of one world as a file.
- **Play in the adventure** and **Chat with** on a record: the handoff Ember used, carrying the records the other side needs.
- The adventure's local records (`praxis-records/1` today) come in as hub records.

### 5. Chat v0

- Needs from the owner first: the CharacterRoom userscript, the Discord bot's code, and a list of what each does that players use most.
- Port, don't copy: CharacterRoom's behaviour on `core/` (provider relay, prompt formats, context budget, journal), with the site's own screen.
- A character card holds persona, appearance, greeting, example messages, lorebook entries and schedule. The card is a hub record, so a character made once works in both sides.
- Chats saved in the browser with export and import, like adventure saves.
- The Discord bot stays its own thing until the site version is solid; then it reads cards from the hub.

### 6. Accounts and sharing

Only once there is something to share: sign-in (email link, no Discord dependency), records stored on the server, public and private worlds, and a published character list. This brings terms, a privacy page, a content policy and backups, so it waits until the rest is worth it.

### 7. Partner models

When a partner provides models, their endpoint goes in the provider list (`PRAXIS_PROVIDERS` today), and the "bring your own key" step becomes optional for players.

## Questions for the owner

1. Can Orbis and Praxis code be reused freely here, with only the names and assets left behind? This plan assumes yes.
2. Should Claude draft name candidates now, with the checks in step 1 done for each?
3. Where are the CharacterRoom script and the Discord bot's code? A zip or a repository Claude can be given works.
4. Is local-first right for the hub's first version, or are accounts needed sooner?
