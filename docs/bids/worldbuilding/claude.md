# Worldbuilding tools: Claude's own proposal

Nov 11, 2026 · @AmbiProp · Written from the brief, before any bid was read. Not revised afterwards (`docs/bids/README.md`).

Claude has what a bidder doesn't: the site's prompt formats and relay, the context code, and the owner's earlier tools (Character Engine's Build, Orbis's Coda, CharacterRoom's side generations). This proposal leans on that.

## The recommendation in five lines

1. **One field per call, plain text out.** A draft is always one field, written by a call that knows that field's shape, and comes back as plain text, never JSON. That's what makes it work on every model, Xialong and small local ones included.
2. **The conversation settles facts; the facts write the fields.** The helper keeps a short, editable list, **What we've settled**, beside the chat. Field writes read that list and the record, not the whole transcript, so they fit a small window and the author can correct the source before anything is written.
3. **Errata talks; she never writes.** Her voice is in the chat's prompt only. The calls that write drafts have no persona at all, just the world's voice and the house rules, with the world's own records as examples.
4. **Questions are a list the author owns,** per kind and per world: on or off, reworded, added, copied from another world. The helper asks the next one when the author has nothing to say, and the same list can be filled in as a form by authors who already know their answers.
5. **Build it in order of what works alone:** generate buttons first, then the helper on a record, then questions as a form, then the workshop.

## The helper and the workshop on screen

**Phone (390 px):** the helper is a sheet over the record, half height, pulled up to full. Drafts don't appear in the sheet. They appear on the page, under the field they belong to, so the author sees them where they'll live.

```
Appearance    Here
┌──────────────────────────────────────────┐
│ (the field as it is)                      │
└──────────────────────────────────────────┘
 Draft  Tall for a ferry clerk and stooped
        with it; nicotine yellow at the…
        [Keep] [Edit] [Again] [Drop]

──────────── Errata ───────────────── ⌃ ──
 What does she do with her hands when
 a car rolls up and she doesn't like it?
 [ type…                         ] [Send]
 Settled (4) · Ask me something · Write ▾
```

**Wide (1280 px):** the helper is a tab in the Studio's right pane, beside In context now and Checks. The workshop is the same pane on the world's own page.

**Write ▾** lists the record's fields (line, keys, each section, a set's entries) with the ones still empty first. **Write all empty** drafts each in turn.

## One session, blank record to kept drafts

1. The author makes a character, *New character*, and opens the helper. Errata asks the first switched-on question for characters.
2. They talk. After each of Errata's replies, any line can be tapped into **Settled**. Errata also proposes settled facts at the end of a reply, marked so the author can take them with one tap.
3. **Write ▾ › Write all empty.** Each field gets its own call. Drafts appear under the fields.
4. The author keeps some, edits some, asks again for one. **Name ideas** gives eight names that aren't already in the world.
5. Kept drafts become the record. The chat and Settled stay with the record in this browser; Settled can be copied into the record's Notes.

## What one helper turn sends

In this order, least changing first, so providers that reuse a prompt's start can do so:

1. **Errata's lines and the job** (fixed): below.
2. **The house rules** (fixed).
3. **The world:** name, genre, tone, premise.
4. **The record as it stands:** kind, name, line, every section's title and text.
5. **Its neighbours, by line only:** the place it's inside, its groups, records it names.
6. **Settled** and **the questions not yet answered**.
7. **The conversation:** the latest turns that fit.
8. **The author's words.**

When the window is short, cut in this order: neighbours, then older turns (Settled already holds what they decided), then the record's Named and Never sections, then the premise down to its first two sentences. A turn never goes out without Settled and the record's line.

## The prompts

Filled-in parts are in `{braces}`. Each goes out in the model family's own format, through the relay, like Chat's side generations.

**A helper turn (system):**
```
You are Errata, the Studio's helper on Inkwyrm. You help the author build {kind_noun} "{name}" for the world "{world}".
How you talk: dry, brief, specific. One question at a time. Praise only what earns it, in a few words. No lists unless asked.
Your job is to get concrete answers: what someone does, what a place smells of at night, who wants what. When an answer is vague, ask for the version you could see in a scene.
End a reply with the facts it settled, one per line, each starting "Settled: ". Settle only what the author said or agreed to.
Never write the record's text yourself in the chat; the author does that with Write.
```

**A field write (system; no Errata):**
```
You write one part of a record for a story world. Write only that part, in the world's voice, and nothing else: no heading, no preface, no quotes.
World: {world}, {genre}. {tone}
The rules for every word:
- Concrete and plain. Behaviour you could test in a scene, not adjectives.
- No metaphor, no stated feelings, no hedging, no "a testament to", "tapestry", "palpable".
- Names a reader can say on first sight. Plain words for things.
{species_rule_if_character}
The part: {field_title}, {field_shape}.
Examples of this part from the world:
{up_to_two_examples}
```
**User:** `Record: {kind} "{name}". {line}` + `Settled:` + `{settled}` + `Already written:` + `{other_sections}`.
**Prefill:** `{field_title}:\n`, so even a loose model starts in the right place; the site's existing prefill machinery does this.

`{field_shape}` comes from the field: *one sentence, under 25 words* for a line; *a comma-separated list of other names* for keys; *two to four sentences* for a Here section; *one entry per line, "Name: text"* for a set; *one line, what they are doing, never how they arrive* for a schedule event.

**A name call:**
```
Suggest eight names for a {kind_noun} in {world} ({genre}). {naming_rule}
Each on its own line, nothing else. Not any of these: {existing_names}.
The {kind_noun}: {line}. {settled}
```

**Records from the workshop:**
```
From the conversation, list up to {n} new records the world needs. For each, exactly:
NEW: {one of: character, place, group, item, lore, thread}
NAME: …
LINE: …
WHY: one sentence, what scene or rule needs it
Skip anything the world already has: {existing_lines_by_kind}
```

## Checking a draft before it's shown

- Strip prefaces (*Sure*, *Here is*), the field's own title, wrapping quotes and Markdown.
- Cut to the field's limit at a sentence end.
- Keys: split on commas, trim, drop the record's own name.
- Flag, not block, phrases from a short list of house-banned words, underlined in the draft.
- Workshop proposals: read `NEW:`/`NAME:`/`LINE:` blocks leniently (any case, any order, missing labels guessed from position). Anything unreadable shows as plain text with **Make a record from this**, which fills a new record's line.

## Default questions

Each question has its words, the field it mostly feeds, and on or off. Stored on the world (`world.questions`), seeded from the site's defaults, edited on World › About › Questions.

**Character** (on by default: the first five):
1. What do they do all day, and for whom? → Background
2. What would someone notice about them across a room? → Appearance
3. What do they do when they don't like what they're seeing? → Personality
4. How do they talk to a stranger, and how to someone they trust? → Speech
5. What do they want this month, and what's in the way? → Wants
6. Who would they lie for? → Background
7. What do they never do, even when it would help? → Personality

**Place:**
1. Who runs it, and what happens here? → Entry
2. What's here that you'd hear or smell before you saw it? → Atmosphere
3. Who's here at night that isn't here by day? → Atmosphere
4. What's the one thing a newcomer gets wrong here? → Entry

**Thread:** the five questions, worded for an author: *Why now?* *What would make this over?* *Who or what resists, and how?* *What does chasing it cost?* *What's different after, win or lose?*

**Form mode:** the same list as boxes, one per question, each with **Ask Errata** beside it for the ones the author is stuck on, and **Write all** at the end. Character Engine found a conversation is a longer way to type an answer the author already knows.

**Sharing:** copy a world's questions into another world; export and import them as a small file.

## A worked example (not fantasy)

World: *Low Water*, coastal crime, 1979, a ferry town in winter.

> **Errata:** What does she do with her hands when a car rolls up and she doesn't like it?
> **Author:** Keeps the ticket roll under her palm and doesn't tear one off. Makes them ask twice.
> **Errata:** Good. That's her. Who does she let through without a ticket?
> **Author:** Her brother's van, every Thursday. She doesn't look in the back.
> Settled: She makes drivers she doesn't like ask twice for a ticket.
> Settled: She waves her brother's van through every Thursday without a ticket and doesn't look in the back.

Drafts after **Write all empty**:

```json
{
  "id": "dee-harlow", "kind": "character", "name": "Dee Harlow", "keys": ["Dee", "the night clerk"],
  "line": "The night clerk in the ferry ticket booth",
  "sections": [
    { "id": "a", "title": "Appearance", "reach": "here", "keys": [], "when": null,
      "text": "Tall for the booth and stooped with it. Nicotine on two fingers, a man's wristwatch turned to the inside of her wrist." },
    { "id": "b", "title": "Personality", "reach": "here", "keys": [], "when": null,
      "text": "Keeps the ticket roll under her palm when she doesn't like a driver, and makes them ask twice. Doesn't look in a vehicle unless she's told to." },
    { "id": "c", "title": "Background", "reach": "named", "keys": [], "when": null,
      "text": "Waves her brother's van onto the Thursday night ferry without a ticket, and has never asked what it carries." }
  ]
}
```

## Weak models

| Window | What changes |
| --- | --- |
| 32,000 and up | Everything. The workshop sees every record's line. |
| 16,000 | Workshop lines only for the kinds being discussed; helper turns keep six exchanges. |
| 8,000 | Field writes read Settled and the record only. Helper turns keep three exchanges. The workshop proposes at most three records at a time. Examples from the world: one. |
| Xialong | Its own format, as Chat already sends it. Settled lines are asked for in the chat's own words ("End by listing what we settled"), and read leniently. |

If a model ignores the `Settled:` convention, nothing breaks: the author taps lines into Settled by hand.

## Phases

| Phase | What | Works alone because |
| --- | --- | --- |
| W1 | **Generate buttons:** **Draft** on every field; the field-write call; drafts under fields with Keep, Edit, Again, Drop; checking; **Name ideas**. | One tap gives an author something to react to. |
| W2 | **The helper** on a record: the chat, Settled, the default questions, **Write ▾**. Stored per record in this browser. | The conversation the owner asked for. |
| W3 | **Questions** on the world: editing, on and off, form mode, copying between worlds. | Every author's own template. |
| W4 | **The workshop** on the world's page, with record proposals as drafts. | The bigger setting, once records can be drafted well. |

## Risks and questions

1. **Where the chats live.** Proposed: in this browser, beside the world, not in the world file, so a shared world doesn't carry its author's working talk. Settled can be copied into Notes. Should a world's export offer to include them?
2. **Cost.** Write all empty on a character is six calls. Each shows what it sends and a token count before it goes, like In context now.
3. **Errata on small models.** A weak model may overplay her. Her lines are three; if a model can't hold back, a setting turns her off and the helper speaks plainly.
4. **Banned phrases** drift with model fashion. The list lives in one file and the flag is soft.
