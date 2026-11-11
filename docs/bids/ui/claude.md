# The look and layout: Claude's own proposal

Nov 11, 2026 · @AmbiProp · Written from the brief, before any bid was read. Not revised afterwards (`docs/bids/README.md`).

Claude has what a bidder doesn't: the code of all three sides, and why each screen ended up the way it did. This proposal leans on that for structure and leaves the finer points of the look to the bids.

## The recommendation in five lines

1. **A record's page splits by job into tabs:** Write, Day, Rules, Adventure, Chat. A kind shows only the tabs it has. Sections fold to one line each until opened. A character's page drops from 4,800 px on a phone to one screen per tab.
2. **The Studio keeps three panes on a wide screen, and the right pane gets tabs:** In context now, Checks, and later the helper. These are the things an author wants beside the page.
3. **A world header holds the trail and the Find:** the world's name, where you are (*Abernys › Fenmire › Bogwater*), and one Find that opens the search sheet the pickers already use, with `/` as its key.
4. **The adventure takes the Wet Ink tokens and fonts and keeps its layout** exactly as it is: one scroll, no header in play, the menu under the prompt.
5. **One header for the site,** shared by the Studio, Chat and the adventure's start screen: the drop, ink*wyrm*, the side you're on, the other two sides, and whether a model is connected.

## The Studio

### The frame

| Width | Left | Middle | Right |
| --- | --- | --- | --- |
| 1100 px and up | The list, its own scroll | The page | Tabs: **Context**, **Checks** (later **Helper**) |
| 700 to 1099 | A drawer, opened by the world's name | The page | A sheet, opened from the header |
| Under 700 | One pane at a time, switched by a bar along the bottom: **World** (the list), **Page**, **Context**, **Checks** | | |

The bar at the bottom is only for the Studio. A thumb reaches it, and it keeps the place you were on each pane: switch to Context and back, and the page hasn't scrolled.

### The world header

```
[drop] Low Tide › Places › Abernys › Fenmire › Bogwater        [Find /]
```

- The trail is where the open record sits. Each name in it opens that record.
- **Find** opens the search sheet in go-to mode: records lately opened first, then everything by kind. It also searches the world's parts (Rules, Checks, Map), so "calendar" finds World › Rules › Calendar.
- On a phone the trail shortens to its last two names.

### The list

- At the top, **Lately**: the last five records opened.
- Then each kind, folded or open, with its count (0.7.0 has this).
- Places as a tree in which **every place folds**, not only the kind. A world of 800 places is readable only if Fenmire can be closed. Folds are remembered per world.
- A record can be **pinned** to the top of the list: the five you're working on this week.
- Rows show a mark for Checks findings, so a broken record is seen from the list.

### A record's page

Above the tabs, always: the name, the kind, the one-line description, and **Names and keys** folded.

```
Morwen                                   Character
The witch
▸ Names and keys

[ Write ] [ Day ] [ Rules ] [ Adventure ] [ Chat ]
──────────────────────────────────────────────────
Sections                                   + Add
  Appearance    Here    Lean and dun, fingers st…   ▸
  Personality   Here    Sells first and asks not…   ▸
  Speech        Here    Doses and prices, in tha…   ▸
  Background    Named   The fen's witch, who sel…   ▸
Sets                                       + Add
  (none)
Notes · never sent                               ▸
```

| Tab | What's on it | Kinds |
| --- | --- | --- |
| **Write** | Sections (folded rows; tap to open and edit; drag handle to reorder), sets, pronouns and gender, groups, notes | All |
| **Day** | The week view, and for each event where it is and what it waits on (today split between the Schedule and In the adventure) | Characters |
| **Rules** | The Rules panel, open, with **Only what's set here** as a filter | Characters, personas, places, items, groups |
| **Adventure** | Where someone lives, where a thing lies, routes, milestones, where play starts | Characters, items, places, threads, scenarios |
| **Chat** | Greetings, example chats, Home's needs and actions | Characters |

- A new record opens on **Write**. After that, the page opens on the tab you last used for that kind.
- The jump bar goes away; tabs do its job.
- In context now reads every tab, whichever is showing. Tabs are for the author's eyes, not the model's.
- A tab's label carries its count where it helps: *Write 4*, *Day 3 stops*, *Rules 4 set*.

### World pages

The world's own page gets the same tabs: **About** (premise, genre, tone, shared conditions), **Rules**, **Map** (when maps come), **Checks**, **Files** (export, import, play in the adventure).

World › Rules is long because the ruleset is long. On a wide screen it gets an index down the left (Approaches, States, Tiers, Dice, Deeds, Growth, Trade, Calendar, Scene actions, Goods), each with its count of changes. On a phone, Rules is a list of those parts; each opens on its own. **Only what's changed** is a filter on every part.

## The adventure in Wet Ink

The layout stays. What changes:

- **Paper and Night,** following the device, with a switch in Settings. Night is the adventure's look today, warmed to the Wet Ink night.
- **The story** in Literata at 18 px (17 px on a phone), narration in italic grey ink, speech in plain ink. The player's own turns in blue-black, the way Chat marks the player.
- **The prompt** on a raised sheet, with the send button the only seal-red thing on the screen. Offered actions as quiet outlined chips, the check button with the die-drop.
- **The menu's five sections** headed in Fraunces, each with its one-line summary (*The long fence · early morning · 2 here*) as it has now.
- **A check** as a card in the prompt's place: the dice drawn in ink, success and failure in words first, colour second. No red for failure; red stays the action colour.
- **No header in play.** The site header shows on the start screen only. The bottom of the menu ends with the drop and three links (Home, Studio, Chat), so the rest of the site is one scroll away without breaking the owner's rule.

## One site

- **One header** (`kit/`), already nearly there in Chat: the drop and ink*wyrm*, the side's name, links to the other two sides, and a dot for the model connection that opens the shared connection settings. All three sides already read the same stored key.
- **Links between sides, both ways:**
  - Studio character → **Chat with**; Studio world or scenario → **Play**.
  - Chat → **Edit in the Studio** on a character from a world.
  - Adventure record page → **Open in the Studio**, when the world came from there.
- **The same theme switch** everywhere, stored once.

## Shared pieces

1. **Site header.**
2. **Sheet:** the picker's sheet, generalised (title, search, rows, Done); used for Find, pickers, and on a phone for Context and Checks.
3. **Tabs:** with counts, keyboard arrows, remembered per kind.
4. **List row:** name, a small second line, a trailing mark; used by the Studio list, Chat's lists and the adventure's saved games.
5. **Fold row:** a one-line summary that opens to an editor; used for sections, sets, scene actions, states.
6. **Field and chip:** as `kit/` has them, with the reach chips.

## Phases

| Phase | What | Why first |
| --- | --- | --- |
| U1 | Record page tabs and folded sections. | The biggest drop in length, all in one file's worth of layout. |
| U2 | The frame: right-pane tabs (Context, Checks), the world header with the trail and Find, the drawer at medium width, the bottom bar on phones. | Moving around a big world. |
| U3 | The list: Lately, pins, folding places, finding marks. | Hundreds of records. |
| U4 | World pages in tabs; World › Rules with its index and *only what's changed*. | The longest page left. |
| U5 | The shared header across the three sides, and links between them. | One site. |
| U6 | The adventure in Wet Ink. | Its own pull request: the play screen has the most tests and the most players. |

## Risks and questions

1. **Tabs hide things.** An author may forget a Chat tab exists. Each tab shows a count, and a new character's Chat tab says what a greeting is for. Is a single long page still wanted as an option, for printing or reading a record whole?
2. **The bottom bar in the Studio** is a second navigation pattern on phones. It's only in the Studio, where the panes are many; the adventure keeps none.
3. **Night by default for the adventure?** Following the device is proposed. Long reading at night on paper-coloured screens may be wrong for some players.
4. **Font weight on phones.** Literata and Atkinson Next are web fonts, about 150 KB together. The adventure loads its fonts now; Chat and the Studio do too. Worth checking on a slow phone before U6.
