# Kit

The browser code the sides share: the Studio and Chat use all of it, the adventure its tokens, marks and header. Each app imports these files by path; nothing here is built on its own.

- `src/ink.css`: what every side loads: the Wet Ink tokens for paper and night (`docs/brand.md`), the three faces, and the marks with their motion. The adventure's own stylesheet sits on these.
- `src/wet-ink.css`: the controls on those tokens (buttons, fields, chips, cards, the sheet), for the Studio and Chat.
- `src/SiteHeader.tsx`: the one header of the site: the side's mark, the three sides with the current one underlined, and a gear. All three sides draw it; the adventure only on its start screen.
- `src/Sheet.tsx`: a sheet from the bottom of a phone, a box on a wide screen. The record picker and Settings use it.
- `src/Mark.tsx`: the ink-drop marks.
- `src/theme.ts`: paper, night or the device's choice, kept under `inkwyrm.theme`.
- `src/worlds.ts`: worlds in this browser's IndexedDB (`inkwyrm-studio`). The Studio writes them; Chat reads them.
- `src/util.ts`, `src/Fields.tsx`: ids, files, and the name and keys fields.
- `src/connection.ts`, `src/Connect.tsx`: the player's provider, key and model. They are the adventure's own settings (`praxis.provider`, `praxis.novelai.token`, `praxis.key.<provider>`, `praxis.model.<provider>`), so a player connects once for the whole site. Don't rename the keys.
