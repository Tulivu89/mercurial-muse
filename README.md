# Mercurial Muse

The repository's working name. The site is **Inkwyrm** (`docs/brand.md`): an AI roleplay platform built on scripted context management: a narrator that keeps to the rules, and tools for building worlds and characters. Players bring their own model keys.

| Folder | What it is | State |
| --- | --- | --- |
| [`adventure/`](adventure/) | The text-adventure RPG (Praxis until 0.22.0): Four Approaches on Genesys dice, living schedules, the journal, threads with milestones, context built per turn, narration from any OpenAI-compatible provider. In the Wet Ink look, paper and night, since 0.26.0; travel by levels and the map, routes retired, since 0.27.0. | Working site, 0.27.3. |
| [`core/`](core/) | What every side shares: narration (the provider list, prompt formats, the relay's shapes, streaming), the record model (`core/records/`: schemas, reach, what is in context, card import), the rules (`core/rules/`: the state primitive, the standard Four Approaches, a world's own ruleset, travel by level, and `rulesFor(world, record)`), maps (`core/map/`: sheets of hexes laid out from the place tree, the circles drawn from them, and how long a journey takes), the converters between Studio worlds and adventure modules (`core/convert/`) and the chat kernel (`core/chat/`: the AetherRoom and General context profiles). | Used by all three. |
| [`kit/`](kit/) | The browser code the sides share: the Wet Ink tokens and marks, the site's one header, the sheet, world storage, the connection settings. | Imported by path. |
| [`studio/`](studio/) | The Studio, at `/studio/`: worlds and characters in the record model, with rules on every record, a Rules page for the world, Play in the adventure, crossing rules on places, scene actions, a calendar, threads with milestones, a Checks page, an "In context now" panel, a week view for schedules, for big worlds a list that goes one level at a time and record pages whose other jobs are doors (`docs/bids/ui/decision.md`), and a map laid out from the place tree with travel by level (`docs/bids/maps/decision.md`), refined by hand on its ground, with icons to suit its genre, and Errata, a helper who asks, offers answers to pick and drafts any field with your own model, kept only when you keep them (`docs/bids/worldbuilding/decision.md`). The site's own worlds come in from its home page: the dragon's resort first. | 0.14.3. |
| [`chat/`](chat/) | Chat, at `/chat/`: CharacterRoom on the site. A curated portrait collection, shelves and favorites, a separate conversation library, animation-preserving images, characters from the Studio's worlds, streaming replies, both context profiles, card import, story time, schedules, memories and plans, and Home: a place with everyone in it, with the dragon's resort as its first household. | 0.4.1. |
| [`overview/`](overview/) | The Overview, at `/overview/`: Inkwyrm's front page (`docs/front-page/`). On a first visit, what comes with the site: Errata, two worlds, an opening; after, the reader's own characters, worlds and games, with one exact Continue. It reads this browser's stores and writes nothing. | 0.2.1. |
| [`content/`](content/) | Flagship content as Studio world files (`studio-world/1`), written in dedicated sessions to `docs/content/standard.md`. The dragon's resort (`content/dragons-resort/world.json`) is the first; its working papers are in `docs/content/dragons-resort/`. | The pilot, ready to play-test. |
| [`deploy/`](deploy/) | One-time server setup and updates. | Praxis only, for now. |

Three sides on one core: the adventure, the Studio and Chat. The foundations of the last two are the owner's NovelAI scripts [Character Engine](https://github.com/Tulivu89/Character-Engine) and [CharacterRoom](https://github.com/Tulivu89/CharacterRoom); the records are our own, for any genre.

`docs/roadmap.md` is the plan for the whole project: the direction, brand, the shared core, the studio and the chat side, in order. `docs/records.md` is the record model, built around what reaches the model and when, with the mascot as its worked example (`docs/mascot-record.md`). `docs/brand.md` holds the brand decisions; `docs/mascot-brief.md` is the mascot's visual brief; `docs/bids/` holds questions put to several models: maps (decided, phase M1 built), the look and layout (decided and built), and worldbuilding tools. `docs/` also holds the design: `docs/praxis/` (charter, working notes, the Bogwater module, the rules proposals) and `docs/abernys/` (the setting). Some setting docs still mention Bitterroot in passing; those references are to be trimmed.

The [Chat collection guide](docs/chat-collection/README.md) covers character cards, display controls, personal shelves, world-cast membership, and animated image handling.

## Working on it

The [front-page handoff](docs/front-page/README.md) holds the illustrated dashboard direction, a standalone interactive mockup, restrained motion specifications, and a phased plan for a separate implementation chat. The Overview is available at `/overview/`, linked by the site logo; the root remains Adventure until the planned route migration.

One npm install at the root serves every part (npm workspaces): `npm ci`, then `npm test`, `npm run lint` and `npm run build` from the root. `npm run dev:all` starts the adventure's API and interface together; `npm run dev:studio` starts the Studio and `npm run dev:chat` starts Chat (both want the adventure's API running for the relay).

Orbis and Ember, the Howling Whispers reference copies, left the tree in 0.22.0; their code is in the history before that.

## Deploying

See [`adventure/README.md`](adventure/README.md#deploy): `deploy/setup-server.sh` sets up a fresh Ubuntu server once (or paste `deploy/cloud-config.yaml` into the host's Cloud config box to do it from a phone), and `bash /srv/muse/deploy/deploy.sh` updates it.
