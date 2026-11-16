# Studio

Inkwyrm's Studio, at `/studio/` on the site: make worlds and characters in the record model (`docs/records.md`), and see exactly what each part sends the model.

## What it does (0.14.1)

- **Worlds** in this browser's storage, with a premise, genre, tone and shared conditions.
- **Records of every kind:** characters, places, groups, items, lore, threads, scenarios and personas.
  - Places nest inside places.
  - A group can be a species, family, faction, crew or profession, and anyone can belong to several.
- **Sections, each with a reach:** Always, Here, Named (by its own keys, or the record's), When (a shared condition) or Never. New records start from a template the author can change.
- **Sets:** one entry in use at a time, such as outfits or a scenario's locations. An entry can be locked behind a condition, so a player can pick it only once it holds.
- **Schedules** (0.2.0), for characters: CharacterRoom's week view. A strip for each day and one for Daily, with every event drawn where it falls; pick a day to add events from the times of day (morning, afternoon, evening, night) and edit their words, hours, day, who gets told, and which outfit and which room of a scenario go with them.
- **Greetings and example chats** for characters, for chat only.
- **Rules on every record** (0.3.0). Everything made here can be played by the rules the moment it exists, with nothing authored:
  - **Rules** on every character, place, item, group and persona, behind the Rules door of its page, whose row says them in one plain line. It lists what a player can do there, by approach, with how hard it is; how each state reads to the narrator right now, and whether that sentence would be sent; and where every value came from: the standard, this world, a tier, a group, or set here. Change a value where it stands, and **Put back** returns it.
  - **Only what is changed is stored.** A record's rules are worked out from its kind, its tier, its groups and the world's ruleset. A group gives its members defaults (a species' most Health, a crew's tier), which sit above the tier and below what a member's own page sets.
  - **World › Rules:** the ruleset in plain words, with every part open to change and marked standard or this world's. The approaches and what going wrong costs; every state with its bands, the words for the player and for anyone else, what moves it and where it ends; the tiers; the dice, setbacks and rest; deeds; growth; trade and making; and the names and worth of the standard goods. A change that would leave a rule pointing at nothing is refused, with the reason. Standing and Resources for groups are one tap to add.
  - **An item is a good:** what it is worth and what it does (a weapon, armour, a help, something used up). People can sell and carry the standard goods and the world's items.
- **The launchpad** (0.4.0):
  - **Play in the adventure**, on a world's page, hands the world to the adventure as a module, in this browser, and opens it there. The adventure's start screen keeps a list of the worlds sent to it. The adventure gets a copy; play never changes the world.
  - **Export as a module** saves the same module as a file. The page says first what will not go with it (threads, a second scenario) and what the adventure will fill in (a plain traveller when there is no persona, the first place when nothing says where play starts).
  - **Chat with**, on a character's page, opens Chat. The link is `/chat/#/with/<world id>/<record id>`; Chat opens its home on it until the Chat session reads that address.
- **Adventure modules open as worlds** (0.4.0): **Open a world or module file**, (the one-tap Abernys buttons were taken out in 0.14.5, when Abernys was retired). Dossiers become lines and sections, species and factions become groups, tiers and difficulties become rules, and the module's ruleset becomes the world's own. A person's page says what came with them that has no editor yet: where they live and work, how many stops their day has. Those go back out unchanged.
- **What the adventure needs** (0.5.0):
  - **In the adventure**, a door on a thing, a place, a thread and a scenario; a person's part is their **Day** door: where they live, the week, and for each event of their schedule, the place they are and the condition it waits on (a weekday, a day of the month, a span of days, a state). A thing: where it lies or who carries it. A scenario: where and when play starts and who is there. A place: what crossing to or from it asks of a traveller (0.10.0; routes before that), coming and going or only coming in.
  - **One schedule model.** The week view's events are also the adventure's day. An event with a place puts the person there; a condition that holds makes a day that replaces the ordinary one. A module's day plans come in as events and go back out as the same plans.
  - **On World › Rules:** the calendar (week, months, the times of day the narrator hears), scene actions (where offered, who must be there, what must hold, opening days and hours, what changes, the player's line and what the narrator shows), and a world's own goods.
  - **Checks**, beside Rules: every stop is a real place; no place holds more than four people at the four times of day over forty days; every When has its condition; every route ends somewhere; nothing a rule points at is gone. Each finding opens the record it is about.
- **Threads that reach the adventure** (0.6.0). A thread's page has its kind (Character Engine's nine, or Custom) and its milestones under **In the adventure**: the beat as the narrator hears it, what it turns on, the states it waits on, its first and last day, and the experience it pays. The five questions stay sections, for the author. A thread with no milestones goes to the adventure with its Next beat as the one milestone, for the player to mark. Checks finds a milestone that waits on a state that is gone, or turns on something that is.
- **Big worlds** (0.7.0):
  - **One picker** for every choice of a record (where someone lives, who carries a thing, a place's parent, a group, a milestone's target, who must be there). It opens a sheet with a search box, the records picked lately in this world, then every record by kind, A to Z; a place shows what it's inside. Lists of records (groups, who is there, where an action is offered, In context now's scene) are chips with Add.
  - **The list** has Find and A to Z or as added, remembered per world in this browser. On a wide screen it scrolls on its own. (0.8.0 changed how it is walked; see below.)
- **The look and layout** (0.8.0), decided from three bids and Claude's own (`docs/bids/ui/decision.md`):
  - **The list goes one level at a time.** The world's own page has Find, the records opened lately, each kind with its count, and About, Rules, Checks and In context now with their state in words. A kind lists its records, each with its line. A place's name opens its page and *3 inside* goes into it; a trail leads back out, and Add puts the new place there.
  - **Find** crosses every kind: the name first, then a key, then the words of the line, then the place something is in. A result says what matched.
  - **A record's page is the writing.** The name, one line of who it is, and **Names and keys** folded (open on a new record). Then the doors, one row each with a sentence of what is set: **Day** (a character's home, week and stops), **Rules**, **In the adventure**, **Chat** (greetings and examples) and **In context now**. Then sections and sets, each folded to its title, reach and first words until opened, with Move up and Move down as buttons.
  - **The frame.** A phone shows one thing at a time: the list, a page, a door. From 900 px the list sits beside the page. From 1200 px a door sits beside both, and it is In context now until another is opened. In context now keeps who is here and what was said while you are away from it.
  - **Every page has an address** (`src/route.ts`: `#/w/<world>?kind=…&rec=…&door=…`), so the browser's Back goes back and Chat can link to one record. Going further in starts at the top; coming back returns to where you were.
  - **World › Rules is a list of its ten parts,** each reading standard or how many it has changed. A part opens alone, and **Only what's changed** narrows the list and each part.
  - **One header for the site** (`kit/src/SiteHeader.tsx`) and a **Settings** sheet behind its gear: the look, and the model key the other two sides use.
  - A record a Checks finding is about carries a quiet *to check* in the list.
- **The map** (0.9.0, phase M1 of `docs/bids/maps/decision.md`), on the world's page beside Rules and Checks, and from inside any place in the list:
  - **No setup.** Every place that holds others has a sheet: what is directly inside it, as blobs on a disc of hexes, sized by what each holds and laid out the same way every time (`core/map/`). Nothing generated is stored.
  - **Circles** draw every sheet at once, nested at the hexes' centres, so the map pinches from the whole world down to a room. They keep Character Engine's rules: names for the place in focus, what is in it, the places above it (dimmed) and the land's top places; rooms only once you look inside their building; a building at rest drawn as its icon; names placed largest first and dropped, never drawn over each other. One line icon per kind, about 1.4 KB for the set.
  - **Ground** shows one place's hexes. Areas are islands on land nobody stops on; a building's rooms share walls, with one cell for being inside but in no room; anywhere else the spare ground is the place itself. Its address is `page=map&sheet=<place>`.
  - **Times.** Pick a place to see how long it takes from the place you measure from, leg by leg: out of each place, across the map where both sit side by side (cells times what a cell is worth), and in again. A list gives every place, nearest first.
  - **Refining the ground** (0.11.0, phase M3). Choose a tool first, so a pan never paints: **Move** drags a place and its cells grow back around it; **Paint** gives cells to a chosen place or back to the ground, one cell, seven, or **Fill** for a whole patch; **Road** lays road cells, and starting on one takes it up. A picked place on the ground has **Bigger** and **Smaller**. The sheet has what one cell is worth (with Put back), **Keep this layout**, **Reroll**, **Reset this sheet** and **Add a place here**. The first change keeps every centre on that sheet, so a later place finds a gap and moves nobody. Only what changed is kept, on the world's `map` (`core/map/edit.ts`). Checks finds map data for a place that is gone or no longer inside that sheet's place.
  - **Icons and colour** (0.12.0, phase M4). A world picks icons to suit its genre: **Old**, **Modern** or **Far** (on the map's top row); every place shows its kind's icon from that set, and a picked place can choose any other in the card. The library is one line drawing per icon, a few kilobytes for all three sets (`kit/src/map-icons.ts`). **Colour** paints cells in six tints, one cell, seven or Fill; it is a look and never a rule. Long names on the circles wrap between words, never inside one.
- **Travel by level** (0.9.0), a part of World › Rules: a typical trip across a land, a region, open country, a settlement or a site, and a building, with what stepping inside one of its places costs, each in minutes, hours or days; and how much quicker a road is. Only the numbers a world changes are stored (`core/rules/levels.ts`).
- **Routes retired** (0.10.0, phase M2): the adventure travels by the levels and the map, so a place's In the adventure door says only what crossing to or from it asks, and walking pace has left World › Rules. Checks finds a crossing rule that waits on a state that is gone. A module's routes are dropped when it opens.
- **Drafts** (0.13.0, phase W1 of `docs/bids/worldbuilding/decision.md`). The model writes drafts; the author keeps them. Nothing a model writes changes a record until **Keep**.
  - **Draft** under the line and under every section, with what it costs before it's tapped (*About 640 tokens · 1 call, 2 if the first is sent back*). It writes that one field from the record and the world, in the field's shape: one sentence for the line, two to four for a Here section, one or two for Always.
  - **The draft waits under its field** in blue-black, editable in place, with **Keep** and **Drop**. **Draft again** puts up to three side by side. Keep checks first that the field hasn't changed since the draft was made, and shows both if it has. **Undo** puts the old text back. A folded section reads *Draft waiting*.
  - **A wrong answer goes back once with the fix:** two sentences in a line, too long a section, a reply cut off. A second failure comes back *Unfinished*, to edit before keeping. Decoration (a preface, the title, Markdown, quotes) is ignored, and a connection fault is never resent.
  - **The model can ask** instead of inventing: a question under the field, with a box for the answer and **Draft with this**.
  - **Never sections are Kept back.** A draft of a part the narrator reads sees the record's own Never sections and is told to show them only as something a person could notice. Another record's Never sections and every Notes field are never sent.
  - **Name ideas** on a new record: six names, offered first, checked against every name and key in the world; one already used shows as *taken*.
  - **What this sent** under every draft: each part with its tokens, what was left out to fit, the Never sections by title, and the messages themselves. The window is what the provider lists for the model, or 8,000 tokens.
  - A few overused words are underlined for a second look; they never block anything.
  - **Settings** holds one connection for the Studio, the same key Chat and the adventure use. Drafts are kept in this browser in their own store (`inkwyrm-author`), never in the world file.
  - **Live prompt tests** (`studio/live/`, `npm run prompts:live`): four checks on a real model with your own key, five runs each by default, stopping as soon as a check can't pass and never past 60 calls. The last result on the same model is printed beside the new one.
- **Errata** (0.14.0, phase W2). A door on every record's page, after In context now, whose row says what's waiting (*2 drafts waiting · 3 settled*).
  - **Rounds to pick from.** *Ask me something* puts up the next questions from the list (one at a time on a small model, up to three on a large one): the ones switched on, not yet asked, whose field is still empty. Errata offers three or four answers to each, with a few words on what each means. Tap any, add your own words, then **Take these**; **Other answers** asks again without repeating what you passed over; **Skip these** moves on. Picks are written into Settled by the Studio, in the question's words and the answer's, never by the model.
  - **Settled:** what's decided, one line each, to edit, remove or add to by hand. It's what every Write reads first.
  - **The talk:** say anything; Errata answers briefly and offers the facts you settled as **+ Settle** lines, taken only with a tap. Any turn can be removed.
  - **Write:** pick a field (empty ones first) and **Write it**, or **Write all empty**, which says how many calls and about how many tokens first and then writes them one after another. Writes read Settled, and the recent talk when the model has room for it; Errata is never in them. Drafts land under their fields, and on a phone in the door too.
  - The default questions are the plan's: six for a character, five for a place, the thread's five and its next beat, and a few for every other kind. W4 makes them the author's own.
  - **Settings › The Studio's helper:** a model for drafts and Errata apart from play's (same provider and key), and **Plain voice**, which takes Errata's manner away and leaves the same helper.
  - **Talks with Errata** on the world's About page: **Export talks** saves the world's talks and waiting drafts as `<world>.talks.json`, and **Open a talks file** brings them back beside the same world, keeping anything already there. The world's own file never carries them.
- **Homes** (0.15.0). A home is a scenario with rooms, and Chat's Home lists it.
  - **New household** on the Studio's first page makes a world for Chat with its house in it, and opens on the house.
  - **The Home door** on every scenario: the rooms (a name, what is there, who may go in), who lives there and where each of them is when nothing is on, someone new added on the spot, **Shown in Chat's Home**, and **Open in Home**. Pictures and where figures stand are arranged in Chat.
  - **What this world is for**, on a world's About page: a world, played as an adventure, or a household, for Chat. A household has no Play in the adventure and no adventure door on its scenario; it has Open in Home.
- **For the Overview** (0.14.1): a record that really opens is noted, with its door, for the front page's Continue (`kit/src/activity.ts`), and `#/bring/<example>` opens that bundled world, bringing it in only if this browser doesn't have it yet.
- **The marks** (0.7.1): the Studio's nib in the header and on the home page, in wet ink, black by day and bone at night (`kit/src/Mark.tsx`). It drops in when the Studio opens; page titles are written on and a new page settles in from a slight blur, all off with reduced motion. The tab shows the flat nib.
- **Genre:** the purse's words are the Coin state's bands and the catalog's names are editable, so a modern world's hundred *could buy a car*.
- **In context now:** put people and a place in the scene, type what was just said, tick what holds, and see what the world would send, with a rough token count. From 0.3.0 it shows the sentence of every state that is off its resting band, under the record it belongs to, as the narrator would read it.
- **Files:** a world exports as `<name>.world.json` (`studio-world/1`) and opens again. Cards import into the open world (0.1.1):
  - a CharacterRoom contact card as a character: persona and appearance become Here sections, brains become sections, conditional brains become Named or When sections behind CharacterRoom's bond tiers, the species becomes a group, and the schedule is kept;
  - a CharacterRoom user card as a persona, and a scenario card as a scenario;
  - a Character Card V1, V2 or V3, as JSON or PNG: description and personality as Here sections, the scenario as a Scenario, greetings and example chats, the lorebook as Named sections, and the card's own system prompt kept as a Never section.

  Pictures on a card are kept by Chat, which is where portraits live; import there to bring them.

## Phases (`docs/studio-brief.md`)

| Phase | What | State |
| --- | --- | --- |
| S1 | Rules on every record: `core/rules/`, World › Rules, the Rules panel, state sentences in In context now. | Built, 0.3.0. |
| S2 | Bogwater and Port Covenant into the Studio and back out as modules (`core/convert/`); Play in the adventure; Chat with. | Built, 0.4.0. |
| S3 | Routes, scene actions, the calendar and world states, goods, one schedule model with Chat, and Checks. | Built, 0.5.0; threads with milestones in 0.6.0. |
| M1 | Maps: `core/map/` (sheets, circles, journeys), the map in `kit/`, the Map page, and travel by level on World › Rules (`docs/bids/maps/decision.md`). | Built, 0.9.0. |
| M2 | Routes retire: crossing rules on places, the adventure travelling by levels and the map. | Built, 0.10.0 (adventure 0.27.0). |
| M3 | Refining the ground: move, bigger and smaller, paint, roads, what a cell is worth, keep, reroll, reset, add a place; stale map data on Checks. | Built, 0.11.0. |
| M4 | Icon sets by genre and icons by choice, colour paint, names that wrap on circles. | Built, 0.12.0 (adventure 0.27.1). |
| W1 | Drafts: the Draft button on the line and every section, names first, the draft card, one resend with the fix, Never sections kept back, What this sent, live prompt tests (`docs/bids/worldbuilding/decision.md`). | Built, 0.13.0. |
| W2 | The Errata door: rounds to pick from, Settled, the talk, Write and Write all empty, the helper's own model, Plain voice, Export talks. | Built, 0.14.0. |

## Not yet

- An editor for relationships between two people (a module's come through unchanged).
- The rest of maps (`docs/bids/maps/decision.md`): a picture under a sheet (M5), then the later items listed there.
- Pins in the list, the whole place tree as a second order, and a hand-off to the adventure that doesn't go through the browser's small store (a world of several hundred records could outgrow it): `docs/bids/ui/decision.md`.
- Chat reading an event's condition: until it does, a day that waits on one shows in Chat as part of every day.
- A world checked by the adventure's own loader before it is played: Checks covers what the brief lists, and anything else the adventure refuses is said on its start screen.
- Where a place or a group starts its states reaching the adventure.
- On World › Rules: taking an approach away (the four can be renamed and re-costed, and a fifth added with its rating state), the fight and follow rules, craft's steps, and what a hop into a room costs.
- The rest of the helper (`docs/bids/worldbuilding/decision.md`): Try a scene (W3), the library of questions and templates (W4), the workshop and Check (W5), and drafts for keys, set entries, greetings and events (W6). Images.

The shared look, world storage and fields moved to `kit/` in 0.1.1, for Chat to use too.

## Develop

From the repository root:

```bash
npm install
npm run dev:studio
```

Open `http://localhost:5177/studio/`. The record model itself is in `core/records/` and the rules in `core/rules/`, with their tests in `core/tests/`.
