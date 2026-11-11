# Mercurial Muse

The repository's working name. The site is **Inkwyrm** (`docs/brand.md`): an AI roleplay platform built on scripted context management: a narrator that keeps to the rules, and tools for building worlds and characters. Players bring their own model keys.

| Folder | What it is | State |
| --- | --- | --- |
| [`adventure/`](adventure/) | The text-adventure RPG (Praxis until 0.22.0): Four Approaches on Genesys dice, living schedules, the journal, context built per turn, narration from any OpenAI-compatible provider. | Working site, 0.24.1. |
| [`core/`](core/) | What every side shares: narration (the provider list, prompt formats, the relay's shapes, streaming), the record model (`core/records/`: schemas, reach, what is in context, card import), the rules (`core/rules/`: the state primitive, the standard Four Approaches, a world's own ruleset, and `rulesFor(world, record)`), the converters between Studio worlds and adventure modules (`core/convert/`) and the chat kernel (`core/chat/`: the AetherRoom and General context profiles). | Used by all three. |
| [`kit/`](kit/) | The browser code the Studio and Chat share: the Wet Ink look, world storage, the connection settings. | Imported by path. |
| [`studio/`](studio/) | The Studio, at `/studio/`: worlds and characters in the record model, with rules on every record, a Rules page for the world, Play in the adventure, routes, scene actions, a calendar, a Checks page, an "In context now" panel and a week view for schedules. | 0.5.0. |
| [`chat/`](chat/) | Chat, at `/chat/`: CharacterRoom on the site. Characters from the Studio's worlds, streaming replies, both context profiles, card import, story time, schedules, memories and plans, and Home: a place with everyone in it. | 0.3.0. |
| [`deploy/`](deploy/) | One-time server setup and updates. | Praxis only, for now. |

Three sides on one core: the adventure, the Studio and Chat. The foundations of the last two are the owner's NovelAI scripts [Character Engine](https://github.com/Tulivu89/Character-Engine) and [CharacterRoom](https://github.com/Tulivu89/CharacterRoom); the records are our own, for any genre.

`docs/roadmap.md` is the plan for the whole project: the direction, brand, the shared core, the studio and the chat side, in order. `docs/records.md` is the record model, built around what reaches the model and when, with the mascot as its worked example (`docs/mascot-record.md`). `docs/brand.md` holds the brand decisions; `docs/mascot-brief.md` is the mascot's visual brief; `docs/maps-brief.md` asks for proposals on maps. `docs/` also holds the design: `docs/praxis/` (charter, working notes, the Bogwater module, the rules proposals) and `docs/abernys/` (the setting). Some setting docs still mention Bitterroot in passing; those references are to be trimmed.

## Working on it

One npm install at the root serves every part (npm workspaces): `npm ci`, then `npm test`, `npm run lint` and `npm run build` from the root. `npm run dev:all` starts the adventure's API and interface together; `npm run dev:studio` starts the Studio and `npm run dev:chat` starts Chat (both want the adventure's API running for the relay).

Orbis and Ember, the Howling Whispers reference copies, left the tree in 0.22.0; their code is in the history before that.

## Deploying

See [`adventure/README.md`](adventure/README.md#deploy): `deploy/setup-server.sh` sets up a fresh Ubuntu server once (or paste `deploy/cloud-config.yaml` into the host's Cloud config box to do it from a phone), and `bash /srv/muse/deploy/deploy.sh` updates it.
