# The look and layout of Inkwyrm: brief for proposals

Nov 11, 2026 · @AmbiProp · A hand-off for any model asked to propose how Inkwyrm's screens should be laid out

Inkwyrm is a roleplay site with three sides on one core: **Adventure**, a text adventure played by rules; **Chat**, conversations with characters who remember you; and **Studio**, where authors make the worlds and characters both of the others use. Players bring their own model key. Everything is stored in the player's browser.

The sides were built one after another, and it shows. This page asks for a proposal that makes them one site, and makes the Studio hold up when a world has hundreds of records. Screenshots of every screen as it stands are in `screens/`, at 390 px (`-phone`) and 1280 px (`-wide`).

The repository is `Tulivu89/mercurial-muse` if the owner shares it with you, but nothing here needs it.

## What's being asked

1. **The Studio, for big worlds.** How an author moves around a world of 300 to 800 records, and how a record's page is laid out so the parts for different jobs don't run together.
2. **The adventure in the house look.** It still wears its first look (dark, its own fonts) and must come into the Wet Ink look below without losing the layout its players know.
3. **One site.** How a person moves between Adventure, Chat and Studio, and what's the same everywhere.

Rank them if you can't do all three well. The Studio matters most: the owner is about to build their own setting in it.

## Who uses it

- **The owner,** mostly from a phone, writing large settings. They don't use git or a terminal.
- **Writers** building worlds and characters, often long sessions, often on a laptop.
- **Players** reading long stories, mostly on phones.

## Hard constraints

- **Phone first.** Every screen must work at 390 px by touch: 44 px targets, no hover-only controls, no sideways page scroll. Wide screens get more columns, not a different app.
- **The house look, Wet Ink** (decided, not open):

  | Token | Paper (light) | Night (dark) |
  | --- | --- | --- |
  | Ground | `#F3EEE4` | `#16130F` |
  | Surface | `#FBF8F2` | `#201C16` |
  | Raised | `#FFFFFF` | `#2A251D` |
  | Text | `#1D1B17` | `#EDE5D6` |
  | Secondary text | `#5E574C` | `#A89E8D` |
  | Lines | `#D9D0C0` | `#3A342B` |
  | Seal (the one main action) | `#B23A26` on `#FFF8F0` | `#E46A4E` on `#1A100B` |
  | Blue-black (the player's own words, conditions) | `#2F4A6B` on `#F3F6FA` | `#8FB1D9` on `#0F1620` |

  Type: Fraunces for display, Literata for story and record text, Atkinson Hyperlegible Next for the interface. Radii 6 px for controls, 10 for cards, 4 for chips. No gradients, no glow. Narration in italic grey ink, speech plain. The mark is an ink drop; the wordmark is ink*wyrm*, *wyrm* in italic.
- **The adventure's layout is the owner's call and stays:** one scroll; the story, then the prompt at its end, then the menu under the prompt. No header bar and no menu button: the player scrolls past the prompt to reach the menu. The menu has five sections (Scene, You, Map, World, Settings), all closed, one open at a time. Restyle it; don't restructure it.
- **React 18, plain CSS with the tokens above, SVG for icons.** No new libraries unless you name one and say why it earns its size.
- **Accessible:** 4.5:1 contrast (the tokens pass), keyboard reachable, labels on every control.
- **Nothing on a server.** No accounts yet, no sync. Don't design around them.

## What the Studio is now

Three columns on a wide screen: the **record list** on the left, the **record's page** in the middle, and **In context now** on the right (set up a moment and see exactly what the world would send the model). On a phone they stack, and opening a record hides the list behind a Back button.

- **The list:** a world's name, then Rules and Checks, then every record by kind (Characters, Places, Groups, Items, Lore, Threads, Scenarios, Personas). Places nest. As of Studio 0.7.0 it has a Find box, A to Z or as-added order, and kinds that fold.
- **A record's page** (`screens/studio-character-*.png`): name, keys, a one-line description, pronouns and groups; then a **Rules** panel and an **In the adventure** panel, both folded; then **Sections** (each a titled block of text with a *reach*: Always, Here, Named, When or Never, saying when it reaches the model); **Sets** (one entry in use at a time, such as outfits); for a character, a **Schedule** week view and **Chat only** greetings and example chats; then **Notes** and Delete. A character's page is about 4,800 px tall on a phone. A jump bar at the top reaches each part (0.7.0).
- **Pickers:** every choice of a record opens a sheet with a search box, recent picks, then records by kind, A to Z, each place showing what it is inside (0.7.0, `screens/studio-picker-*.png`).
- **World › Rules:** the whole ruleset in plain words, every part open to change and marked standard or changed: approaches, states with their bands, tiers, dice, deeds, growth, trade, the calendar, scene actions and goods. It is long.
- **Checks:** findings, each opening the record it's about.

The parts of a record serve different jobs and different people: the **writing** (line, sections, sets) is for every author; the **rules** are for authors who want mechanics; **In the adventure** (where someone lives, routes, milestones) is for authors making something playable; **Chat only** (greetings, examples, schedule) is for character authors. Today they sit in one long column.

## What the adventure is now

`screens/adventure-*.png`. A dark screen with a book serif for the story. The start screen lists saved games, the worlds sent from the Studio, and the bundled test worlds. In play, the story fills the screen, the prompt sits under it with the actions on offer, and the menu is under that. A check (a dice roll) opens in the prompt's place. The journal, the rules guide and a record's page open as full pages with a Menu link back.

## What Chat is now

`screens/chat-home-*.png`. Already in Wet Ink, with a header: the mark, *Chat*, and links (Chats, Home, Settings, Studio, Adventure). The chat screen gives the transcript the whole screen, with bubbles or as a page, and a portrait that follows the character's mood.

## Questions a proposal must answer

1. **The Studio's frame:** columns, panels, or pages? What's always in view, and what's a tap away? Where does In context now live on a phone?
2. **Moving around a big world:** the list, search, recent records, the place tree, and getting back to where you were.
3. **A record's page:** how the writing, the rules, the adventure's parts and Chat's parts are separated (tabs, panes, folds, modes for kinds of author). What shows first for a new record?
4. **World › Rules at length:** how a long ruleset is navigated and how "changed from standard" stays visible.
5. **The adventure in Wet Ink:** paper and night, the story's type, the prompt, the menu, a check, at 390 and 1280, keeping its layout.
6. **One site:** what the three sides share (a header? the mark? settings for the model key, which all three use?), and how a person goes from a Studio character to chatting with them or playing their world.
7. **What you'd leave alone.**

## What to hand back

One document, plain words, in this order:

1. **The recommendation in five lines.**
2. **The Studio:** its frame, navigation and record page, with mockups at 390 and 1280.
3. **The adventure** in Wet Ink, with mockups at 390 and 1280, paper and night.
4. **One site:** what's shared, with a mockup of moving between sides.
5. **Components:** the handful of pieces the three sides would share (a header, a list row, a panel, a sheet, a field).
6. **Phases,** each shippable on its own, smallest first.
7. **Risks and open questions** for the owner.

Mockups can be HTML with inline CSS, SVG, or careful ASCII. Use the tokens above and real content from the screenshots, not lorem ipsum. Skip anything that only repeats this page.

## Where this goes

Into `docs/bids/ui/` as `<model>.md`. Claude wrote its own proposal (`claude.md`) before any bid was read, and will write `decision.md` from all of them (`docs/bids/README.md`).
