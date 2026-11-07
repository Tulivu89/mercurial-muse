# Mercurial Muse

Working name. An AI roleplay platform built on scripted context management: a narrator that keeps to the rules, and tools for building worlds and characters. Players bring their own model keys.

| Folder | What it is | State |
| --- | --- | --- |
| [`praxis/`](praxis/) | The text-adventure RPG: Four Approaches on Genesys dice, living schedules, the journal, context built per turn, narration from any OpenAI-compatible provider. | Working site, 0.21.0. |
| [`orbis/`](orbis/) | Howling Whispers' worldbuilding hub. | Reference copy only; nothing builds on it. Leaves the tree in roadmap step 3. |
| [`ember/`](ember/) | A freeform living-adventure shell launched from Orbis. | Reference copy only, as `orbis/`. |
| [`deploy/`](deploy/) | One-time server setup and updates. | Praxis only, for now. |

Planned: a character-chat side and a studio for worlds and characters, on one core with the adventure. Their foundations are the owner's NovelAI scripts [Character Engine](https://github.com/Tulivu89/Character-Engine) and [CharacterRoom](https://github.com/Tulivu89/CharacterRoom); the records are our own, for any genre.

`docs/roadmap.md` is the plan for the whole project: the direction, brand, the shared core, the studio and the chat side, in order. `docs/records.md` is the record model, built around what reaches the model and when; `docs/brand.md` is the name shortlist. `docs/` also holds the design: `docs/praxis/` (charter, working notes, the Bogwater module, the rules proposals) and `docs/abernys/` (the setting). Some setting docs still mention Bitterroot in passing; those references are to be trimmed.

## Orbis and Ember

`orbis/` is the Orbis code as of its commit 87be9af (2026-10-13), and `ember/` Ember's as of 6c48dcf. They belong to the Howling Whispers deployment: Discord sign-in, Coda, the Speculus bridge, Bitterroot and its branding. The project goes its own way (see the roadmap), so they are reference only. Ember's Coda sound clip came without verified redistribution rights; see `ember/README.md`.

## Deploying

See [`praxis/README.md`](praxis/README.md#deploy): `deploy/setup-server.sh` sets up a fresh Ubuntu server once (or paste `deploy/cloud-config.yaml` into the host's Cloud config box to do it from a phone), and `bash /srv/muse/deploy/deploy.sh` updates it.
