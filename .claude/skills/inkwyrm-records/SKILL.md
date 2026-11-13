---
name: inkwyrm-records
description: Writing Inkwyrm's records — characters, places, groups, items, lore, threads, scenarios, worlds — as Studio world files for flagship content, and framing or filling a village or region from a gold set. Use for any session that drafts, revises, frames or reviews records in this repository, including seeds, frames, fills and the dragon's resort pilot. Not for story prose on its own (that's pulp-voice), and not for code.
---

# Inkwyrm records

Records are what the narrator and the chat partner read every turn, and they copy the records' voice. A slop phrase in a record becomes a slop habit in play; a concrete behaviour becomes a scene. Weak models (GLM-4.6 and Xialong, at about 28,000 tokens) lean on the records hardest, so write for them.

**Read first, once per session:** `docs/content/standard.md` (the standard: measured costs, tiers, the failure list, seed–frame–fill), then pulp-voice's `references/anti-patterns.md`. Greetings and example chats are prose: they follow pulp-voice in full. Everything else here is reference text, and stricter.

**Calibration overrides this skill.** The owner's own files win wherever they disagree: `docs/bids/content/mo-03-style.md` (the failure list and how to build from a source), the gold set for the world in hand, and any Keep entries the owner has logged.

## Before writing a person

Settle these first, in one line each. A frame is exactly this list, so a session that frames a village writes only these.

- **Name**: one a reader can say on first sight, and one that doesn't pull a meaning you don't want.
- **Line**: who they are to a stranger, in one sentence of 25 words or fewer. In a big world this is all most people send, so it carries the job, the place and the one thing that makes you look twice.
- **Job**: what they do all day, where, with whom.
- **Want**, and its **pattern**: how the want runs into trouble (contradiction, wantneed, defense, ruleset, appetite, mask, collateral). No more than two people in a cast on one pattern.
- **Aside**: one part of life the want doesn't touch.
- **Ties**: two or three other people, one line each that both of them could use.
- **Home and work**: places in the world. A schedule only for people a thread turns on.

## Writing the sections

A character uses the Studio's default sections. Each answers one question the model asks while playing them, so every fact lives in exactly one. The full table, with what each field never holds, is in the standard under *A character's fields*; this is the working version.

| Section | Reach | Answers | Holds |
| --- | --- | --- | --- |
| Appearance | Here | What would someone see, and what does the body do? | Lines, weight and movement; a colouring; their kind in one or two traits; involuntary tells. Closes on a feature no one else in the cast closes on. No clothing, no voice. |
| Personality | Here | How does this character respond? | Responses the model can play next turn: *when someone does this, they do that.* What they go after in an exchange; what they won't do. No posture, no wording habits, no history, no creed. The test: what do they do at a noodle stall, with no plot in the scene? |
| Speech | Here | How do the words come out? | The voice's sound, rhythm, sentence length, register, words used and avoided, habits, and how they shift with mood or company. No sample lines; those are example chats. |
| Background | Named | What comes up when someone asks about their past? | Only what a scene could bring up. A past that explains a response stays out: the response is in Personality. |
| Wants | Named | What are they working on, and what's in the way? | The current goal and its obstacle. |
| Hooks | Named, each with its own keys | What do they go long about? | Each stands alone, because it arrives alone. Never repeats Here. |
| When sections | When | What changes under this condition? | Only what changes. |
| Outfits | A set | What are they wearing? | Fit, coverage, what the clothes show and hide. No pose. |

If a fact seems to fit two sections, it's usually two facts. Ask which question the model would be answering when it needs it, and put it there.

A place: Entry (what it is and who's there) and Atmosphere (what you hear and smell now), both Here, each a sentence or two. A group: Entry, Named, holding what its members share so they don't repeat it. Leave out any section a record doesn't need.

Budgets are in the standard and are provisional. If a record is over, cut what a scene wouldn't use before cutting what it would.

## Checking your own draft

Run the failure list from the standard on every line before handing anything over. Reference text uses **no comparisons at all**. The quick scan:

1. A named feeling or a trait word with no act under it.
2. A comparison (*like*, *as if*), or a slop word (*testament*, *tapestry*, *palpable*).
3. Contrast framing (*not X but Y*), hedging (*perhaps*, *seems*), litotes (*not unkind*).
4. Significance by announcement (*never once*, *nobody has ever*), a verdict closer, an aphorism.
5. Stock composure (*unhurried*, *goes still*), stock senses (*woodsmoke*, *ozone*), stock names.
6. A line that could be written for three others in the cast.

Then run the checker on the file: `npm run content:check -- <file>`. It flags what a pattern can find. It isn't a verdict, and a clean report isn't approval.

## The file

Write one Studio world file (`studio-world/1`). Only these fields are needed; everything else has a default.

```json
{
  "format": "studio-world/1", "id": "teahouse", "name": "Teahouse Before Frost",
  "premise": "…", "genre": "…", "tone": "…",
  "conditions": [{ "id": "close", "label": "Close" }],
  "records": [
    { "id": "the-teahouse", "kind": "place", "name": "The Teahouse", "line": "…", "parentId": null,
      "sections": [{ "id": "th-entry", "title": "Entry", "reach": "here", "text": "…" }] },
    { "id": "qiulong", "kind": "character", "name": "Qiulong", "line": "…", "pronouns": "she/her", "keys": [],
      "tags": ["lead"], "groupIds": ["dragon"],
      "sections": [
        { "id": "q-personality", "title": "Personality", "reach": "here", "text": "…" },
        { "id": "q-library", "title": "Hoard: Library", "reach": "named", "keys": ["book", "library"], "text": "…" },
        { "id": "q-cabinet", "title": "The Cabinet", "reach": "when", "when": "close", "keys": ["cabinet"], "text": "…" }
      ],
      "greetings": [{ "id": "q-g1", "text": "…", "emotion": "smug" }],
      "examples": [{ "id": "q-e1", "name": "A Line", "messages": [
        { "fromCharacter": false, "text": "…" }, { "fromCharacter": true, "text": "…", "emotion": "laughing" }] }] }
  ]
}
```

- Ids are short, lowercase and stable; a record's sections are prefixed with its id.
- Single newlines inside text.
- A lead is tagged `lead`; a person isn't.
- Leave rules out unless the owner asks: a record keeps only the rules its author changed, and the standard ruleset covers the rest.

## Handing it over

Give the owner the file path, what the checker said, and only the judgement calls: names you weren't sure of, any want that converges with another, anything you left out and why. Don't summarise what the records say; the owner reads them.
