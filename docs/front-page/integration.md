# Front page: how it fits the work so far

Nov 12, 2026, revised Nov 13 · @AmbiProp · Claude's reading of the front-page handoff (`README.md`, `implementation.md`, `visual-and-motion.md`), checked against the code at Studio 0.14.0. **Approved by the owner on Nov 13**, with one change: the examples are built in a dedicated session, not with the site's helper (see *Content*). The first pass is built: see *Built so far*.

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

## Content: a dedicated session, not the site's helper

F2 needs Errata's writing room: a scenario with rooms, Errata's evening schedule, and her placement. Later it needs more characters and a world outside fantasy. **The owner's call (Nov 13): examples are written in a dedicated session on a strong model, to the house writing rules, never drafted by whatever model happens to be connected to the site.** They're the first thing a visitor reads, so they set the bar for everything else. They're delivered as files (a world file or module) and checked in the Studio like any world. The art (Errata's approved CharacterVault design, the room) stays an owner dependency. Neither blocks F1 or F3.

## Built so far (Nov 13): enough to show people

The owner wanted enough of the front page live to show a couple of friends. That's the first visit, which has to be right, and a returning visit that already works on real data.

- **F1, the part the Overview needs:**
  - `kit/src/activity.ts`: the versioned activity record (`inkwyrm.navigation.v1`), validated, bounded to twenty, one entry per place, written only when something really opens.
  - Chat reads `#/with/<world>/<record>`. This fixes the Studio's *Chat with*, which was a dead link.
  - The adventure opens `/?save=<id>`, and says so if the save is gone rather than starting a new game.
  - The Studio notes the record and door that opened, and opens a bundled world by address (`#/bring/bogwater`), bringing it in only if this browser lacks it.
- **The Overview 0.1.0 at `/overview/`:**
  - The first visit: the brand promise and a red **Meet Errata**.
  - A returning visit: *Pick up the thread.* and one Continue.
  - **Characters:** recent chats, then Errata as included. Cards are typographic until approved portraits exist.
  - **Worlds:** the author's own, with map covers and *drafts waiting*, then the two Abernys modules as included.
  - **Adventure:** the save last opened, or Bogwater's opening, quoted.
  - **Home:** a plain strip saying the example household is still being written. No room is advertised that doesn't exist.
  - Each store loads and fails on its own. The page makes no model calls and writes nothing, not even the theme.
  - Paper and Night, the handoff's motion budget, and reduced motion.
- **Served** like the Studio and Chat, checked in CI's production run. The root is still the adventure.

**To show friends:** send them `<site>/overview/` once it's deployed. The first visit needs no key: Errata's sheet, the two worlds and Bogwater's start screen all open without one. Talking to Errata or playing needs their own model.

**Not yet:** the read-only *Look inside* (it opens a copy for now, and says so), Start here, pins and dismissals, Home in the Overview, and moving the root (F4).

## The order, with the worldbuilding phases

| Step | What | Why here |
| --- | --- | --- |
| 1. **F1** | Chat's `#/with/<world>/<record>` setup (fixing the Studio's dead link) and exact `#/home/...`; Adventure's `?save=<id>`; `kit/src/navigation.ts` (the versioned activity record, validated and bounded, plus shared address builders); activity hooks in all three sides, with Studio doors and kept drafts. | Small, fixes a live bug, and everything after it needs it. |
| 2. **W3, Try a scene** | As planned. | It's next in the approved worldbuilding order and doesn't touch the front page. |
| 3. **F3, the Overview at `/overview/`** | A new `overview/` workspace on the kit's tokens, marks, header and connection. Four panels on real stores, each loading and failing on its own. Continue from the activity record. Worlds with drafts waiting and map covers. Examples from a small catalog, never installed by viewing. The Studio's read-only preview comes with it. | Useful even before the art: personal content is real, and examples are clearly labelled. |
| 4. **F2, the example content** | Written in a dedicated session on a strong model: Errata's writing room and schedule, then more characters and a non-fantasy world, delivered as files and checked in the Studio. Art when it arrives. | Runs beside 3 and 5; the art is the owner's. |
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
5. **The writing room built in the Studio with Errata's help.** *Answer (Nov 13):* no. Examples get a dedicated session on a strong model; the site's helper is for authors.

## Homes on the Overview (Nov 16, Overview 0.3.0)

@AmbiProp

The note about Home at the foot of the page is now a panel, beside Characters.

- **What it shows:** up to two homes. The one last visited comes first, then this browser's others, then the ones that come with the site. Each says who is in, which room, and what they are doing now, read from each character's own clock (Chat's lives) and schedule. Nothing is generated.
- **A first visit** sees the resort's house before Chat has put it in this browser, and its link opens it in Chat. A home that is not here is offered from Chat's own list, where it is brought in.
- **Continue** can be a home: Chat notes one when it really opens (`kit/src/activity.ts`, kind `home`).
- **Worlds no longer lists a household.** The dragon's resort and HOG Wild were shown there as worlds to look inside, and the Studio then offered each as an adventure. A world now says what it is for; a household is a home and nothing else. With no world of their own, the panel says what a world is and offers Make a world. No world comes with the site as an example until there is one meant to be played.
