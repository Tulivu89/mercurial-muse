# Kit

The browser code the Studio and Chat share. Each app imports these files by path; nothing here is built on its own.

- `src/wet-ink.css`: the Wet Ink look (`docs/brand.md`): tokens for paper and night, type, and the controls.
- `src/Mark.tsx`: the ink drop and the wordmark.
- `src/theme.ts`: paper, night or the device's choice, kept under `inkwyrm.theme`.
- `src/worlds.ts`: worlds in this browser's IndexedDB (`inkwyrm-studio`). The Studio writes them; Chat reads them.
- `src/util.ts`, `src/Fields.tsx`: ids, files, and the name and keys fields.
- `src/connection.ts`, `src/Connect.tsx`: the player's provider, key and model. They are the adventure's own settings (`praxis.provider`, `praxis.novelai.token`, `praxis.key.<provider>`, `praxis.model.<provider>`), so a player connects once for the whole site. Don't rename the keys.
