# Inkwyrm Worldbuilding Tools Proposal

---

### 1. The recommendation in five lines

1. **Keep generation strictly decoupled from application:** Errata discusses and plans, but records are updated only when the author explicitly taps `Keep` on an isolated draft card beside a field.
2. **On desktop, seat the helper in the collapsible right-hand utility pane; on mobile, dock it as a bottom sheet with a floating badge that never covers the field being drafted.**
3. **Never ask the model for JSON; enforce clean field extraction across weak and chatty models using explicit `<draft>...</draft>` boundary tags with regex fallbacks.**
4. **Isolate Errata's voice to conversational planning turns, running field writes as sterile, cold prose extractions that enforce the house writing rules and prevent mascot tone leakage.**
5. **Treat questions as modular, user-editable lists stored as standard records in the world, allowing authors to tailor them by genre and export them across projects.**

---

### 2. The Helper and the Workshop

#### Screen Layout: 1280 px (Desktop)
On a wide screen, the Studio uses its third column as a swappable workbench pane. The author toggles between **In Context Now** (runtime preview) and **Errata (Helper)** via a segmented pill in the pane header.

```
+--------------------------------------------------------------------------------------------------------------------+
| (o) ink*wyrm*  Studio          [ Transit Dock 4 v ]               [ Model: NovelAI (Ready) ]   [ Chat ] [Adventure]|
+--------------------------------------------------------------------------------------------------------------------+
| RECORDS (142)           | VANCE (Character)                                 [Chat with Vance] | ERRATA (HELPER)    |
| [ Find records...     ] |---------------------------------------------------------------------| [ Context | Helper]|
| Recents: Vance, Pier 9  | [ Writing ]   Adventure   Chat   Rules                              |--------------------|
|-------------------------|---------------------------------------------------------------------| Questions:         |
| v CHARACTERS (18)       | NAME                                                                | [What's the trade?]|
|   Arun                  | [ Vance Keller                                                    ] | [Two physical marks]
|   Koren                 |                                                                     |                    |
| > Vance         <<<<<<  | LINE                                                                | > Vance is a hull  |
|                         | [ High-orbit salvage cutter who won't break seal without upfront  ] |   cutter. Lost his |
| v PLACES (44)           | [ escrow.                                                         ] |   left eye to a bad|
|   v Dock 4              |                                                                     |   seal in '41.     |
|       Cutter Berth      | SECTIONS (2)                                                [+ Add] |                    |
|       Air Valve C       | +-----------------------------------------------------------------+ | Errata:            |
|                         | | Appearance                                             [Here  v]| | A bad seal leaves  |
|                         | | While this is in the scene.                                     | | marks besides the  |
|                         | | [ Short-coupled and thick in the wrists. His pressure suit is  ] | | eye. What does his |
|                         | | [ patched with vulcanized tyre-gum at the knees.                ] | | suit smell like?   |
|                         | +-----------------------------------------------------------------+ |                    |
|                         | | DRAFT FROM ERRATA                               [Keep] [Dismiss]| | > Hydraulic oil.   |
|                         | | "Smells of burned flux and stale recycled air. Carries a bronze | |   Burnt flux.      |
|                         | | valve-wrench tucked through his equipment harness."             | |                    |
|                         | +-----------------------------------------------------------------+ | [ Write Appearance]|
|                         | | Personality                                            [Here  v]| | [ Write Line       ]|
|                         | | [ Seldom speaks over radio chatter...                         ] | +------------------+
|                         | +-----------------------------------------------------------------+ | Talk to Errata...  |
+--------------------------------------------------------------------------------------------------------------------+
```

#### Screen Layout: 390 px (Phone)
On a phone, drafting requires seeing the form while consulting the helper. The helper opens as an 85vh swipe-dismissible bottom sheet. Tapping `[Draft to: Appearance]` closes the sheet and scrolls the record directly to the target field, where the draft card sits highlighted in Token `Raised` with Token `Seal` action buttons.

```
Record View with Pending Draft (390 px)
+---------------------------------------+
| < Dock 4: Records         [Writing v] |
|                                       |
| Vance Keller                          |
| Character                             |
|---------------------------------------|
| SECTIONS                              |
| Appearance                    [Here v]|
| While this is in the scene.           |
| +-----------------------------------+ |
| | Short-coupled and thick in the    | |
| | wrists. Pressure suit patched at  | |
| | the knees with tyre-gum.          | |
| +-----------------------------------+ |
|                                       |
| DRAFT PROPOSAL        [Keep] [Dismiss]|
| +-----------------------------------+ |
| | Smells of burned flux and stale   | |
| | recycled air. Carries a bronze    | |
| | valve-wrench in his harness.      | |
| +-----------------------------------+ |
|                                       |
| Personality                   [Here v]|
| +-----------------------------------+ |
| | Seldom speaks over open comms...  | |
| +-----------------------------------+ |
|                                       |
| - - - - - - - - - - - - - - - - - - - |
| [^ Errata · 2 drafts ready         ]  | <- Floating touch pill (44 px)
+---------------------------------------+
```

#### Screen Layout: Workshop at World Level (1280 px)
Accessed via `World › Workshop`. Errata reviews setting coherence, unlinked places, and missing threads.

```
+--------------------------------------------------------------------------------------------------------------------+
| (o) ink*wyrm*  Studio          [ Transit Dock 4 v ]               [ Model: NovelAI (Ready) ]   [ Chat ] [Adventure]|
+--------------------------------------------------------------------------------------------------------------------+
| WORKSHOP DISCUSSION                                                 | PROPOSED RECORDS (3)                         |
|---------------------------------------------------------------------|----------------------------------------------|
| Errata:                                                             | [x] Air Valve C (Place)             [Create] |
| Dock 4 has forty-four berths and three scrap merchants, but no one  |     Line: The pressure airlock between the   |
| is pumping the fuel. Who manages propellant storage, and why isn't  |     salvage berths and the cold docks.       |
| their union in the groups table?                                    |     Inside: Dock 4                           |
|                                                                     |                                              |
| Author:                                                             | [x] Kell Brothers Fuel (Group)      [Create] |
| The fuel is piped in from the refinery hulk moored off Pylon 2.     |     Line: Monopolist propellant suppliers    |
| Run by two brothers who inherited the concession.                   |     who lock the lines when bills slip.      |
|                                                                     |                                              |
| Errata:                                                             | [ ] Pylon 2 (Place)                 [Create] |
| Good. That gives Vance a reason to be stuck when his tanks run dry. |     Line: The unpressurized mooring mast.    |
| I've drafted records for the air valve, the firm, and the pylon.    |                                              |
| Check the ones you want to instantiate.                             |                                              |
|                                                                     | [ Create 2 selected records ]                |
+--------------------------------------------------------------------------------------------------------------------+
```

#### The Flow of One Session: From Blank Record to Kept Drafts
1. **Initiate:** Author clicks `+ Add Character`. A new record opens with blank Name, Keys, Line, and the default template sections (*Appearance*, *Personality*, *Background*, *Wants*).
2. **Open Companion:** Errata's side pane displays prompt chips: `[Who to a stranger?]`, `[What do they carry?]`, `[What is their debt?]`.
3. **Dialogue:** Author types shorthand: `"Vance. Decompression salvage. Dislikes station admins. Missing an eye from a blow-out."`
4. **Clarification:** Errata answers in voice: *"A blown eye makes him clumsy on his blind side or careful to a fault. Which one? And what's he holding when you walk into his shop?"*
5. **Answer:** Author replies: *"Careful. Always stands with his back to the bulkhead. Holding a fuel gauge."*
6. **Trigger Draft:** Author clicks `[Draft Line]` or `[Draft Appearance]` in the helper, or hits the spark icon directly inside the empty Appearance field.
7. **Cold Extraction:** A targeted, non-conversational call executes. The extracted prose is inserted into a draft tray under the target field.
8. **Resolution:** Author clicks `Keep` (draft replaces field text and collapses), `Edit` (draft text is copied into the editable textarea for manual touch-up), or `Dismiss`.

---

### 3. The Prompts

Every prompt is written out in full. Interpolated dynamic values are marked with double braces `{{...}}`.

#### 1. The Helper Turn (Conversation & Advisory)
*Purpose:* Conversation with Errata. Explores ideas, challenges weak cliches, and maintains assistant discipline.

```text
You are Errata, the editorial dragon of Inkwyrm. You are looking over the author's shoulder as they build their setting.
Your demeanor: sharp, practical, brief, dryly encouraging. You detest purple prose, generic fantasy tropes, emotional abstractions, and ungrounded lore.
Your job: Ask concrete questions that lead to testable behaviors, sensory specifics, trade details, and immediate scene friction. Never write more than two short paragraphs. Do not write full record entries yourself; push the author to supply the core truth, then suggest specific fields to draft.

World Context:
Premise: {{world.premise}}
Genre/Style: {{world.rules_summary}}

Current Record Being Edited (Kind: {{record.kind}}):
Name: {{record.name}}
Line: {{record.line}}
Existing Sections:
{{record.sections_summary}}

Author's Message:
{{user.message}}

Respond in character as Errata. Keep your response under 120 words.
```

#### 2. The Field Write
*Purpose:* Sterile field extraction. Errata's voice is completely silenced. House writing rules are strictly enforced.

```text
You are the mechanical record writer for Inkwyrm. 
Your task is to write a single {{field.target_name}} for a {{record.kind}} record, based strictly on the provided conversation and world premise.

House Writing Rules (Mandatory):
1. Concrete and plain. Zero abstract metaphors, zero stated emotions, zero hedging.
2. Absolutely no AI cliches: do not use "tapestry", "testament", "palpable", "dance", or rule-of-three flourishes.
3. Behavior must be testable in an interactive scene. Prefer actions and habits over descriptive adjectives.
4. Names must be pronounceable at first glance. No invented glossary jargon.
5. Grounding: Focus on tools, smells, worn fabrics, physical postures, debts, or immediate physical constraints.

Context:
World Premise: {{world.premise}}
Record Kind: {{record.kind}}
Record Name: {{record.name}}
Record Line: {{record.line}}
Other Filled Fields:
{{record.relevant_context}}

Source Material from Brainstorming Conversation:
{{conversation.relevant_turns}}

Field Requirements:
Field Name: {{field.target_name}}
Field Specification: {{field.spec_instructions}}
(Line = exactly one standalone sentence. Section = 1-3 dense, concrete sentences. Keys = comma-separated aliases.)

Format Requirement:
Output ONLY the drafted text between <draft> and </draft> tags. No intro, no conversational filler, no commentary.

Example:
<draft>Lean and dun, fingers stained brown to the second knuckle, and she smells of peat smoke and bog myrtle.</draft>
```

#### 3. The Name Call
*Purpose:* Produces five distinct names fitting the world’s naming convention without colliding with existing records.

```text
You are the naming utility for Inkwyrm.
Generate 5 candidate names for a {{record.kind}} in the setting described below.

Rules:
1. Names must be easily readable and pronounceable on sight.
2. Fit the cultural and physical tone of the world premise.
3. Must NOT duplicate or closely rhyme with existing names in this world.
4. Output nothing except the names inside <names> tags, one per line.

World Premise: {{world.premise}}
Kind: {{record.kind}}
Description/Role: {{record.line}}
Existing Names Already in World (Do Not Reuse):
{{world.existing_names_sample}}

Output:
<names>
Name One
Name Two
Name Three
Name Four
Name Five
</names>
```

#### 4. The New-Record Proposal (World Workshop)
*Purpose:* Identifies missing persons, places, or groups mentioned in setting notes or threads, formatted for deterministic regex parsing.

```text
You are the setting analyzer for Inkwyrm.
Analyze the following workshop conversation and list up to 4 missing or implied records that should be formally created.

Only suggest records that meet these criteria:
1. A place or person exists only if an active scene, trade route, or conflict requires it.
2. No generic filler. Every record must introduce immediate friction or utility.

World Premise: {{world.premise}}
Recent Workshop Discussion:
{{workshop.conversation}}

Format Requirement:
Output each proposed record wrapped in an individual <record> tag with kind, name, line, and parent/group fields strictly formatted as shown:

<record>
kind: place
name: Air Valve C
line: The rusted pressure airlock separating the scrap berths from the cold docks.
inside: Dock 4
</record>
<record>
kind: group
name: Kell Brothers Fuel
line: Monopolist propellant suppliers who cut the line when bills run three shifts late.
inside: 
</record>
```

---

### 4. Default Questions & Customization

#### Character Questions
1. **The Stranger’s View (Line):** Who or what is this to someone stepping into the room for three seconds?
2. **Sensory Marks (Appearance):** What two physical details, coloring, or smells prove they do this work?
3. **The Testable Reaction (Personality):** What do they do with their hands when someone lies to them or asks for credit?
4. **The Anchor (Background):** What trade did they leave or master, and who still holds their contract or marker?
5. **The Shift (Wants):** What physical item, clearance chit, or coin must they get their hands on before nightfall?

#### Place Questions
1. **The Threshold (Line):** What is this place to someone standing outside its door?
2. **Atmosphere & Strain (Sensory):** What does the air smell like, how good is the light, and what sounds drown out talk?
3. **The Work (Activity):** Who is standing here right now, and what physical work are they doing?
4. **Friction & Hazard (Danger):** What breaks, stains your clothes, costs money, or calls the law if you linger?
5. **Ways Out (Exits):** Where can you run when the threshold is blocked?

#### Thread Questions
1. **The Pressure:** What happens in three days if every character in this scene does nothing?
2. **The Objective:** What physical object must be moved, wire cut, contract signed, or body recovered?
3. **The Opposition:** Who loses money or status the moment this objective is accomplished?
4. **The Toll:** What gear, favors, or blood must be burned to make the first step?
5. **The Fallout:** What changes on the map once this is settled?

#### Author Customization & Cross-World Portability
* **Storage:** Default questions are stored in browser storage as a hidden system group: `System › Question Packs`.
* **In-Studio Editing:** Authors access `World › Templates & Questions`. Here, questions can be reworded, reordered via drag/bump, deleted, or appended with custom tags.
* **Portability:** Tapping `Export Questions` downloads a lightweight `.ink-pack.json` file. Authors building a cybernetic noir or orbital sci-fi world can import an "Industrial Hard-SF" question pack with one tap, replacing medieval defaults.

---

### 5. Worked Example: Near-Future Orbital Salvage

#### Workshop / Helper Conversation Transcript

> **Author:** Vance is a salvage cutter living out of Dock 4. He's burned out, middle-aged, and works on dead freighters.
>
> **Errata:** Living out of a berth means grease on the sheets and cold air in the morning. Is he independent, or does station control own his rig?
>
> **Author:** He owns the cutter, barely. Owes six months of berth slip fees to Dockmaster Vane. He lost an eye when a high-pressure line burst six years back.
>
> **Errata:** Good. An old injury in vacuum work makes a man move deliberately. Does he wear an optic patch or an empty socket behind his seal? And what does he do when Vane sends someone to impound his torch?
>
> **Author:** A cheap green glass prosthetic that doesn't track right. If someone touches his torch, he cuts the gantry power from his pocket remote and locks himself inside the pressure hull.

---

#### Resulting Record Drafts

Generated via the Field Write calls from the conversation above and accepted by the author:

```json
{
  "id": "vance",
  "kind": "character",
  "name": "Vance Keller",
  "keys": ["Vance", "cutter", "salvager"],
  "line": "A salvage cutter who owes six months of slip fees and won't strike an arc without escrow in hand.",
  "pronouns": "he/him",
  "groupIds": ["dock4-scrappers"],
  "sections": [
    {
      "id": "s1",
      "title": "Appearance",
      "reach": "here",
      "keys": [],
      "when": null,
      "text": "Thick-shouldered and stiff in the hips. A dead green glass prosthetic sits fixed in his left socket, and his thermal coveralls smell of burned flux, stale chicory, and cooling vacuum sealant."
    },
    {
      "id": "s2",
      "title": "Personality",
      "reach": "here",
      "keys": [],
      "when": null,
      "text": "Stands with his right side toward strangers so his working eye covers the room. When threatened with impound or fines, he cuts the breaker to the gantry feed and steps inside his pressure lock."
    },
    {
      "id": "s3",
      "title": "Background",
      "reach": "named",
      "keys": ["line burst", "past"],
      "when": null,
      "text": "Blew his eye and hip joints on the orbital tanker *Caelum* when a coolant line ruptured under sixty atmospheres. Used the settlement payout to buy a second-hand cutting rig that has broken down in every berth in Dock 4."
    },
    {
      "id": "s4",
      "title": "Wants",
      "reach": "named",
      "keys": ["slip fees", "debt"],
      "when": null,
      "text": "Needs three thousand scrip before second shift to pay Dockmaster Vane's impound clerk, or his fuel manifold gets locked from the main terminal."
    }
  ],
  "sets": [],
  "notes": "Keeps a remote kill-switch for berth gantry power inside his left glove."
}
```

---

### 6. Weak Models: What Changes

When running against models with strict context budgets (8k tokens) or weak instruction following (NovelAI Xialong, local 7B/8B models):

| Feature | Standard (API / 32k+ Context) | Weak / Small Local Model (8k Context) |
|---|---|---|
| **Context Assembly** | Sends premise, full world rules, 5 recent records, and last 8 chat turns. | **Aggressively pruned:** Sends world premise (1 sentence), target record name/line, and last 2 chat turns only. Rules guide is completely omitted. |
| **Parsing Strategy** | Tag extraction with fallback to clean JSON. | **Strict Regex Extraction:** Parses text strictly between `<draft>...</draft>` tags. If tags are missed, uses heuristic line stripping (drops any line starting with "Here is", "Sure", or quotation borders). |
| **Generation Scope** | Can draft multiple sections or suggest 4 records at once. | **Atomic Single-Field Operations:** Multi-record generation is disabled. Every action drafts exactly one field (e.g. Line *or* Appearance) to prevent context exhaustion and hallucination. |
| **Sampling Parameters** | Temperature `0.7`, Presence Penalty `0.2`. | Temperature locked to `0.3` (prevents rambling metaphor), Max Tokens capped at `120` for sections and `40` for lines. |
| **Errata Persona** | Dynamic banter and stylistic pushback. | **Flattened Persona:** Errata prompt stripped of roleplay instructions; acts as a direct, brief interrogator to conserve token compute. |

---

### 7. Implementation Phases

* **Phase 1: Inline Field Generators (No Chat Required)**
  * Add the spark/pen icon beside every text input and section in Studio.
  * Implement the sterile `Field Write` prompt using only existing record fields and world premise.
  * Inject the result into an inline `<DraftCard />` with `[Keep]` and `[Dismiss]` actions.
  * Ship with `<draft>` regex extraction and strict house rule sanitizers.

* **Phase 2: The Helper Companion Pane & Question Chips**
  * Build the right-side helper panel (desktop) and bottom sheet (mobile).
  * Implement the conversational `Helper Turn` prompt with Errata's voice.
  * Add default clickable question chips above the chat box to steer raw user input.
  * Link conversation context into Phase 1's field write triggers (`[Draft Line from Chat]`).

* **Phase 3: The World Workshop & Batch Proposals**
  * Deploy the `World › Workshop` view for world-level setting discussions.
  * Implement the `New-Record Proposal` prompt with `<record>` tag parsing.
  * Display proposals in an actionable check-list tray where authors tick items to instantiate them as real records.

* **Phase 4: Question Pack Editor & Cross-World Portability**
  * Expose `World › Templates & Questions` in the Studio navigation.
  * Allow full editing, reordering, and tagging of default question sets.
  * Implement `.ink-pack.json` import/export for community sharing.

---

### 8. What It Won't Do, Risks, and Open Questions

#### What It Won't Do
* **No Autonomous Writing:** It will never generate a record or populate a field without an explicit author tap on a `Keep` button.
* **No Rule Balancing:** It will not invent dice statistics, calculate approach modifiers, or tweak mechanical numbers.
* **No Unsolicited Background Tasks:** It does not run automated linters or background model calls while the author is typing. Every call is user-initiated.
* **No Hallucinated Lore Persistence:** Errata's conversational memory lives only in temporary session state; only accepted draft fields are committed to the world database.

#### Risks and Open Questions for the Owner
1. **Chat History Storage in Local Browser:**
   * *Risk:* Preserving long Errata conversations per record could bloat browser storage if worlds contain 500+ records.
   * *Recommendation:* Cap conversation history at the last 10 turns per record, and purge chat history automatically upon record export unless explicitly flagged to keep.

2. **Accidental Voice Bleed:**
   * *Risk:* Looser models (such as Xialong) might mimic Errata's sarcastic dragon tone when drafting a character's *Appearance* or *Speech*.
   * *Safeguard:* The field generation call runs as a separate, completely independent API request that receives only the factual transcript data, stripping Errata's persona system prompt entirely.

3. **Mobile Screen Space with Keyboard Active:**
   * *Risk:* On mobile browsers, an open virtual keyboard compresses an 85vh bottom sheet into an unworkable 150 px slit.
   * *Question for Owner:* On mobile, should tapping a question chip automatically close the chat sheet and load the answer directly into an active draft banner above the field?