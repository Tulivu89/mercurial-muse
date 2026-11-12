# Front page: how it fits the work so far

Nov 12, 2026 · @AmbiProp · Claude's reading of the front-page handoff (`README.md`, `implementation.md`, `visual-and-motion.md`), checked against the code at Studio 0.14.0. **A plan for the owner to approve or change; nothing here is built yet.**

The handoff's phases stand: F1 destinations and activity, F2 finished examples, F3 the Overview at `/overview/`, F4 the root, F5 Home posts. This page says where each one touches the Studio's newer work (maps, Drafts, Errata), what to take from that work, and the order to build in alongside the worldbuilding phases.

## What the code check found

The handoff's code map is accurate. Three points matter for the order:

1. **The Studio already links to an address Chat doesn't read.** *Chat with Dee Harlow* on a character's page opens `/chat/#/with/<world>/<record>`. Chat parses only `#/chat/<id>`, `#/home` and `#/settings`, so the link lands on Chat's own home page. F1's character-setup route fixes a live dead end, not just a future one.
2. **Adventure saves can't be opened by address.** `listSaves` and `openSave` exist (`adventure/src/ui/storage.ts`), but the start screen only reads `?launch=`. The Overview's Continue can't work for a game until `?save=<id>` does.
3. **The server already mounts sides cleanly.** `/studio/` and `/chat/` are static mounts before the catch-all (`adventure/server/app.ts`). `/overview/` is the same three lines, so F3 doesn't wait on F4's root move.

## What the Studio's work gives the front page

| From | What it gives | Where it shows |
| --- | --- | --- |
| **Drafts and Errata** (W1, W2) | Real, cheap, honest signals of unfinished writing: drafts waiting under fields and lines settled with Errata, read from the Studio's own `inkwyrm-author` store by its `world` index. | **Worlds panel, Continue writing:** *Dee Harlow · 2 drafts waiting · 3 settled*, opening `/studio/#/w/<world>?kind=character&rec=dee&door=errata`. That's the strongest returning-author line the page can have, and it's real data, not a guess from `updatedAt`. |
| **Studio addresses** (UI decision) | Exact pages for a world, a record and a door, with Back. | Every Studio target in the activity record. The door is kept, so a return to Errata's door goes back to Errata, not just the record. |
| **Maps** (M1 to M4) | Every world with places already has a circles map, drawn from its place tree, with its genre's icon set. | **The cover for a personal world without art.** The handoff asks for "a deliberate text-cover fallback". The world's own circles, small, under its name, are better: generated from the author's own data, never claiming art it doesn't have, and different for every world. `kit/src/MapView.tsx` already draws them. A world with no places keeps the text cover. |
| **Errata, twice** | Chat has Errata the character (her full card). The Studio has Errata the helper (her name and a light touch). | **Characters panel:** *Meet Errata* goes to Chat, as the handoff says. **Worlds panel:** *Make a world* can add *Errata helps you build it*, linking the same mascot to the Studio's job. One mascot, two jobs, each in its own panel. The helper's Plain voice setting stays the author's to choose. |
| **Talks export** (W2) | Talks and waiting drafts in their own file. | **Backups & restore** lists what each export covers: Chat's backup (worlds, chats, portraits, Lives), Adventure's saves, the Studio's world files and *Export talks*. The handoff already warns against overclaiming. This makes the list complete. |
| **Activity in the Studio** | The Studio knows when a record really opens (its route resolves) and when a draft is kept. | F1 records `{ kind: 'studio', worldId, recordId, door }` on a resolved open. A kept draft also counts as meaningful activity. A draft written and never kept doesn't. |

## What the front page asks of the Studio

- **Look inside an example, read-only.** Today, bringing in Bogwater makes an editable copy at once. The handoff wants inspection first. In the Studio that's a *preview* world: the same `WorldView`, opened from the example catalog instead of the store, with editing off. Draft buttons, the Errata door, map tools and Delete are hidden, and **Make a copy** sits at the top. One flag through `WorldView` and `RecordEditor`, tested so a preview can never write to `inkwyrm-studio` or `inkwyrm-author`.
- **Start here** in the Studio's Settings sheet, beside the theme and the helper, once F4 adds the preference.
- **The shared header** gains the Overview: the wordmark leads to `/overview/` (then `/`), and the three sides stay as they are. Adventure's link moves only in F4.

## Content: build the example with the Studio

F2 needs Errata's writing room: a scenario with rooms, Errata's evening schedule, and her placement. That's exactly what the Studio and its helper are for. Build it in the Studio, in the house world, with Errata drafting the fields: the first real use of W1 and W2 on content that ships. It also gives the live prompt tests their first real run. The art (her approved CharacterVault design, the room) stays an owner dependency and doesn't block F1 or F3.

## The order, with the worldbuilding phases

| Step | What | Why here |
| --- | --- | --- |
| 1. **F1** | Chat's `#/with/<world>/<record>` setup (fixing the Studio's dead link) and exact `#/home/...`; Adventure's `?save=<id>`; `kit/src/navigation.ts` (the versioned activity record, validated and bounded, plus shared address builders); activity hooks in all three sides, with Studio doors and kept drafts. | Small, fixes a live bug, and everything after it needs it. |
| 2. **W3, Try a scene** | As planned. | It's next in the approved worldbuilding order and doesn't touch the front page. |
| 3. **F3, the Overview at `/overview/`** | A new `overview/` workspace on the kit's tokens, marks, header and connection. Four panels on real stores, each loading and failing on its own. Continue from the activity record. Worlds with drafts waiting and map covers. Examples from a small catalog, never installed by viewing. The Studio's read-only preview comes with it. | Useful even before the art: personal content is real, and examples are clearly labelled. |
| 4. **F2, the example content** | The writing room built in the Studio, Errata's schedule, art when it arrives, the catalog's final entries. | Runs beside 3 and 5; the art is the owner's. |
| 5. **W4, the library** | As planned. | Independent of the front page. |
| 6. **F4, the root** | Adventure to `/adventure/`, `/?launch=` forwarded, `/` becomes the Overview, Start here, and every link and serve check together. | Only once the Overview has proved itself at `/overview/`. |
| 7. **W5, W6, F5** | The workshop and Check, more fields, Home posts when Chat has them. | As planned. |

Each step is one pull request (F3 may be two: panels, then the preview). Each runs `npm test`, `npm run lint` and `npm run build`, plus the handoff's acceptance checks for what it touches.

## What stays as the handoff says

- The mockup is a fixture, never pasted in: no demo IDs, no study controls, no copied CSS or fonts.
- Arrival makes no model calls and creates no chats, saves or Lives.
- A failed read is not an empty library.
- No storage or key is renamed.
- Adventure keeps its play layout, with no header in play.
- The study's motion budget and reduced motion are followed as written.

## For the owner

1. **The order above:** F1 first, then W3, then the Overview. *Suggest:* yes. F1 is small and fixes a link that's broken today.
2. **Map covers** for personal worlds with no art. *Suggest:* yes; it's honest and already drawn.
3. **Drafts waiting** as the Worlds panel's Continue line. *Suggest:* yes. It reads only counts, never the drafts' text.
4. **Errata helps you build it** beside *Make a world*. *Suggest:* yes, one line, no second mascot panel.
5. **The writing room built in the Studio with Errata's help.** *Suggest:* yes, and use it as the first live prompt-test run.
