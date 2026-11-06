# Mercurial Muse

Working name. An AI roleplay platform built on scripted context management: a narrator that keeps to the rules, and tools for building worlds and characters. Players bring their own model keys.

| Folder | What it is | State |
| --- | --- | --- |
| [`praxis/`](praxis/) | The text-adventure RPG: Four Approaches on Genesys dice, living schedules, the journal, context built per turn, narration from any OpenAI-compatible provider. | Working site, 0.21.0. |
| [`orbis/`](orbis/) | The worldbuilding hub Praxis's records come from. | Reference copy, imported as it stood; see below. |
| [`deploy/`](deploy/) | One-time server setup and updates. | Praxis only, for now. |

Planned: a character-chat side built on the same context core, and a hub that both sides draw their worlds and characters from.

## Orbis: what to trim

`orbis/` is the Orbis code as of its commit b14669f (2026-10-14), kept so it isn't lost. It still carries parts that belong to the Howling Whispers deployment rather than this project:

- Bitterroot world data and its import (`server/data/bitterroot.json`, `server/bitterroot-*.ts`, `server/import-bitterroot.ts`, their tests, and the fixtures in `src/features/library/fixtures.ts`).
- Links to other Howling Whispers services: Coda and its Discord bot, Ember, the Speculus bridge, and the GitHub repository list in `server/config.ts`.
- Howling Whispers branding (`public/assets/orbis-banner*.webp`, page text) and the legal templates in `docs/legal/`, written for that service.
- Discord as the only sign-in.

The hub this project needs may keep only Orbis's record shapes, editor and import/export.

## Deploying

See [`praxis/README.md`](praxis/README.md#deploy): `deploy/setup-server.sh` sets up a fresh Ubuntu server once, and `bash /srv/muse/deploy/deploy.sh` updates it.
