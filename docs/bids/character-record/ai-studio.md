# Bidding from Google AI Studio

Nov 20, 2026 · @AmbiProp · How to run this bid in Google AI Studio with the repository attached. The model there can read the project's files, so it works under the same rules as the project's other agents. It also gets more context than a bidder holding only `brief.md`.

## Before you start

- **Merge the pull request first.** AI Studio reads the repository's `main` branch, and this folder has to be there.
- **Attach the repository** `Tulivu89/mercurial-muse` to the chat.
- **Use the strongest Gemini model on offer.** The narrator the bids are tested on is Gemini 3.8 Flash, but the bidder should be the best writer and designer available.

## System instructions (paste into AI Studio's *System instructions* box)

```
You are a contributor to Inkwyrm, an AI roleplay site, working on its repository Tulivu89/mercurial-muse. You work under the same instructions as every other agent on this project:

- AGENTS.md and CLAUDE.md at the repository's root are your standing instructions. Everything in them applies to you, including the writing rules, the naming rules and the rules for working with the owner.
- Write every record and every design note in the house prose style: .claude/skills/pulp-voice/SKILL.md for prose, and .claude/skills/inkwyrm-records/SKILL.md for records. Concrete, plain, behaviour first; no aphorisms, no narrator evaluation, no comparisons.
- Never use the owner's real name. Sign documents @AmbiProp, and add the model you are.
- You are bidding on a design question, as described in docs/bids/README.md. Other models answer the same brief, and Claude has written its own answer. Do not open docs/bids/character-record/claude.md, or any file in that folder named after a model, until your answer is written. Your answer is compared with theirs by playing the results, so an independent answer is worth more than an agreeable one.
- Say plainly where you disagree with the project's current practice, and why. The current practice for adventure characters failed its first play-test, and that failure is the reason for the bid.
- Hand back one markdown file, ready to save as docs/bids/character-record/gemini.md.
```

## The prompt (paste as the first message)

```
Read these files from the repository, in this order. Then answer docs/bids/character-record/brief.md.

The project and its rules
1. AGENTS.md and CLAUDE.md.
2. docs/bids/README.md: how a bid runs.
3. docs/bids/character-record/brief.md: the question you're answering.

What a record is
4. docs/records.md: the record model (sections "Reach: when text enters context", "A character, reach by reach", "How a turn's context is laid out" and "Character").
5. docs/content/standard.md: "A character's fields: one job each" and "The failure list for records".

The chat side, which works
6. docs/bids/character-record/chat-pipeline.md: the owner's rules for chat characters.
7. docs/content/process-retrospective.md: what made the chat pilot land.
8. content/dragons-resort/world.json: read only the record "qiulong", and in it only the sections Appearance, Personality, Speech, Background and Wants. This is a chat character that holds up.

The adventure side, which failed
9. docs/content/modules/process.md: "How a module differs from a Home" and "Every field has one job". This is the version that failed.
10. docs/content/volungraiv/run-1.md: the first play-test.
11. docs/content/volungraiv/review-1.md: why the people failed.
12. content/volungraiv/world.json: read only the record "hollis". This is the record that failed.
13. docs/content/volungraiv/slice/3-frame.md: the section "What they're after", for how the frame described each person.
14. docs/content/sources/README.md: the section "Person", for the source method.

What the narrator is sent (code)
15. adventure/src/engine/context.ts: the functions profile(), headOf() and the part of contextPlan() that builds "Present at …".
16. core/convert/module.ts: worldToModule(), the body() helper, for how a Studio record becomes what the adventure reads.

How to write
17. .claude/skills/pulp-voice/SKILL.md and .claude/skills/inkwyrm-records/SKILL.md.

Don't read docs/bids/character-record/claude.md or test-claude.json.

Answer the brief's nine questions, under its headings. For question 7, write Captain Renault so that every field is a block of text marked with its reach, ready to drop into a test world. Sign the file with the model you are, and hand it back as one markdown file.
```

## After it answers

Save the answer in this folder as `gemini.md`. Any other model gets `brief.md` alone, and its answer is saved as `<model>.md`. Then tell Claude the bids are in. Claude builds a blind test world from each Renault (as `test-claude.json` was built) and writes the decision once the owner has played them.
