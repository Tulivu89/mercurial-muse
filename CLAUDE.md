# Mercurial Muse: instructions for Claude

Read `README.md` for what each folder is and how to install, then `docs/roadmap.md` (the direction and order of the whole project), `docs/praxis/charter.md` (every decision and the progress table) and `docs/praxis/working-notes.md` (how the work gets done) before changing scope or architecture. The adventure's own code rules are in `adventure/AGENTS.md`.

## The project

The site is **Inkwyrm** (`docs/brand.md`: the name, the Wet Ink look and its tokens, the ink-drop marks); the repository keeps its working name. An AI roleplay platform whose strength is its features: scripted context management, a rules-driven roleplay system, and worldbuilding and character-building tools. Three parts on one core: the Praxis text-adventure RPG (built), a deep character-chat side, and a studio for worlds and characters. The foundations are the owner's NovelAI scripts, Character Engine (`Tulivu89/Character-Engine`) and CharacterRoom (`Tulivu89/CharacterRoom`); the records are our own, for any genre, not Orbis's. CharacterRoom's context management (the owner's rewrite) carries across to the site and grows to serve every model family. The record model is `docs/records.md`. The site's Errata is the dragon's resort's (`content/dragons-resort/`); the older mascot record (`docs/mascot-record.md`) is retired. Players bring their own model keys until a partner provides models.

- `adventure/` is the working app (Praxis until 0.22.0). Most work happens here.
- `core/` holds what every side shares: narration (providers, prompt formats, the relay's shapes, streaming), the record model (`core/records/`), the rules (`core/rules/`) and the chat kernel (`core/chat/`). Code moves into it when a second side needs it, not before.
- `core/rules/` is the state primitive, the clock, the ruleset's schemas, the standard ruleset `four-approaches/1`, a world's own rules, threads and their milestones (`threads.ts`) and `rulesFor(world, record)`. The adventure's engine re-exports what moved there. It is pure, like the engine. A record stores only the rules its author changed; read a record's rules through `rulesFor`, never from its `rules` block.
- `core/map/` is maps (`docs/bids/maps/decision.md`): every place that holds others has a sheet of hexes laid out from the place tree (`sheet.ts`), the circles are drawn from those sheets, `journey.ts` times a trip by the levels (`core/rules/levels.ts`) and the map, and `edit.ts` holds what an author can change on a sheet. It is pure and stores nothing generated; an author's changes to a sheet are the only map data a world keeps. `kit/src/MapView.tsx` draws it.
- `core/convert/` turns adventure modules into Studio worlds and back, and holds the shape of the Studio's hand-off to the adventure (`inkwyrm.launch`). It lives until the adventure reads records directly (roadmap step 6). The adventure's tests run a second time on the round-tripped modules; a change to the record model, the rules or the module format has to keep that green.
- `core/chat/aetherroom.ts` is CharacterRoom's kernel for xialong-v1, held byte for byte by `core/tests/aetherroom-parity.test.ts`. Don't change it without re-recording the fixtures from CharacterRoom.
- `kit/` is the browser code the sides share: the Wet Ink tokens and marks (`ink.css`, which the adventure's own stylesheet sits on), the site's one header (`SiteHeader.tsx`, on all three sides, never in the adventure's play screen), and for the Studio and Chat the controls, the sheet, world storage, fields and the connection settings (the adventure's own `praxis.*` keys; never rename them).
- `studio/` is the Studio, served at `/studio/`: worlds and characters in the record model, with the rules on every record (`docs/studio-brief.md`; its phases are in `studio/README.md`).
- `chat/` is Chat, served at `/chat/`: CharacterRoom on the site (`docs/chat-brief.md`). Its phases and changelog are in `chat/README.md`.
- `overview/` is the Overview, served at `/overview/`: the site's front page (`docs/front-page/`). It reads the other sides' stores and writes nothing, makes no model calls, and takes its Continue from `kit/src/activity.ts`, which each side writes when something really opens. The root stays the adventure's until phase F4.
- One npm install at the root (workspaces). Orbis and Ember are gone from the tree; their code is in the history.
- The look and layout were decided in `docs/bids/ui/decision.md`: the Studio's list goes one level at a time, a record's page is the writing with doors to its other jobs, and every Studio page has an address (`studio/src/route.ts`). Read it before changing a frame.
- `docs/bids/` holds questions put to several models: a brief, Claude's own proposal where it could win (written before any bid is read, never revised), the bids, and the decision. Its README says how a bid runs.
- `docs/content/standard.md` is the content standard for flagship records: what lands in context (measured), tiers and budgets (provisional), the failure list, and how a seed grows into a region. Its assumptions table says what is still untested. `npm run content:check -- <file>` checks a world file or module against it. The writing skills are in `.claude/skills/`: `pulp-voice` for prose, `inkwyrm-records` for records. Flagship content is written in dedicated sessions, never by the model connected to the site.
- `content/` holds flagship worlds as world files. `kit/src/included.ts` brings them into a browser (the Studio's home, Chat's Home, the Overview's examples); the resort is the house, which Chat puts in a first visitor's browser, and `studio/tests/resort.test.ts` holds the dragon's resort to the standard: checker clean, Checks clean, every schedule stop real. Edit the world file, not the browser copy. The plan for what gets written next is `docs/content/next.md`.
- `docs/testing/chat-lab.md` is how a weak chat reply gets pinned on the model or the setup: Chat saves a test pack (`core/chat/testpack.ts`), and `npm run chat:lab` rebuilds the turn under several setups for another app's model to play, then scores the replies (`studio/src/lab/chatLab.ts`). `npm run chat:lab -- suite` runs the standing suite (`content/dragons-resort/lab-suite.json`), no pack needed, and `AGENTS.md` (with `GEMINI.md`) tells other apps' coding agents how to set up and run it. `lab/` is gitignored: packs hold real chats.
- **Abernys is retired (Nov 15).** `docs/abernys/` and the Bogwater plan and design in `docs/praxis/` stay, but nothing in that setting is developed or suggested: no new places, people, gold passes or engine work for its sake. Bogwater stays the adventure's test module until a replacement comes, and its JSON stays a test fixture; Port Covenant is a test fixture only. `docs/praxis/` still holds the adventure's design docs.

## Working with the user

- Never use the user's real name in anything. Sign docs `@AmbiProp`.
- The user doesn't use git. When something needs their action, give the specific plain steps (open the pull request, **Merge pull request**, **Confirm merge**) and handle everything else.
- Keep replies concise and lead with what changed or what to do next. Don't narrate failed attempts at length.

## Writing and worldbuilding

Chat characters (the dragon's resort pilot, and any character people chat with) are built with the bot-writing skill, following `docs/content/pilot-brief.md`. The rules below are for worlds, places and NPCs.

- Pulp-voice for every record field and design doc: concrete, plain, no AI-slop patterns. The narrator copies the records' voice.
- Names a reader can say on first sight: Welsh and Celtic as inspiration only, anglicised or plain fantasy, a few clichés at most.
- No glossary words: dock, not staithe; eel fence, not weir.
- A character shows their species in one or two traits and a colouring, never a restated species record.
- A place or person exists only if a scene or a rule uses it. At most four named people in a place at once.
- Schedules in times of day (morning from 6, afternoon from 12, evening from 18, night from 22): one daily round for most people, a few exceptions for the people threads turn on.
- Known stories can model dynamics, never names or details.
- The full rules are in `docs/praxis/bogwater-plan.md` under Writing rules. They still hold; the rest of that file is retired with Abernys.

## Git and checks

- Work on a branch and open a pull request into `main`. CI (the Site workflow) runs when `adventure/`, `core/`, `kit/`, `studio/`, `chat/` or the root package files change.
- From the root, run `npm test`, `npm run lint` and `npm run build` before finishing.
- Deploys: `deploy/setup-server.sh` once on a fresh Ubuntu 24.04 server, then `bash /srv/muse/deploy/deploy.sh`. The service is `inkwyrm`, defined in `deploy/inkwyrm.service`; the server account is still `praxis`.
