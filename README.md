# Mercurial Muse

Working name. An AI roleplay platform built on scripted context management: a narrator that keeps to the rules, and tools for building worlds and characters. Players bring their own model keys.

| Folder | What it is | State |
| --- | --- | --- |
| [`praxis/`](praxis/) | The text-adventure RPG: Four Approaches on Genesys dice, living schedules, the journal, context built per turn, narration from any OpenAI-compatible provider. | Working site, 0.21.0. |
| [`orbis/`](orbis/) | The worldbuilding hub Praxis's records come from. | Reference copy, imported as it stood; see below. |
| [`ember/`](ember/) | A freeform living-adventure shell launched from Orbis: storybook reader, writing desk, world rail. No dependencies. | Reference copy, imported as it stood. |
| [`deploy/`](deploy/) | One-time server setup and updates. | Praxis only, for now. |

Planned: a character-chat side built on the same context core, and a hub that both sides draw their worlds and characters from.

`docs/` holds the design: `docs/praxis/` (charter, working notes, the Bogwater module, the rules proposals) and `docs/abernys/` (the setting). Some setting docs still mention Bitterroot in passing; those references are to be trimmed.

## Orbis: what to trim

`orbis/` is the Orbis code as of its commit 87be9af (2026-10-13), and `ember/` Ember's as of 6c48dcf; their earlier history is in the archive uploaded in this repository's first commits. Orbis still carries parts that belong to the Howling Whispers deployment rather than this project:

- Bitterroot world data and its import (`server/data/bitterroot.json`, `server/bitterroot-*.ts`, `server/import-bitterroot.ts`, their tests, and the fixtures in `src/features/library/fixtures.ts`).
- Links to other Howling Whispers services: Coda and its Discord bot, the Speculus bridge, and the GitHub repository list in `server/config.ts`.
- Howling Whispers branding (`public/assets/orbis-banner*.webp`, page text) and the legal templates in `docs/legal/`, written for that service.
- Discord as the only sign-in.

The hub this project needs may keep only Orbis's record shapes, editor and import/export, and Ember's launch handoff. Ember's Coda sound clip came without verified redistribution rights; see `ember/README.md`.

## Deploying

See [`praxis/README.md`](praxis/README.md#deploy): `deploy/setup-server.sh` sets up a fresh Ubuntu server once (or paste `deploy/cloud-config.yaml` into the host's Cloud config box to do it from a phone), and `bash /srv/muse/deploy/deploy.sh` updates it.
