# Worldbuilding tools: brief for proposals

Nov 11, 2026 · @AmbiProp · A hand-off for any model asked to propose how Inkwyrm helps people build worlds and characters

Inkwyrm is a roleplay site with three sides on one core: **Adventure** (a text adventure played by rules), **Chat** (conversations with characters who remember you) and **Studio** (where authors make the worlds and characters both of the others use). Players bring their own model key; there is no house model. Everything is stored in the player's browser.

The Studio can hold anything now. What it can't do is help. A blank record has many fields and few of them are obvious, and authors arrive with their own habits and templates. This page asks how the Studio should help someone build: by talking it through, by asking questions, and by writing drafts into fields.

The repository is `Tulivu89/mercurial-muse` if the owner shares it, but nothing here needs it.

## What the owner has decided

1. **The helper.** A chat beside a record. You talk the thing through, then pick a field and the helper writes it. The result lands as a **draft beside the field**, never over it, and the author keeps it, edits it, asks again or throws it away. **The model never writes a record on its own.**
2. **The workshop.** A chat at the level of the whole world, for the bigger setting: its premise, its history, what's missing. It can propose **new records** (a place a character mentions, a person a thread needs), each as a draft the author accepts or not.
3. **The voice is Errata, toned down.** Errata is the site's mascot, an ink dragon who reads over your shoulder and won't call it good until it is. The helper takes her name and a light touch of her manner, never her full persona. Assistant quality comes first.
4. **Questions, but flexible.** Everyone has their own templates. The tools can offer questions to answer, but an author must be able to change them, add their own or skip them.
5. **Generate buttons** are the helper with no conversation: one tap on a field writes a draft from the record and the world alone.

## The hard part: the player's own model

The helper runs on whatever model the player connected:
- a big model through an API with a long window;
- an open model through a provider, often with an 8,000 to 32,000 token window;
- NovelAI's Xialong, a chat-tuned model with about 28,000 tokens, that writes well and follows instructions loosely;
- a small local model.

The site already writes prompts in each model family's own format (GLM, ChatML, Qwen 3, Llama 3, Mistral, Gemma, DeepSeek). It has no tool calling it can rely on. A design that only works on a large, obedient, JSON-reliable model fails most players. Say what your design does on a weak model.

## The records

A world holds records of eight kinds: **character**, **place** (places nest inside places), **group** (species, family, faction, crew, profession), **item**, **lore**, **thread** (what's pushing the story), **scenario** (a starting situation) and **persona** (the player's own character).

Every record has:
- a **name** and **keys** (other names that bring it into the story);
- a **line**: who or what this is to a stranger, in one sentence;
- **sections**: titled blocks of text, each with a **reach** saying when it goes to the model:
  - *Always*: every turn, kept tiny;
  - *Here*: while the record is in the scene;
  - *Named*: when one of its keys is said;
  - *When*: while a shared condition holds (a time of day, a bond tier);
  - *Never*: notes for the author, and mechanics, which reach the model only as sentences the rules write;
- **sets**: one entry in use at a time (outfits, a scenario's rooms);
- and, by kind: groups it belongs to, the place it's inside, a schedule, greetings and example chats, rules (numbers), milestones.

New records start from **templates**: a character starts with Appearance, Personality and Speech (Here), and Background and Wants (Named); a thread with the five questions (pressure, objective, opposition, cost, consequence). Authors rename, add, remove and reorder sections freely.

A record in a world file:

```json
{
  "id": "morwen", "kind": "character", "name": "Morwen", "keys": [],
  "line": "The witch",
  "pronouns": "she/her", "groupIds": ["harefolk"],
  "sections": [
    { "id": "s1", "title": "Appearance", "reach": "here", "keys": [], "when": null,
      "text": "Lean and dun, fingers stained brown to the second knuckle, and she smells of peat smoke and bog myrtle." },
    { "id": "s2", "title": "Background", "reach": "named", "keys": [], "when": null,
      "text": "The fen's witch, who sells remedies through a hatch in her door and lives alone on her own island with a girl someone left at Bogwater's edge." }
  ],
  "sets": [], "notes": ""
}
```

## The house writing rules

Every word the helper drafts goes into a record, and the narrator copies the records' voice. So the helper writes by these rules, and a proposal must say how it holds a model to them:

- Concrete and plain. No abstract metaphor, no stated emotion, no hedging, no AI patterns (*a testament to*, *tapestry*, *palpable*, rule-of-three flourishes).
- Behaviour you could test in a scene, not adjectives. *Sells first and asks nothing* over *pragmatic and guarded*.
- Names a reader can say on first sight. No glossary words: *dock*, not *staithe*.
- A character shows their species in one or two traits and a colouring, never a restated species entry.
- A place or person exists only if a scene or a rule uses it. At most four named people in a place at once.
- Any genre: nothing may assume swords or a medieval world.

## What exists that a proposal can lean on

- **In context now:** the Studio can already show exactly what a moment would send the model, with a token count. The helper can show what it is about to send the same way.
- **Side generations** in Chat: short, budgeted calls the player starts, each showing what it sends (a diary entry, a plan).
- **Earlier tools of the owner's:**
  - Character Engine's **Build**: one conversation per thing being built; a *seed* pass that writes each field from the conversation; names as a separate call, with the world's existing names listed so they don't repeat; a *plan* stage that reads the conversation into a list of records to make, each ticked or not; and a world stage whose questions are an editable list the author can switch on and off.
  - Orbis's **Coda**: an assistant with three modes (guide, sort, inspect) that returned *proposals* with a confidence and a reason, and could only apply them with the user's explicit approval.

## Questions a proposal must answer

1. **Where the helper and the workshop live** on a phone (390 px) and a wide screen.
2. **What one helper turn sends:** which parts of the record and world, in what order, at what length, and what's cut first when the window is small.
3. **Writing a field:** the call that turns the conversation into one field's draft. Its prompt, how it knows the field's shape (a sentence, a section, a list of keys, a set's entries), and how the output is checked before it's shown.
4. **New records from the workshop:** how the model proposes them, and how a weak model's messy answer still becomes usable drafts.
5. **Questions and templates:** what the default questions are for each kind, where an author edits them, and how they share them between worlds.
6. **Errata's light touch:** the actual words that set her voice in the helper, and how you keep it from leaking into the drafts.
7. **Weak models:** what still works on an 8,000-token local model, and what's switched off.
8. **What it won't do.**

## What to hand back

One document, plain words, in this order:

1. **The recommendation in five lines.**
2. **The helper and the workshop:** screens at 390 and 1280 (HTML, SVG or careful ASCII), and the flow of one session from blank record to kept drafts.
3. **The prompts,** written out in full: a helper turn, a field write, a name call, a new-record proposal. Mark what's filled in.
4. **The default questions** for a character, a place and a thread, and how an author changes them.
5. **A worked example** in a genre that isn't fantasy: a short conversation, then the drafts it produces as record JSON in the shape above.
6. **Weak models:** what changes.
7. **Phases,** each shippable alone.
8. **Risks and open questions** for the owner.

Skip anything that only repeats this page.

## Where this goes

Into `docs/bids/worldbuilding/` as `<model>.md`. Claude wrote its own proposal (`claude.md`) before any bid was read, and will write `decision.md` from all of them (`docs/bids/README.md`).
