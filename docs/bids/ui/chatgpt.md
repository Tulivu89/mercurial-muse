# Inkwyrm UI — ChatGPT's bid

Proposal for the [UI brief](brief.md). I read the supplied screenshots, the current brand decisions, and Claude's proposal before writing this bid. This is a competing recommendation, not the decision or an implementation. Priority: Studio navigation and editing, then the shared site frame, then Adventure's visual migration.

## 1. The recommendation in five lines

1. Keep Studio's list, editor and context beside one another when they fit; on a phone, open an editor page and give Context a full-height sheet with an exact return path.
2. Give each record four possible tabs: **Write, Life, Rules, Adventure**; put character schedules and chat material together under Life, without author modes that hide parts of a world.
3. Make a large world navigable through one searchable outline, nested place folds, recent records and dependable Back; preserve the author's position across every detour.
4. Bring Adventure into Paper and Night while keeping story → prompt → five closed menu sections in one document scroll, with no header or floating navigation during play.
5. Share the marks, fields, sheets, connection settings and movement between sides; ship small Studio improvements before changing the whole frame.

## 2. The Studio

### The frame: a work surface with a dependable return

At 1280 px, use a 64 px site header and a 48 px world toolbar above a three-column workspace: **256 px outline, 640 px editor, 320 px context**, with two 16 px gutters and 16 px outside margins. These are starting allocations, not fixed widths at every size. Keep the text within the editor comfortable rather than stretching textareas across a monitor.

The outline and context have their own labelled scroll regions at this width. The editor owns the main reading scroll. Keyboard focus always remains visible within its region. The Context pane stays about context: Checks is a world page, not a second competing tab in that pane. A finding can temporarily open context without changing the meaning of either tool.

Between roughly 1000 and 1199 px, show outline and editor; Context opens as a sheet. Below 1000 px, show a list page or an editor page, with Back between them. This deliberately gives a tablet a usable editor instead of squeezing in three narrow columns. Test the breakpoints with actual labels and 200% zoom; available space decides the layout.

On the phone, the editor toolbar has **Records** and **Context**. Context is a full-height modal sheet, with its own scroll and a visible **Back to Morwen** button. Closing it restores the field, selection and scroll position. It retains the chosen scene, conditions and recent words between visits. This makes context checking a detour from writing, rather than another permanent bottom navigation system.

Do not stack the full context panel below a long editor. Do not add a permanent phone tab bar for World, Page, Context and Checks: these are different kinds of destination, and the extra chrome takes space from the writing.

### Mockups: 390 and 1280 px

These are ASCII layout mockups; the boxes describe arrangement, not decorative borders. All controls shown have at least a 44 × 44 px target. Phone layouts have 16 px outside margins, leaving 358 px for content. Text and controls wrap vertically; none of these screens require horizontal page scrolling.

Use the exact Wet Ink palette throughout:

| Role | Paper | Night |
| --- | --- | --- |
| Ground / surface / raised | `#F3EEE4` / `#FBF8F2` / `#FFFFFF` | `#16130F` / `#201C16` / `#2A251D` |
| Text / secondary / lines | `#1D1B17` / `#5E574C` / `#D9D0C0` | `#EDE5D6` / `#A89E8D` / `#3A342B` |
| Primary fill / its text | `#B23A26` / `#FFF8F0` | `#E46A4E` / `#1A100B` |
| Player and condition fill / its text | `#2F4A6B` / `#F3F6FA` | `#8FB1D9` / `#0F1620` |

Fraunces supplies titles, Literata supplies record prose and story, and Atkinson Hyperlegible Next supplies controls. Use 6 px control, 10 px card and 4 px chip radii. Lines separate regions; cards group genuinely separate objects. Follow the newer [brand decision](../../brand.md): lacquer shading belongs only to the approved marks; controls and surfaces stay flat. Below 32 px, use the simplified marks. Respect reduced motion and do not replay page-entry effects on every tab switch or keystroke.

**Studio editor, 390 px, Paper.** The name and one-line description remain readable above the tabs; the description is not another permanently open input. Edit identity opens its fields in place.

```text
┌──────────────────────────────────────┐
│ ink wyrm · Studio       [Switch side] │
├──────────────────────────────────────┤
│ [‹ Records]                [Context] │
│ Abernys: Bogwater                    │
│ Morwen                    Character  │
│ The witch            [Edit identity] │
│ [Write] [Life] [Rules] [Adventure]    │
├──────────────────────────────────────┤
│ SECTIONS                      [Add]  │
│                                      │
│ Appearance                  [Here ▾] │
│ While this is in the scene.          │
│ ┌──────────────────────────────────┐ │
│ │ Lean and dun, fingers stained     │ │
│ │ brown to the second knuckle, and │ │
│ │ she smells of peat smoke and    │ │
│ │ bog myrtle.                     │ │
│ └──────────────────────────────────┘ │
│ [Move up] [Move down] [More]          │
│                                      │
│ ▸ Personality                Here    │
│ ▸ Speech                     Here    │
│ ▸ Background                 Named   │
│ SETS (0)                      [Add]  │
│ ▸ Private notes · never sent         │
│ Saved in this browser                │
└──────────────────────────────────────┘
```

At the default UI size the four tab labels fit across 358 px with at least 44 px height. At large text sizes, use a two-by-two arrangement in the same reading order. Keep them keyboard navigable with selected state and labelled panels.

**Studio, 1280 px, Paper.** Selected and focused rows need different treatments: selected gets a surface and text marker; focus gets a high-contrast outline.

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ink wyrm · Studio                              [Connection] [Chat] [Adventure]        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ Abernys: Bogwater  /  Morwen                [Find records] [Checks] [World actions]   │
├───────────────────┬─────────────────────────────────────────┬───────────────────────┤
│ [Find among…    ] │ Morwen · Character      [Chat with]      │ In context now        │
│ [All kinds ▾]     │ The witch           [Edit identity]      │ Here in the scene     │
│ Recent            │ [Write] [Life] [Rules] [Adventure]        │ The workroom   [Edit] │
│   Morwen          │                                         │ Morwen          [×]   │
│   Morwen's island │ SECTIONS                         [Add]  │ [Add a record]        │
│ World             │ Appearance                    [Here ▾]  │                       │
│   About · Files   │ While this is in the scene.             │ What was just said    │
│   Rules · Checks  │ ┌─────────────────────────────────────┐ │ [                    ]│
│ ▾ Characters (16) │ │ Lean and dun, fingers stained brown │ │ Conditions     [Edit] │
│   Nest            │ │ to the second knuckle, and she       │ │                       │
│   Ellis           │ │ smells of peat smoke and bog myrtle.│ │ About 266 tokens*     │
│ ▌ Morwen          │ └─────────────────────────────────────┘ │ [Copy as text]        │
│ ▾ Places (38)     │ [Move up] [Move down] [More]             │ ────────────────────  │
│   ▾ Fenmire       │ ▸ Personality                     Here  │ Abernys: Bogwater     │
│     ▸ Bogwater    │ ▸ Speech                          Here  │ Premise…      Always  │
│     Morwen's      │ ▸ Background                      Named │ Morwen                │
│       island      │ SETS (0)                          [Add]  │ Appearance…      Here │
│ ▸ Groups (18)     │ ▸ Private notes · never sent             │ [Open source]         │
└───────────────────┴─────────────────────────────────────────┴───────────────────────┘
```

*The screenshot's “About 266 tokens” is illustrative; the implemented preview must show its computed estimate for the current moment, not a fixed count.*

**Phone Context sheet.** On opening, focus its title or return button, not a text input that immediately brings up the keyboard. Configure the moment first; the readable output follows. Each included section names its reach and offers an explicit source link. Do not claim an excluded-section explanation until the context engine actually supplies one.

```text
┌──────────────────────────────────────┐
│ [‹ Back to Morwen]                   │
│ In context now                       │
│ The workroom · Morwen       [Change] │
│ What was just said                   │
│ [                                  ]│
│ Conditions                   [Edit] │
│ About … tokens        [Copy as text]│
│ ─────────────────────────────────── │
│ Morwen · Appearance          Here   │
│ Lean and dun, fingers stained…      │
│ [Open this section]                 │
└──────────────────────────────────────┘
```

Opening a source closes the sheet and navigates to the source record, tab and section. Back returns to the preview and its scroll position. Ordinary closing returns to the original editor. Do not bury a second modal underneath the first.

### Moving around 300–800 records

Keep the existing kind folds, sorting and searchable picker. Improve their continuity before adding more navigation systems.

- **One outline, two ways of finding.** A visible Find field filters the outline. A **Find records** action opens a full search sheet from an editor; `/` focuses search only outside editable controls. Search stays scoped to the current world, with name and aliases first, then keys and one-line description. Label a key match. Defer full-prose search until authors need it.
- **Search does not destroy the tree.** While searching, show flat results with kind and containing-place trail. Clearing the query restores folds and position. Rank exact name, name prefix, alias, then other matches; break ties by name. A no-result state offers Clear filters and Add record separately.
- **Recent means opened.** Show the last five opened records, distinct from the picker's recent selections. They are useful even when a search query is empty. Defer pins until the owner finds recent insufficient.
- **Fold every place branch.** Put a separate, labelled expand button beside a linked place name. The name opens the place; the button folds its children. At depth four, cap indentation and show a compact parent trail, so names retain room on a phone. Finding Morwen's door shows its ancestry without expanding hundreds of siblings.
- **Return to the exact list.** Keep per-world query, kind filter, order, expanded branches and scroll position. Opening a result must not clear them. Give record, tab and world pages stable URL state so browser Back works; keep scroll and temporary panel state in local UI preferences rather than world exports. Missing or deleted IDs resolve to the world list with an explanation.
- **Checks stays visible as a destination.** Show “All clear” or a labelled finding count; don't mark every row red or imply every finding blocks play. From a finding, open the exact relevant field and retain a Return to Checks link.

For 800 records, begin with ordinary filtered lists and collapsed branches, not virtualization or a new search dependency. Measure keystroke-to-results on a phone with 800 records, including long names and deeply nested places. A proposed target is under 100 ms for filtering and rendering useful results; adopt virtualization only if profiling shows it is necessary, with keyboard and screen-reader behavior preserved.

### Record pages: separate jobs, keep common writing visible

| Tab | Content | Where it appears |
| --- | --- | --- |
| **Write** | Sections, sets, private notes | Every record |
| **Life** | Schedule first; then greetings, example chats, and existing Home authoring controls where supported | Characters |
| **Rules** | Effective mechanics, source of each value, local overrides | Kinds the existing Rules panel supports |
| **Adventure** | Home/location, routes, thread milestones, scenario starts and existing adventure fields, according to kind | Only kinds with those fields |

The shared identity area contains name, description and **Edit identity** for keys, pronouns and group membership. Don't duplicate these fields between tabs. Life's subtitle is “Schedules and chat”; it does not pretend a schedule is chat-only. An event has one editor including its place and condition. Adventure links to that event instead of maintaining another schedule form. Unsupported Home features remain outside this bid.

A new record opens in Write with Name focused, an optional one-line description and a clear **Add section** action. A newly created section opens immediately. Existing sections collapse to title, reach and a short excerpt, except the last section the author was editing. Sets follow the same pattern, showing which member is selected. Support Move up/down; dragging may be added later but is never required.

Existing records remember their last tab **per record**, not per kind: opening a character to check rules should not make every other character open on Rules. Cross-links override this preference when they target a specific field. Tab counts use meaningful labels such as “Rules · 4 set here”, not an unexplained total of everything the engine derives.

Keep the reach control and its plain-language explanation together. “Never” means never sent; it must not look like a disabled field. A title containing only “Appearance” is insufficient feedback about what reaches the model. Rules show “Standard”, “From this world”, “From Harefolk” or “Set here” beside the actual value, with **Put back** restoring the inherited value rather than assuming standard.

Keep existing save behavior. If navigation would unmount a field that commits on blur, flush that edit before moving. Report “Saved in this browser” only after storage succeeds; on failure retain the text, explain it and offer an export. Deletion belongs in record actions with a confirmation naming the record and known references; it is not the natural next action beneath the last writing field.

### World › Rules at length

Give Rules an index: Approaches, States, Tiers, Dice, Deeds, Growth, Trade, Calendar, Scene actions and Goods, matching existing content. At wide sizes it replaces the record outline while Rules is open; avoid adding a fourth column. On a phone the index is its own page, and a category opens with **Back to Rules**. Keep the same category structure on both widths.

Each category shows **Standard** or “N changes”, including changes to individual state bands. “Only changed” filters the category with a persistent visible indicator and Clear action. Opening a source link reveals its field even if the filter would hide it. A category with no changes says so rather than showing a mysteriously empty page.

An override always shows its source next to its value. Reset acts on a field first; category reset, if offered, previews affected overrides and requires confirmation. Keep existing validation that refuses dangling references and show the reason beside the attempted change. This proposal changes navigation, not rule precedence or ruleset structure.

## 3. Adventure in Wet Ink

The reading column is at most 720 px wide and centered at 1280 px; at 390 px it has 16 px side padding. Start with Literata 18 px and 1.65 line height in both sizes, with a shared adjustable reading size. Narration is italic secondary ink, speech plain primary ink, and player turns use blue-black with readable text. Do not reduce all text opacity to make the page look literary.

The document remains **story → offered actions and prompt → Scene, You, Map, World, Settings**. The composer is in normal flow, not fixed over the story. Actions wrap into rows and may grow taller than 44 px. No horizontal chip scroller that hides the last action. The send icon has a visible or accessible “Send turn” label. Show seal fill only when the primary action is available; an unavailable send control has a reason such as “Write a turn first”.

The menu has all five sections closed on entering play, and at most one open. Each whole summary row is a 44 px minimum button with expanded state. Scene's existing place/time/presence summary remains useful. Accordion opening, dice, turn generation and undo behavior stay as they are. Record pages, journal and guide keep their Menu return, restoring the corresponding scroll position.

### Mockups: 390 px, Paper and Night

Same layout, different tokens. These excerpts show the story's end and the menu below the prompt. Earlier paragraphs remain above in the same scroll.

```text
PAPER · ground #F3EEE4                  NIGHT · ground #16130F
┌────────────────────────────────────┐ ┌────────────────────────────────────┐
│ The one holding the lantern leans  │ │ The one holding the lantern leans  │
│ closer. That's no eel.             │ │ closer. That's no eel.             │
│                                    │ │                                    │
│ It's in our net. The one with the  │ │ It's in our net. The one with the  │
│ spear leans out and turns your     │ │ spear leans out and turns your     │
│ wrist with the butt of it, so the  │ │ wrist with the butt of it, so the  │
│ light falls on the ink. Colony.    │ │ light falls on the ink. Colony.    │
│ ────────────────────────────────── │ │ ────────────────────────────────── │
│ [Work a night on the long fence]   │ │ [Work a night on the long fence]   │
│ [◇ Make a check]                   │ │ [◇ Make a check]                   │
│ ┌────────────────────────────────┐ │ │ ┌────────────────────────────────┐ │
│ │ Your turn                      │ │ │ │ Your turn                      │ │
│ │ *action*, speech, (thought)     │ │ │ │ *action*, speech, (thought)     │ │
│ └────────────────────────────────┘ │ │ └────────────────────────────────┘ │
│                         [Send ↑]   │ │                         [Send ↑]   │
│ ────────────────────────────────── │ │ ────────────────────────────────── │
│ Scene                           ▾  │ │ Scene                           ▾  │
│ The long fence · early morning     │ │ The long fence · early morning     │
│ You · bruised, strained          ▾ │ │ You · bruised, strained          ▾ │
│ Map                             ▾  │ │ Map                             ▾  │
│ World                           ▾  │ │ World                           ▾  │
│ Settings                        ▾  │ │ Settings                        ▾  │
└────────────────────────────────────┘ └────────────────────────────────────┘
```

Render action sentences in Literata italic secondary ink; render “That's no eel”, “It's in our net” and “Colony” as plain speech. ASCII cannot display that distinction. The composer uses raised fill and a line border. Paper's active Send is `#B23A26` with `#FFF8F0` text; Night's is `#E46A4E` with `#1A100B` text. Menu headings use Fraunces with interface summaries beneath them. Avoid five large boxed cards: separators are sufficient.

### Mockups: 1280 px, Paper and Night

Each canvas below is 1280 px with a centered 720 px column and 280 px margins. No sidebar, header, or permanently visible menu appears in the extra space.

```text
PAPER — #F3EEE4 ground, #FBF8F2 menu surfaces, #1D1B17 speech
┌──────────────────────────────────────────────────────────────────────────────┐
│                  The net comes up out of the black water all at              │
│                  once, and you come up with it. Eels slide over               │
│                  your arms and down your collar, cold and thick…             │
│                                                                              │
│                  The one holding the lantern leans closer.                    │
│                  That's no eel.                                              │
│                  ───────────────────────────────────────────                 │
│                  [Work a night on the long fence] [◇ Make a check]            │
│                  [Your turn: *action*, speech, (thought)    ] [Send ↑]        │
│                  ───────────────────────────────────────────                 │
│                  Scene · The long fence · early morning   ▾                  │
│                  You · bruised, strained                   ▾                  │
│                  Map                                      ▾                  │
│                  World                                    ▾                  │
│                  Settings                                 ▾                  │
└──────────────────────────────────────────────────────────────────────────────┘

NIGHT — #16130F ground, #201C16 menu surfaces, #EDE5D6 speech
┌──────────────────────────────────────────────────────────────────────────────┐
│                  The net comes up out of the black water all at              │
│                  once, and you come up with it. Eels slide over               │
│                  your arms and down your collar, cold and thick…             │
│                                                                              │
│                  The one holding the lantern leans closer.                    │
│                  That's no eel.                                              │
│                  ───────────────────────────────────────────                 │
│                  [Work a night on the long fence] [◇ Make a check]            │
│                  [Your turn: *action*, speech, (thought)    ] [Send ↑]        │
│                  ───────────────────────────────────────────                 │
│                  Scene · The long fence · early morning   ▾                  │
│                  You · bruised, strained                   ▾                  │
│                  Map                                      ▾                  │
│                  World                                    ▾                  │
│                  Settings                                 ▾                  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**A check occupies the prompt's existing place**, at either width, in a raised 10 px-radius panel. Preserve the current approach, difficulty, modifiers, dice symbols and resolution choices. On a phone, each labelled choice gets its own row. Result words such as Success, Failure and Advantage accompany symbols and never rely on color. The check's primary resolve action temporarily takes the seal role from Send. Cancelling returns the draft prompt and its focus. Don't redesign check mechanics as part of a theme change.

### What stays alone

Keep Adventure's one scroll and menu placement, current play actions, module/save format, state bars, ledger and journal, and narration formatting. Keep Chat's transcript layouts and portrait behavior. Keep Studio's reach semantics, existing imports/exports, searchable pickers and context engine. No account system, sync, new component library, graphical rule builder, map implementation or helper persona belongs in this UI bid.

## 4. One site

The common shell is a family resemblance and consistent routes. Studio, Chat's non-reading pages and Adventure's start page share the wordmark, active side label, a **Switch side** control and access to shared connection/preferences. On desktop, direct side links may replace the switch sheet. On a phone, the compact header avoids the screenshot's several rows of equally weighted navigation buttons. Chat's Chats, Home and Settings remain local navigation below its site identity.

Adventure **in play has no header**. Its existing Settings section contains Connection, Appearance and labelled links to Studio and Chat, following the current menu order. Preserve its return path through ordinary browser Back. Chat's reading screen retains its existing compact navigation rather than gaining another header above it.

Show connection status in words: **Not configured**, **Configured · not checked**, or **Checked this session**, according to evidence. A saved key is not proof that the provider works. Open the existing shared connection form; never ask for a key again just because someone changes side. Theme, reading size and motion preferences share one storage path; do not copy or migrate provider keys into new UI preference records.

**Moving between sides, phone mockup:**

```text
┌──────────────────────────────────────┐
│ Switch side                 [Close] │
│ Studio · Current                    │
│ Keep editing Morwen                 │
│ ─────────────────────────────────── │
│ Chat                                │
│ Open your chats                     │
│ ─────────────────────────────────── │
│ Adventure                           │
│ Open saved games and worlds         │
└──────────────────────────────────────┘

Studio / Morwen                      Studio / Abernys: Bogwater
  [Chat with Morwen]                    [Play in the adventure]
          ↓                                      ↓
Chat / new chat setup                 Conversion notes, if any
  Character: Morwen                    Continue with a copy
  Choose persona and scenario                    ↓
  [Start chat]                        Adventure / New game
          ↓                             Abernys: Bogwater selected
  Conversation                                  ↓
  [Edit source in Studio]               Start a new save
          ↓
Studio / same Morwen record
```

The generic side switch never silently starts a game or creates a conversation. Contextual actions do the specific handoff: use the existing `/chat/#/with/<world id>/<record id>` link and world-to-module launch. Preserve the existing warning about what conversion cannot carry. “Play” does not overwrite a running save or imply that editing the Studio world updates it.

Only offer Edit source when the original world's ID and record ID are known and still exist. Adventure's source-link support may need provenance not currently retained; defer that link rather than guessing from matching names. A chat or game remains an instance. Editing its source is not a way to rewrite its past turns or save.

## 5. Shared components

Use React 18, plain CSS and the existing SVG marks; no additional runtime libraries are needed.

| Piece | Shared responsibility |
| --- | --- |
| **Site identity and switch** | Approved mark, wordmark, active side, ordinary destination links; omitted during Adventure play |
| **Record row** | Name, kind/trail, selected state and optional labelled finding; wrapping long names and a 44 px minimum target |
| **Panel and disclosure** | Heading, useful summary, expanded state and optional actions; one accordion controller for Adventure's five sections |
| **Sheet** | Dialog name, focus containment, Escape/Close, scroll management and focus return; phone Context and existing pickers use the same primitive |
| **Field and reach field** | Persistent label, help/error relationship, text sizing, reach chip plus explanation; build on current kit fields |
| **Tabs** | Selected panel, arrow/Home/End keyboard behavior, visible focus, counts with meaning and no clipped labels |

Do not force picker selection, record navigation and destructive actions into identical row behavior. Reuse presentation while keeping their semantics explicit. A fold toggle and a record link are sibling controls, never buttons nested inside links.

Use text tokens for labels, not the faint border color. Put a contrasting focus outline around controls; borders alone do not establish their contrast. Verify actual combinations, including disabled controls, selected rows and focus rings, rather than assuming every token against every other token passes. Announce saves and errors without reading the whole context preview on each keystroke. At 200% zoom and with the software keyboard open, every action must remain reachable. Respect safe areas on phones.

## 6. Phases — smallest first, each independently shippable

| Phase | Deliverable | Acceptance evidence |
| --- | --- | --- |
| **U1: Keep my place** | Preserve list query, folds, scroll and return from records/pickers; separate recent opened records from recent picks | Find Morwen, open her, choose a group, return: query and list position remain; keyboard Back works |
| **U2: Shorter record editing** | Four conditional tabs, section disclosures, identity editor and explicit move controls; keep existing data fields | At 390 px, edit a section, change tabs and return with text and focus intact; all existing fields remain reachable |
| **U3: Big-world navigation** | Per-branch place folds, result trails, scoped search ranking and precise Checks links | An 800-record fixture with deep nesting, duplicate names and long labels is navigable on a phone; no sideways page scroll |
| **U4: Context and Rules** | Responsive frame, phone Context sheet, Rules index and changed filters | Preview a moment, open its source, go Back and recover the moment; a rule reset restores the correct inherited value |
| **U5: Shared movement** | Compact common shell, shared preferences and contextual source/handoff links where provenance exists | Studio → Chat → source returns to the right record; world → Adventure creates a copy without changing a save |
| **U6: Adventure's house look** | Paper/Night tokens and type, composer and check styling, existing menu restyled | Compare 390/1280 in both themes; story → prompt → menu order unchanged, no in-play header, one open menu section at most |

For code phases, retain the repository's tests, type checks and builds. Add interaction coverage around state loss, reachability and return behavior rather than snapshot tests for every decorative detail. Review both themes, long labels, 200% zoom, keyboard-only use and reduced motion at each affected phase. Test U3 on a representative phone; desktop timing alone cannot settle it. The fixture is proposed validation work, not a claim that these changes have been tested already.

## 7. Risks and open questions

- **Life may be the wrong word.** My default is Life with “Schedules and chat” underneath. Ask the owner to find a greeting and a scheduled stop from that page without hints. If the label fails, rename it before shipping; don't add another permanent tab by reflex.
- **Collapsing hides work.** Show section excerpt and reach while closed, open new sections immediately, and restore the active editor. Don't collapse every section whenever a record rerenders.
- **State retention can preserve mistakes.** Always show active filters and a Clear action. Use IDs, prune deleted records from recents, and fall back gracefully when saved UI state is stale. UI preferences must not contaminate world exports.
- **Autosave can be overstated.** A layout refactor can lose a blur-committed edit or display a false saved label. Verify storage acknowledgement and route transitions before claiming saved work is safe. Local-only storage still needs visible export/backup access in World actions.
- **Three columns can squeeze long prose.** Use the proposed widths as a testable starting point and collapse context before narrowing the editor beyond comfort. No user should need to discover a resize handle to make writing possible.
- **Reading preferences need continuity.** Follow the current explicit theme choice; otherwise follow the device. Do not force existing Adventure readers into Paper after the migration. Ask the owner whether 18 px Literata feels right on their phone, while keeping size adjustable.
- **Origin matters.** Shared browser storage works across paths on one origin. Separate development ports do not share storage. Validate cross-side handoffs through the combined production server before diagnosing missing worlds or keys as a UI problem.
- **The source may no longer exist.** Exported modules and imported cards cannot always lead back to a Studio record. Offer a clear unavailable-source explanation, never an invented editable original.

These questions refine labels and defaults; none requires delaying the first navigation and record-editing phases. The owner's Adventure layout and Wet Ink decisions remain settled.
