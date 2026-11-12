# Front-page implementation plan

Nov 12, 2026 · @AmbiProp · Proposed implementation contracts, not shipped APIs.

Read [the brief](README.md), [the motion specification](visual-and-motion.md), `docs/brand.md`, `docs/roadmap.md`, the Adventure charter and applicable repository instructions before implementing. Check the current branch: another session may have changed the UI since this handoff. Preserve other work, including the separate UI bids.

Baseline refreshed against main `3b0efb0` (Studio 0.14.0, Adventure 0.27.1, Chat 0.3.1). The shipped UI decision is `docs/bids/ui/decision.md`; read it before changing any frame. Studio's route-based writing page/doors, maps, Draft buttons and the Errata authoring door are existing functionality. This handoff adds an Overview around them.

## What the current code actually provides

| Concern | Current source | Available now / gap |
| --- | --- | --- |
| World library | `kit/src/worlds.ts` | `listWorlds`, `putWorld`, `deleteWorld`; `inkwyrm-studio` IndexedDB. Results sort by `updatedAt`, not last opened. |
| Chat library | `chat/src/store.ts` | `listChats`, `listLives`, portrait readers; `inkwyrm-chat` DB. Readers currently load full objects. |
| Character identity | `core/records/schema.ts`, `chat/src/Home.tsx` | Characters are records in a world. Match by both IDs. Current Chat home shows characters and a NewChatSheet. |
| Chat navigation | `chat/src/App.tsx` | Existing `#/chat/<id>`, `#/home`, `#/settings`; `#/with/<world>/<record>` is planned but not implemented here. |
| Home projection | `core/chat/home.ts`, `core/chat/time.ts`, `chat/src/House.tsx` | Lives, clocks, schedules, room placement, relationship locks and care. `House` currently owns place/room selection in local React state. |
| Life fallback | `chat/src/App.tsx` | Missing Life can inherit the latest chat's clock/relationship/pins; share this resolution rather than having the dashboard assume a fresh Life. |
| Bundled content | `chat/src/errata.ts`, initialization in `chat/src/App.tsx` | Errata and species record; no Home scenario, idle placement or schedule. Existing seeding/version behavior must not become dashboard side effects. |
| Studio navigation | `studio/src/route.ts`, `studio/src/App.tsx`, `studio/src/WorldView.tsx`, `studio/src/WorldList.tsx` | Exact `#/w/<world>?kind=character&rec=<record>&door=<door>` addresses and Back already work. List recents/scroll preferences also exist. Add cross-app activity; do not build a second router or replace the writing/door layout. |
| Adventure summaries | `adventure/src/ui/storage.ts` | `listSaves` returns `SaveRecord`: ID, name, module name/key, updated time, place, stamp, turn count, full save. `openSave` validates module and save. |
| Adventure launch | `core/convert/launch.ts`, `adventure/src/ui/App.tsx` | `inkwyrm.launch` localStorage; root `?launch=<id>` starts a sent world. Saves have no URL-resume route yet. |
| Serving and build | `adventure/server/app.ts`, three Vite configs, root build script | Adventure at `/`; Studio `/studio/`; Chat `/chat/`; catch-all serves Adventure. No dashboard build. |
| Theme/marks/header | `kit/src/theme.ts`, `kit/src/Mark.tsx`, `kit/src/ink.css`, `kit/src/wet-ink.css`, `kit/src/SiteHeader.tsx` | Shared Paper/Night preference `inkwyrm.theme`; tokens/marks/motion in `ink.css`, controls in `wet-ink.css`; one header already serves the three sides. Reuse and extend these. |
| Connection | `kit/src/connection.ts`, `kit/src/Connect.tsx`, Adventure adapter | Shared `praxis.*` keys. Never rename them or duplicate provider settings for the dashboard. |
| Backup | `chat/src/store.ts`, Adventure export, `studio/src/author/store.ts` | Chat backup includes worlds/chats/portraits/lives. It does **not** include Adventure saves/modules, Studio's `inkwyrm-author` talks/drafts, connection settings or the new navigation preferences. Studio's authoring material has its own export. |

## Recommended boundaries

Add a small `overview/` React/Vite workspace when integration begins. The root is the Inkwyrm Overview, with Studio, Chat and Adventure remaining their own workspaces. React 18 and ordinary CSS are sufficient. No server-side user state or account work is required.

Put browser-only shared readers, route builders and navigation preferences in `kit/`, only when a second consumer needs them. Keep rules in `core/`. Extract Life fallback and Home visibility/projection into shared readers around the current pure functions, rather than copying `House` logic into a fourth app. Reuse Adventure's validated save-opening path; never make the dashboard a second engine.

Do not move everything up front. Begin with the missing routes and activity metadata, using Studio's shipped routes as they stand. Extend the existing `SiteHeader` to support the Overview context and consistent access back to it; preserve deliberate navigation back to a side's library and the existing save-flush callbacks. Do not introduce a competing header or add an always-visible header to Adventure play. The study is fixture-only and must not be pasted into production with its demo identifiers, fake schedules, controls or destination dialogs.

## Navigation state: proposed shape

Use a versioned local preference record, for example `inkwyrm.navigation.v1`. This is navigation metadata, distinct from authored world files and play state. Do not reuse `Life.pins`, which already means selected character/set context.

```ts
type CharacterRef = { worldId: string; recordId: string };
type HomeRef = { worldId: string; scenarioId: string; roomId?: string };
type Target =
  | { kind: 'chat'; chatId: string }
  | { kind: 'adventure'; saveId: string }
  | { kind: 'studio'; worldId: string; recordId?: string;
      door?: string; sectionId?: string }
  | { kind: 'home'; worldId: string; scenarioId: string; roomId?: string };
type Activity = { target: Target; openedAt: number };
type NavigationV1 = {
  version: 1;
  startAt: 'overview' | 'last' | 'studio' | 'chat' | 'adventure';
  recent: Activity[];
  pinnedCharacters: CharacterRef[];
  pinnedWorldIds: string[];
  selectedHome: HomeRef | null;
  dismissedExampleIds: string[];
};
```

These names are a suggested contract. Validate loaded data, bound list lengths (20 recent targets and small pin lists are sufficient), reject malformed timestamps, and tolerate old/blocked storage without discarding the library. `openedAt` means a destination successfully opened after an intentional action. It is not a background save timestamp. Keep recents distinct by target identity, newest first. Preserve explicit pin ordering.

Use per-destination UI preferences for field focus/scroll/draft selection; do not stuff large editor state into the global record. Flushing committed edits before navigation remains each editor's responsibility. Never store keys, full transcripts, or model request bodies in this metadata.

Select a Continue target only after resolving its IDs against successfully loaded data. A deleted target is skipped in favor of another valid recent item. If its store failed, it is unresolved, not known deleted: preserve metadata, suppress the uncertain action, and explain/retry. Do not remove pins or recents on a failed read. Fall back to the appropriate library if a target fails between rendering and clicking.

The mockup contains no persistence at all. Its query string records review state only. Real schema readers and writers require their own meaningful tests when built.

## Dashboard selection

Use a normalized read result for each store: `loading | ready | error`. An empty ready list is different from an error. Read stores concurrently, with independent error handling. A Chat failure must not hide a valid Adventure save.

1. Resolve explicit recent targets. Pick the newest valid one for Continue.
2. Resolve pinned characters in user order; append distinct recent chat characters; fill remaining places with non-dismissed included characters. Use the target chat's actual world/persona/scenario. Pinning a character never creates a conversation.
3. Resolve selected Home; derive residents through shared Life fallback, schedule, placement, and lock checks. Choose a valid fallback room without exposing locked rooms. Room selection alone is view state, not a schedule or Life mutation.
4. Resolve pinned/recently opened worlds. Preserve last-worked-on record where valid; fill unoccupied positions from the example manifest.
5. Resolve last intentionally used Adventure save. Read its scene through the current module and pure engine if displaying richer state; if the module is absent, present a recoverable problem, not a Continue action that starts a new game.
6. If no explicit activity metadata exists, use valid existing chat/save timestamps only as labelled “recently saved” fallback. An included world timestamp does not prove authorship. Avoid a false claim about which of unlike stores was last opened.

Use stable identity and ordering. A single recent chat must not make Home, Worlds and Adventure blank; those independent panels can still show included examples. Dismissing examples persists independently from whether the personal library is empty.

An injected `nowMs` goes to time projection. Each Life has its own clock and relationship. Real-time displays may update, while story time stays at its saved value. Do not advance a clock, initialize needs, mark `seenAt`, write an away log, mutate canon, or call a model just to render. Hidden residents must be filtered before constructing text, images, links, counts and announcements. Reuse `levelReaches` and the actual room lock; never implement a second relationship ladder in CSS or the dashboard.

## Route contract and compatibility

The following addresses are proposed except where marked current. Actual IDs must be encoded and validated. Fixture IDs in the study are not canonical identifiers.

| Intent | Address | Work needed |
| --- | --- | --- |
| Overview | `/` eventually; `/overview/` during integration | New build and server mount |
| Chat library | `/chat/` | Current |
| Existing conversation | `/chat/#/chat/<chatId>` | Current; wait for data before deciding missing |
| Character setup | `/chat/#/with/<worldId>/<recordId>` | New parser and prefilled setup; no auto-creation |
| Home | `/chat/#/home/<worldId>/<scenarioId>?room=<roomId>&resident=<id>` | New exact selection, remembered view, lock-aware fallback |
| Connection | `/chat/#/settings` | Current; return-to-origin support needed for interrupted setup |
| Studio world | `/studio/#/w/<worldId>` | Current; use `studio/src/route.ts` |
| Studio record | `/studio/#/w/<worldId>?kind=character&rec=<recordId>` | Current; `kind` reflects the real record kind, with `in` for a containing place where appropriate |
| Studio door | `/studio/#/w/<worldId>?kind=character&rec=<recordId>&door=<door>` | Current doors: `day`, `rules`, `adventure`, `chat`, `errata`, `context`; writing itself has no door parameter |
| Adventure library | `/adventure/` | New base/build/server mount |
| Existing save | `/adventure/?save=<saveId>` | New validated resume branch |
| Studio-sent launch | `/adventure/?launch=<worldId>` | Preserve current launch lookup and semantics |
| Legacy Studio-sent launch | `/?launch=<worldId>` | Forward before Overview handling, preserving the launch parameter |

Example entry addresses such as `?example=bogwater` in the study need an explicit manifest/router implementation. They are not existing Adventure APIs. Look inside an included world also needs a read-only preview; today's import immediately creates an editable world. Do not point a button at an unsupported address and call that phase complete.

Parse hash-path query strings intentionally: `location.search` does not contain a query after `#`. Reuse Studio's `parseRoute`/`formatRoute` contract; extract the pure route construction only if sharing it requires it. Field-level section links beyond the shipped route need a small explicit extension, not new competing route shapes. Use router state, encoded return targets or session state to preserve interrupted character setup/drafts; accept only known local destinations for a return address. Browser Back returns to the previous useful context.

Route migration must cover `adventure/vite.config.ts`, asset base paths, `adventure/server/app.ts`, the shared `SiteHeader` link table, Studio/Chat links and launch producers, deployment assumptions, root workspace scripts, and the Site workflow's production serve checks. Serve static mounts before catch-all fallback. Preserve `/api/*` and existing `/studio/` and `/chat/` asset paths. Avoid a runtime redirect on every explicit Overview click.

Do not change the origin or existing IndexedDB/settings names. Same-origin deployment is required for these readers to see the same library. Independent Vite ports are separate origins; use a same-origin development gateway when testing integration, rather than concluding that the stores are empty.

## Example manifest and ownership

Before shipping a first-visit dashboard, provide a versioned catalog of included content and cover/portrait metadata. Rendering the catalog does not install a world, create a save, or seed a Life. An explicit Use example/Make a copy action invokes existing import/create paths with collision handling and provenance.

Do not overwrite a user's edited copy when the bundled example changes. Do not quietly recreate a dismissed/deleted example. Keep the existing Errata seeding behavior stable unless a separate, tested content migration replaces it. The dashboard itself must be read-only with respect to these stores.

Metadata such as artwork/focal point needs a real owner and export strategy if it becomes authored data. Do not scatter permanent user cover images into a second untracked store merely to match the illustration. Initially, included covers can live in the example catalog and personal worlds can use a deliberate text-cover fallback.

## Shippable phases

### F1 — Exact destinations and activity

Add validated Adventure resume, Chat setup and exact Home routes. Reuse Studio's existing world/record/door addresses and list navigation; add cross-app activity hooks around successful opens. Share pure builders where needed. Persist a bounded recent list and selected Home after successful intentional opens. Preserve each editor's save behavior and browser Back. Keep current root/Adventure behavior intact. This groundwork can land without an Overview page.

Check invalid/deleted IDs, duplicate character names, multiple chats with one character, private Home rooms, failed reads and page reloads. Confirm no new conversation or game appears merely from opening setup or the dashboard.

### F2 — Finished example path

Author the writing-room Home and Errata's schedule, add final approved artwork, and complete any other featured chat characters. Add the manifest and an inspect-before-copy path. Keep examples recognizable but separate from editable personal copies. Confirm a fresh browser can go from a visible example room to that room, and from its resident to coherent chat setup.

Final art can follow an initial implementation with explicitly labelled composition art, but public first-visit claims must match working content. Missing vault assets are an art-delivery dependency; do not redesign Errata to avoid it.

### F3 — Functional Overview at an explicit address

Add `overview/` and mount `/overview/`. Reuse `SiteHeader`, tokens, fonts, marks, connection and theme. Implement the four panels against real stores, independent loading/error states and a valid Continue action. Keep initial selection small and deterministic. No fake updates or model calls. Ship Paper/Night and the restrained effects, including reduced motion.

Validate the same-origin flow with personal data in all three apps. UI should stay useful with one conversation, no personal Home and no worlds. Before examples are complete, any internal preview must clearly identify unfinished content.

### F4 — Make it the front door

Mount Adventure at `/adventure/`, preserve legacy `/?launch=...`, make `/` Overview, and update all links, assets and serve checks together. Add Start here with loop-safe preference handling. Verify a saved game resumes unchanged, and direct links never detour through the dashboard. Keep Adventure's story → prompt → five closed menu sections and its no-header play layout.

Pins/dismissals can land alongside this phase if not already present. Respect them across sessions and content refreshes. Describe backup coverage accurately; unified backup is separate work unless explicitly included in the implementation scope.

### F5 — Home activity when Chat supports it

Show saved posts and comments with real timestamps. Generation stays opt-in through Chat. Add only the shared readers needed for that integration. Do not hold the functional dashboard for the full social feature set.

## Acceptance checks for implementation

- Fresh browser: finished included content; no account/key gate for inspection; no automatic personal objects or model requests from arrival.
- Existing library: one action resumes the exact valid chat/save/record. Persona/scenario, unresolved checks, unsent drafts and module snapshots survive.
- Partial library: personal content and clearly labelled included fillers coexist. A recent chat does not displace the wrong world's character with the same name.
- Empty library with examples dismissed: useful create/import actions; examples stay dismissed until explicitly restored.
- Storage failure: read error differs from empty; successful panels remain; Retry does not delete records, recents or pins.
- Time/visibility: each character's clock is respected; dashboard read writes no Life or rules state; hidden-room facts remain hidden in every representation.
- Cross-tab return: refresh on focus/visibility restoration so a recent save in another app becomes visible; do not depend on `storage` events to detect IndexedDB writes.
- Routing: every listed route works on direct load and Back; old launch links reach Adventure; explicit links beat start preferences; no redirect loop or wrong asset base.
- Accessibility: 390/320 px and large text; keyboard controls and focus return; labelled rooms and residents; Paper/Night contrast; reduced motion leaves content visible.
- Performance: no generation on load, no blocking full-library recap, stable image dimensions, bounded recents/visible content.
- Backups: UI states actual coverage; Adventure exports remain available. No database/key rename or destructive migration.
- Repository: `npm test`, `npm run lint`, `npm run build`; production route and asset checks for all four mounts when those mounts are introduced.

For production logic, add focused tests around selectors, metadata validation and route compatibility. Avoid tests that simply reproduce markup. The fixture study has its own browser validation record; it does not establish that these application integrations already work.
