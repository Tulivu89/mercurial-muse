# Inkwyrm UI Proposal

---

### 1. The recommendation in five lines

1. **Keep the Studio as a 3-pane workbench on wide screens, but collapse it into a dedicated two-level drill-down on phone with "In context now" as a persistent bottom-docked badge sheet.**
2. **Handle 300–800 records by adding an index bar, a "Recent / Bookmarked" drawer, and scoping the place tree to direct children with breadcrumb lineage.**
3. **Restructure the record page into four clear task modes (Writing, Adventure, Chat, Rules) instead of a 4,800 px vertical run; default new records to Writing basics.**
4. **Reskin Adventure strictly in Wet Ink tokens without altering its strict scroll-down flow, leaving prompt, dice checks, and folded menus exactly where players expect them.**
5. **Unify all three sides through a shared client-side root header and a universal Model Key sheet, preserving browser-local isolation with zero server footprint.**

---

### 2. The Studio

#### Frame and layout strategy
* **Wide (1280 px):** Retain the 3-column layout:
  * Left (300 px): Record browser (Quick Filter, Recent, Kinds/Hierarchy).
  * Center (flex, min 580 px): Active Record editor with sticky task-mode bar.
  * Right (360 px): *In context now* (live compilation and token estimator).
* **Phone (390 px):** A focused single-view drill-down:
  * View 1: Record Browser with high-density quick search and recent taps.
  * View 2: Record Page with a fixed back navigation header (`← Records`).
  * *In context now* lives as a floating footer badge (`[ In context · 427 tok ⌃ ]`) that expands upward into an 85vh bottom sheet whenever touched. This keeps authoring distraction-free while giving one-tap verification at touch-height.

#### Moving around 300 to 800 records
* **Instant Typeahead & Recents:** A sticky top filter input with a quick-access strip of the last 5 edited records (`[Morwen ×] [The long fence ×] [Nest ×]`).
* **Section Jump / Kind Grouping:** Rather than scrolling through 200 places, kinds show counts and collapsed states (`▶ Places (38)`, `▼ Characters (16)`).
* **Deep Place Nesting:** Places show hierarchical breadcrumbs (`Fenmire › The eel traps › The long fence`). Only top-level or currently scoped branch items expand by default to eliminate vertical list exhaustion.

#### The Record's Page & Author Task Modes
Rather than stacking 4,800 px of controls, a record's body uses 4 dedicated **Aspect Modes** styled as segmented pills:
1. **Writing (Default):** Identity (Name, Keys, One-line summary, Belongs to/Pronouns), Sections (Reach, Text), and Sets. (What 90% of authors need 90% of the time).
2. **Adventure:** Map placement, route anchors, schedules, encounter triggers.
3. **Chat:** First greetings, mood portraits, example dialogue, chat style.
4. **Rules:** Stat blocks, Approaches, Deeds, Conditions, and dice modifiers.

*When creating a new record:* Only the **Writing** mode is active, focused directly on Name and One-line summary. Rules and Chat flags remain dormant until deliberately toggled or populated.

#### World › Rules at Length
* Sticky sub-navigation bar listing rule categories: *Approaches · States · Dice · Deeds · Growth · Calendar*.
* Each rule row shows a distinct badge: `Standard` (muted `#5E574C`) or `Changed` (highlighted `#B23A26`).
* A persistent filter toggle: `[ Show all (42) ] [ Show changed only (12) ]`.

---

#### Studio Mockup: Phone (390 px) — Record Editor (Writing Mode)

```
+---------------------------------------+
| [=] ink*wyrm*  Studio          (Night)|
+---------------------------------------+
| < Abernys: Bogwater       [Chat] [Play] |
|                                       |
| Morwen                                |
| Character                             |
|                                       |
| [ Writing ]  Adventure   Chat   Rules |
|---------------------------------------|
| NAME                                  |
| [ Morwen                            ] |
|                                       |
| KEYS (comma separated)                |
| [ witch, bog-woman, hermit          ] |
|                                       |
| LINE (one-sentence stranger view)     |
| [ The witch                         ] |
|                                       |
| PRONOUNS              GENDER          |
| [ she/her           ] [ female      ] |
|                                       |
| BELONGS TO                            |
| [ Harefolk   (x) ]  [+ Change ]       |
|                                       |
| SECTIONS (2)                 [+ Add]  |
| +-----------------------------------+ |
| | Appearance              [Here  v] | |
| | While this is in the scene.       | |
| | [ Lean and dun, fingers stained ] | |
| | [ brown to the second knuckle,  ] | |
| | [ and smells of bog myrtle.     ] | |
| +-----------------------------------+ |
| | Personality             [Here  v] | |
| | While this is in the scene.       | |
| | [ Seldom speaks first...        ] | |
| +-----------------------------------+ |
|                                       |
| [ Notes & Flags v ]                   |
|                                       |
| - - - - - - - - - - - - - - - - - - - |
| [^ In context now · 427 tokens     ]  | <- Sticky tap-to-expand sheet pill
+---------------------------------------+
```

---

#### Studio Mockup: Wide Screen (1280 px)

```
+--------------------------------------------------------------------------------------------------------------------+
| (o) ink*wyrm*  Studio                  [ Abernys: Bogwater v ]        [ Model: NovelAI v ]     [ Chat ] [ Adventure ] |
+--------------------------------------------------------------------------------------------------------------------+
| RECORDS (87)            | MORWEN (Character)                          [Chat with Morwen] | IN CONTEXT NOW          |
| [ Find 87 records...  ] |----------------------------------------------------------------| Set up a scene to check |
| Recents: Morwen, Nest   | [ Writing ]   Adventure (3)   Chat (1)   Rules (4)             | model payload context.  |
|-------------------------|----------------------------------------------------------------|-------------------------|
| v CHARACTERS (16) [+Add]| NAME                                  PRONOUNS       GENDER    | HERE IN THE SCENE       |
|   Bastien Orlo          | [ Morwen                            ] [ she/her    ] [ female] | [ Morwen      x ]       |
|   Bronwen               |                                                                | [ Morwen's door x ]     |
|   Cadfan                | KEYS                                  BELONGS TO               | [+ Add character/place] |
|   Corran                | [ witch, bog-woman, hermit          ] [ Harefolk x ] [Change]  |-------------------------|
|   Edric                 |                                                                | WHAT WAS JUST SAID      |
|   Ellis                 | LINE                                                           | [ "That's no eel.     ] |
| > Ellis's cousins       | [ The witch                                                  ] | [ It's in our net."   ] |
|   Gethin                |                                                                |-------------------------|
| > Morwen        <<<<<<  | SECTIONS (2)                                           [+ Add] | TOKEN ESTIMATE: 427 tok |
|   Nest                  | +------------------------------------------------------------+ | [ Copy assembled prompt]|
|                         | | Appearance                                  [ Here       v]| |-------------------------|
| v PLACES (38)   [+Add]  | | While this is in the scene.                                | | Abernys: Bogwater     |
|   v Fenmire             | | [ Lean and dun, fingers stained brown to the second      ] | | [Always] Premise text |
|       The eel traps     | | [ knuckle, and she smells of peat smoke and bog myrtle.  ] | |                       |
|       The long fence    | +------------------------------------------------------------+ | In the net... [Always]  |
|     > Morwen's island   | | Personality                                 [ Here       v]| | Situation text...     |
|         Morwen's door   | | [ Seldom speaks first; regards strangers with quiet...   ] | |                       |
|         The workroom    | +------------------------------------------------------------+ | Morwen         [Here]   |
| > GROUPS (18)           |                                                                | Lean and dun, fingers.. |
+--------------------------------------------------------------------------------------------------------------------+
```

---

### 3. The Adventure in Wet Ink

The strict flow requested by the owner is maintained: **Story Narration & Speech → Action Prompt / Check Bar → Five Folded Menu Sections**.

#### Token Palette Mapping

| UI Element | Paper (Light) | Night (Dark) |
|---|---|---|
| Background | Ground `#F3EEE4` | Ground `#16130F` |
| Text / Narration | Secondary `#5E574C` (*italic serif Literata*) | Secondary `#A89E8D` (*italic serif Literata*) |
| Spoken dialogue | Text `#1D1B17` (*normal font weight*) | Text `#EDE5D6` (*normal font weight*) |
| Action Choices / Buttons | Surface `#FBF8F2` bordered `#D9D0C0` | Surface `#201C16` bordered `#3A342B` |
| Primary Action (Seal) | `#B23A26` on `#FFF8F0` | `#E46A4E` on `#1A100B` |
| Player input / State bands | Blue-black `#2F4A6B` on `#F3F6FA` | Blue-black `#8FB1D9` on `#0F1620` |

---

#### Adventure Mockup: Phone (390 px) — Night Palette

```
+---------------------------------------+
|                                       |
| *The net comes up out of the black   |
| water all at once, and you come up    |
| with it. Eels slide over your arms   |
| and down your collar, cold and thick  |
| and still fighting...*                |
|                                       |
| Three salamanders crouch on the plank |
| walk. The one holding the lantern     |
| leans closer. "That's no eel."        |
|                                       |
| "It's in our net." *The one with the  |
| spear leans out and turns your wrist  |
| over with the butt of it.* "Colony."  |
|                                       |
|---------------------------------------|
| [ Work a night on fence ] [ Wait 10m] |
| [<> Make a check: Force v Finesse   ] |
|                                       |
| +---------------------------------+-+ |
| | Your turn: *action*, speech...  |^| |
| +---------------------------------+-+ |
|---------------------------------------|
| Scene                               v |
| The long fence * 05:00 early morn * 2 |
|---------------------------------------|
| You                                 ^ |
| bruised, strained                     |
|                                       |
| +-----------------------------------+ |
| | Ru  The runaway           [DRAFT] | |
| |     A human who walked off a      | |
| |     shipwright's indenture...     | |
| +-----------------------------------+ |
| CONDITION                             |
| Health   [======--]  bruised        > |
| Strain   [====----]  strained       > |
| Armour   [--------]  0              > |
|                                       |
|---------------------------------------|
| Map                                 v |
| 1 way out                             |
|---------------------------------------|
| World                               v |
| 78 records * the rules guide          |
|---------------------------------------|
| Settings                            v |
| NovelAI connected * Night look        |
+---------------------------------------+
```

---

#### Adventure Mockup: Wide Screen (1280 px) — Paper Palette

```
+--------------------------------------------------------------------------------------------------------------------+
|                                                                                                                    |
|                                     *The net comes up out of the black water all at once,                         |
|                                     and you come up with it. Eels slide over your arms and                         |
|                                     down your collar, cold and thick and still fighting...*                        |
|                                                                                                                    |
|                                     Three salamanders crouch on the plank walk along the top                       |
|                                     of the fence. The one holding the lantern leans closer.                        |
|                                     "That's no eel."                                                               |
|                                                                                                                    |
|                                     "It's in our net." The one with the spear leans out

```
|                                     and turns your wrist over with the butt of it, so the                          |
|                                     light falls on the ink. "Colony."                                              |
|                                                                                                                    |
|                                     Far back across the fen, toward the causeway, a horn                           |
|                                     blows twice. All three of them look that way. Then                             |
|                                     they look back at you.                                                         |
|                                                                                                                    |
|                   +-------------------------------------------------------------------------------+                |
|                   | [ Work a night on the long fence ]   [<> Make a check ]   [ Wait 10 min ]     |                |
|                   |                                                                               |                |
|                   | +-----------------------------------------------------------------------+---+ |                |
|                   | | Your turn: *action*, speech, (thought)                                | ^ | |                |
|                   | +-----------------------------------------------------------------------+---+ |                |
|                   +-------------------------------------------------------------------------------+                |
|                                                                                                                    |
|                   +-------------------------------------------------------------------------------+                |
|                   | Scene                                                                       v |                |
|                   | The long fence · 05:00 early morning · 2 here                                 |                |
|                   +-------------------------------------------------------------------------------+                |
|                   | You                                                                         ^ |                |
|                   | bruised, strained                                                             |                |
|                   |                                                                               |                |
|                   | [Ru] The runaway                                                      [DRAFT] |                |
|                   |      A human who walked off a shipwright's indenture in Port Covenant...      |                |
|                   |                                                                               |                |
|                   | CONDITION                                                  tap to set by hand |                |
|                   | Health       [■■■■■■■■□□]  bruised                                          > |                |
|                   | Strain       [■■■■■□□□□□]  strained                                         > |                |
|                   | Armour       [□□□□□□□□□□]  0                                                > |                |
|                   | A boat       [──────────]  has no boat                                      > |                |
|                   +-------------------------------------------------------------------------------+                |
|                   | Map                                                                         v |                |
|                   | 1 ways out                                                                    |                |
|                   +-------------------------------------------------------------------------------+                |
|                   | World                                                                       v |                |
|                   | 78 records · the rules guide                                                  |                |
|                   +-------------------------------------------------------------------------------+                |
|                   | Settings                                                                    v |                |
|                   | NovelAI connected · Paper look                                                |                |
|                   +-------------------------------------------------------------------------------+                |
+--------------------------------------------------------------------------------------------------------------------+
```

#### The Check State (Dice Roll Inline Replacement)

When a player taps `[<> Make a check]`, the prompt textarea is temporarily replaced in-place by the dice resolution card (no layout jumping or modal interruption):

```
+-------------------------------------------------------------------------------+
| CHECK: Force vs Fenmire Water                                                 |
| Approach: [ Force · Average (+1) v ]   Difficulty: [ Risky (2d6) v ]          |
|                                                                               |
| [  3  ] + [  5  ] + 1 = 9  ->  SUCCESS WITH A COST                            |
|                                                                               |
| Consequence: You wrench free of the cord, but take 1 Strain in the muck.      |
| [ Accept outcome (Seal Button) ]                     [ Cancel / Try another ] |
+-------------------------------------------------------------------------------+
```

---

### 4. One Site: What's Shared and Navigating Between Sides

#### What is Shared Everywhere
1. **The Brand Anchor:** The ink drop mark `(o)` and wordmark `ink*wyrm*` in Fraunces/Literata.
2. **The Local Model Key Vault:** A single `localStorage` store for API keys (NovelAI, OpenRouter, Anthropic, etc.). If entered in Adventure, it is already ready in Chat and Studio.
3. **The Theme Token Engine:** One stylesheet controlling Paper and Night modes via CSS variables on the root document.
4. **World & Character Payloads:** Worlds created or edited in Studio are immediately selectable from Adventure's "New game" list and Chat's character drawer without requiring export/import round-trips.

#### Moving Between Sides
* **Top-level Header:** Present in Studio, Chat, and the Adventure home/pause screen. (During active Adventure play, the header is strictly hidden to respect the owner's rule of a clean, uninterrupted reading scroll; the Settings accordion in the bottom menu provides the link back to Studio/Chat).
* **Contextual Jump Buttons:**
  * In **Studio (Character record):** A sticky header button `[Chat with Morwen]` immediately instantiates a Chat session with that character in their current draft state.
  * In **Studio (World overview):** A sticky header button `[Play Abernys]` launches an Adventure test run using the browser's current unexported data.
  * In **Chat / Adventure:** A link in character profiles or the World menu says `[Inspect in Studio]`, opening that exact record in the workbench.

#### Mockup: Universal Site Header & Navigation Sheet

```
Desktop Header (Studio & Chat):
+--------------------------------------------------------------------------------------------------------------------+
| (o) ink*wyrm*  Studio          [ Abernys: Bogwater v ]              [ Model: NovelAI (Ready) ]  [ Chat ] [Adventure]|
+--------------------------------------------------------------------------------------------------------------------+

Mobile Header (All modes except active story scroll):
+---------------------------------------+
| [=] ink*wyrm*  Studio         (Night) |
+---------------------------------------+

Tapping [=] opens the Site Drawer:
+---------------------------------------+
| (o) ink*wyrm*                         |
|---------------------------------------|
| CURRENT WORLD                         |
| Abernys: Bogwater                     |
|                                       |
| DESTINATIONS                          |
| * Studio (Editing: Morwen)            |
| * Chat (3 characters waiting)         |
| * Adventure (Resume: The runaway)     |
|                                       |
| MODEL & STORAGE                       |
| Key: NovelAI connected [Change]       |
| Storage: 1.4 MB used (Local only)     |
| Theme: [ Paper ] ( Night )            |
|                                       |
| [ Close menu ]                        |
+---------------------------------------+
```

---

### 5. Shared Components

All components use plain CSS custom properties mapped to the Wet Ink design tokens, Atkinson Hyperlegible Next for interface labels, 44 px touch targets, and SVG icons.

#### 1. Universal Top Header (`<SiteHeader />`)
* **Height:** 56 px.
* **Surface:** Token `Surface` (`#FBF8F2` Paper / `#201C16` Night) with a 1 px bottom border of Token `Lines` (`#D9D0C0` / `#3A342B`).
* **Content:** Flex container. Left: 24 px ink drop SVG mark + `ink*wyrm*` wordmark. Right: segmented buttons for `Studio`, `Chat`, and `Adventure`, plus the active Model indicator dot (green for connected, amber for unconfigured).

#### 2. Compact List Row (`<RecordRow />`)
* **Touch Target:** 48 px minimum height.
* **Layout:** Grid with left indent based on nesting level (0 px, 16 px, 32 px).
* **Typography:** Atkinson Hyperlegible Next, 15 px, Token `Text`. Subtitle/reach tags in 12 px Token `Secondary text`.
* **State:** Selected state uses Token `Surface` background with a 3 px left border in Seal `#B23A26`.

#### 3. Task Panel / Accordion (`<MenuPanel />`)
* **Used for:** Adventure's 5 menu sections (Scene, You, Map, World, Settings) and Studio rule/section groupings.
* **Header:** 48 px tap target, Fraunces serif 17 px heading, trailing chevron SVG rotating 180° when expanded. Only one panel open at a time in Adventure.
* **Border:** 1 px bottom border in Token `Lines`.

#### 4. Half-Height / Modal Sheet (`<DrawerSheet />`)
* **Phone:** Fixed bottom sheet (`bottom: 0; max-height: 85vh; border-radius: 10px 10px 0 0;`) with touch drag handle, background Token `Raised` (`#FFFFFF` / `#2A251D`), elevated by `box-shadow: 0 -4px 20px rgba(0,0,0,0.2)`.
* **Wide screen:** Centers as a clean dialog modal (max-width 540 px) with backdrop dimming.
* **Used for:** Quick record picker, "In context now" inspection on phone, and Model Key configuration.

#### 5. Accessible Form Field (`<InputField />`, `<TextAreaField />`)
* **Border radius:** 6 px.
* **Background:** Token `Raised` inside Token `Lines` 1 px border. On `:focus-visible`, 2 px outline in Blue-black (`#2F4A6B` / `#8FB1D9`).
* **Labels:** 13 px uppercase Atkinson Hyperlegible Next in Token `Secondary text`, placed above the field with `display: block` and explicit `htmlFor` association.

---

### 6. Implementation Phases

Each phase produces a complete, functional deploy without breaking existing data:

* **Phase 1: Adventure Reskin in Wet Ink (Lowest risk, immediate visual lift)**
  * Apply Wet Ink CSS variables (Paper & Night palettes) to Adventure story text, prompt, dice checks, and folded menus.
  * Switch story typography to Literata, headings to Fraunces, and interface elements to Atkinson Hyperlegible Next.
  * Do not alter the underlying DOM hierarchy or scrolling mechanics.

* **Phase 2: Universal Model Key Vault & Site Switcher**
  * Unify `localStorage` management of AI provider credentials.
  * Deploy the shared `<SiteHeader />` across Chat and Studio, and link it into Adventure's start screen and Settings drawer.
  * Add direct cross-launching (`Chat with this character`, `Test this world in Adventure`).

* **Phase 3: Studio Record Editor Modes (Writing, Adventure, Chat, Rules)**
  * Break the 4,800 px character page into the 4 tabbed aspect modes.
  * Convert "In context now" into a bottom-docked badge sheet on screens under 768 px.
  * Ensure new records initialize directly in Writing mode with dormant secondary panels.

* **Phase 4: High-Capacity World Navigation (300–800 records)**
  * Implement the quick-filter typeahead with debounce.
  * Implement recent record tracking (stored in browser session).
  * Scope nested places to top-level nodes with click-to-descend breadcrumbs.
  * Add the category jump bar and "Changed only" toggle to `World › Rules`.

---

### 7. Risks and Open Questions

1. **Large LocalStorage Footprint (300–800 Records):**
   * *Risk:* When worlds grow past 500 records with multiple prose sections and example chats, total JSON size can exceed standard `localStorage` quotas (typically 5 MB).
   * *Question for Owner:* Should we seamlessly migrate browser storage from `localStorage` to `IndexedDB` (using an ultra-lightweight wrapper or native browser APIs) to ensure zero data loss with zero server requirement?

2. **Mobile Keyboard Intrusion in Adventure:**
   * *Risk:* On mobile Safari/Chrome, tapping the turn input at the bottom of the adventure scroll pushes the viewport up and can obscure the active prompt options.
   * *Question for Owner:* Would you prefer the action prompt pills to remain in the normal document scroll above the textarea, or snap into a sticky accessory bar above the virtual keyboard while typing?

3. **In-Flight Draft Sync Between Sides:**
   * *Risk:* Launching `[Chat with Morwen]` while editing Morwen in Studio could create split states if changes are made on both sides simultaneously.
   * *Recommendation:* Tapping a test run or chat jump should automatically commit current input changes to the local world store, ensuring Chat always receives the exact text currently on screen.