# Prompt for the implementation chat

Copy the following into the chat that will build the feature. It is intentionally scoped to a small first change; the rest of the handoff remains available for later phases.

---

Implement the first phase of Inkwyrm's front-page groundwork from `docs/front-page/README.md` and `docs/front-page/implementation.md`. The owner has requested a front page that begins as an illustrated showcase and becomes a useful dashboard: Home, Characters, Worlds and Adventure, with one exact Continue action for returning users. Studio remains the authoring workspace.

Read those files, `docs/front-page/visual-and-motion.md`, the interactive mockup, current repository instructions, brand, roadmap, shipped UI decision and Adventure charter. Inspect the current code before choosing the smallest first slice. This handoff was refreshed against main `3b0efb0`; other chats may have changed it further. Work on a short-lived branch, preserve unrelated work, and prepare a reviewable PR.

Start with F1: dependable exact destinations and local activity metadata. Add direct opening for existing Adventure saves, exact Home selection that survives navigation, and character setup without automatically creating a chat. Studio already has `#/w/<world>?kind=character&rec=<record>&door=<door>` routes; reuse `studio/src/route.ts` and add activity hooks rather than another router. Preserve its writing-page/doors layout, maps, Draft buttons and Errata authoring work. Keep valid existing Chat routes and extend the shared `SiteHeader` when Overview needs it. Record meaningful activity only after a destination successfully opens. Resolve deleted/unavailable targets safely. Shared route construction and metadata validation belong in the browser kit when genuinely shared. Keep schedule/state rules pure and shared.

Keep Adventure at its current root until its new mount, old launch-link compatibility, asset paths and production checks can move together in F4. Do not replace the production root merely to display the mockup. An explicit `/overview/` will be the safe integration address in F3.

The mockup is one standalone fixture file, not a product implementation. It includes first/returning/partial/empty/error/loading states, Paper/Night and brief motion. Its demo IDs, proposed route dialogs, room schedule, character silhouettes and saved-state labels must not be copied as actual data or shipped claims. Errata's current bundle lacks a Home scenario and schedule; F2 supplies that content and uses the approved CharacterVault art when available.

Preserve same-origin browser storage, existing database and provider-setting names, world canon versus saved play, unsent drafts, and Adventure's story → prompt → menu layout. The dashboard must make no model requests, create no chats/saves/Lives on arrival, and reveal no private-room information. A failed local read is not an empty library. Chat's current backup does not cover Adventure saves or Studio authoring talks/drafts, which have their own exports; keep its wording accurate.

Use the acceptance checks in the handoff and add meaningful tests for the production behavior you implement. Run `npm test`, `npm run lint` and `npm run build`, and the production route checks when serving changes. Summarize what landed, what was tested, and which phase is next. The owner wants a concrete implementation and a PR they can review, not another round of general design questions.
