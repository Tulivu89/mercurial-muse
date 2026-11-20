# Writer: research

Nov 18, 2026 · @AmbiProp · Planning only. Nothing here is scheduled or built.

## The idea

A fourth way into the same records, beside the adventure, Chat and the Studio: a place to write stories, mature ones included. The owner's sketch:

- The records are the story bible. Characters, places and lore are read when a scene needs them, by the reach they already have.
- Several models, each on the job it does best (`docs/model-jobs.md`): a strong model plans, the writer's favourite writes the prose, small models summarise, extract and check.
- A chat for workshopping the story, as Errata workshops a record in the Studio.

What sets it apart from the writing apps below is the rest of the site. A character the writer has chatted with for weeks can star in a story. A chat can become a chapter draft. Schedules and places say where someone is at night on day three. Threads with milestones can be the outline.

Two changes to the plan another chat proposed, argued in the planning talk on Nov 18:

- **Prose on Voice, not on a small model.** In mature fiction the prose is what people pay for. Most of the saving comes from not sending the whole manuscript every time, not from a weaker writer.
- **No embedding search over the bible.** The records already say when they're needed. Embedding search is only for the manuscript, to find the earlier scene a new one echoes.

## What the apps showed

Four open-source apps were read from their repositories, and three paid ones from reviews (`docs/writer/sources.md`). They agree on more than they differ.

### Every serious app splits the models by job

| App | The jobs |
| --- | --- |
| AugmentedQuill | **Writing** (the only model that writes new prose), **Editing** (summaries and fixes, adds no plot), **Chat** (the assistant that runs the project and hands prose to Writing). Each has a colour in the interface. |
| Errata (tealios) | A model per role: generation, librarian, character chat, directions, each agent. Falls back down a chain when one fails. |
| Talemate | A client per agent: narrator, director, editor, summarizer, world state, memory. |
| Sudowrite | Routes requests across Claude, OpenAI, open models and its own Muse. |

This is the same split as Voice, Side and Build. AugmentedQuill's rule is worth copying word for word: **only the writing model writes new story prose.** Its writing model also starts every request cold and knows only what the prompt holds, so the context is the whole of its memory.

### A brief before the prose (Errata's prewriter)

Errata has two modes. In the usual one the writer sees everything. In prewriter mode a planning model reads the full context and writes a short brief. The writer then gets only that brief, the recent prose and the guidelines marked always-on. Its stated reasons: a smaller window for the writer, and character voices and scene details boiled down, not pasted raw. It's an option, not the default.

This is the scene briefer from the other chat's pipeline, already built and in use. It also answers a mature-content worry: the planner sees the canon and the brief, and the prose model, which is the one that has to be permissive, writes from the brief.

### A librarian after each passage (Errata)

After every passage, Errata's librarian reads it once and records:

- a summary line for the rolling story summary;
- events, state changes and open threads;
- which characters were mentioned, with the words that mentioned them;
- contradictions, each naming the passages that disagree;
- **suggestions**: a new character or knowledge entry, or a change to one, which the writer accepts or dismisses;
- timeline events (before, during or after this passage);
- direction cards: a few "what happens next" choices.

The summary is applied in order and never skips a passage that hasn't been read yet. When it passes 12,000 characters it is compressed to 9,000, and if that fails the newest tail is kept. Chapter summaries can sit between the rolling summary and the recent prose.

Chat 0.8 already does the summary part, as chapters written once when the window moves (`docs/reviews/memory/decision.md`). The suggestions with accept or dismiss are the part to take: they are the "extract, then the writer confirms" step, and they stop the bible going stale without the model editing canon by itself. Talemate's world-state agent does the same for characters: it **proposes** changes to a character's description as the story moves.

### Choosing what goes in

| App | How |
| --- | --- |
| Novelcrafter | Mentions: an entry goes in when its name or an alias is in the text. Per entry: always, never or auto. |
| AugmentedQuill | Checkboxes per entry, or **Auto**, where a background model ticks the entries the chapter needs. Synonyms per entry. |
| Errata | Sticky fragments always go; the rest by shortlist and tool lookups during writing. |
| Talemate | Embeddings (ChromaDB). Its own docs say the deeper retrieval is "hit and miss" and can make the writing worse. |

Our reach (Always, Here, Named, When, Never) and keys already cover all of this except Auto. Talemate's warning backs the decision to keep embeddings out of the bible.

### Who knows what, and when

AugmentedQuill scopes a relation between two entries to scenes: "Elena knows Marcus" starts at one scene and ends at another. Scenes also carry a date, a place, the characters in them and what caused them. This is the hard-constraint layer the other chat wanted a knowledge graph for, done as fields on scenes. In our terms it is states and journal facts with a point in the story where they start, which the rules already know how to hold.

### Branches

Errata's timelines copy the whole story (prose, entries, librarian state) at a passage, and each copy goes its own way. DreamGen gives each writing session its own copy of the scenario to edit. Both are the canon-and-save split: the bible is canon, and a story keeps its own changes.

### Planning needs a big model

Talemate's director plans a scene in beats, critiques its own outline, then writes each beat. Its docs recommend a 100B+ model with reasoning for it. That supports a strong model for planning and briefs, used rarely.

### OpenWrite

Pitched as Sudowrite and Novelcrafter in one, it is a small app so far: a story map that expands a premise into acts, chapters and scenes as linked cards; a basic codex; a chat that knows the title, genre and characters; your own keys. Its links between cards are typed (story flow, character arc, setting, theme, plot thread), and generation reads what a card is linked to.

Its most useful file is `FEATURES.md`, a checklist written against Novelcrafter in June 2026. It's the closest thing we have to a feature list of Novelcrafter written by someone trying to replace it:

- **Manuscript:** chapters and scenes, a beat per scene ("what happens here") that a Generate button turns into prose, a plan view to drag acts, chapters and scenes.
- **In the editor:** select text to rewrite, expand, shorten or describe more, with a custom prompt and a diff to accept.
- **Chat:** threads kept per project; context chosen as this scene, the outline or the whole novel; turn a chat answer into a codex entry or a beat.
- **Codex:** mentions highlighted in the prose, aliases, custom fields and tags, always, never or auto per entry, detect characters in a scene, one-press scene summaries, **progressions** (how an entry changes across the story), relations, where each entry appears.
- **Prompts:** a library with variables, a model per task, a preview before sending.
- **Revision:** snapshots per scene with restore, marks for plot holes on a timeline, which characters appear where.
- **Organisation:** series sharing one codex, point of view and tense per scene, templates such as three-act, a scrap pile for cut scenes.

## What we already have

| Writer needs | Inkwyrm has |
| --- | --- |
| A story bible read when needed | Records with reach and keys; the "In context now" panel |
| Models by job | Voice, Side, Build (`docs/model-jobs.md`) |
| Summaries of what left the window | Chapters, folding, pins (Chat 0.8) |
| Memory across stories | Memory between chats (Chat 0.8.1) |
| What was sent | Under the hood; the chat lab |
| A workshop chat | Errata in the Studio, with Settled picks |
| Who is where, when | Schedules, places, the clock, maps |
| Hard facts the model can't move | States and rules (`core/rules/`) |
| An outline | Threads with milestones |
| Import | Cards, lorebooks, SillyTavern chats |

What we would add: a manuscript (chapters and scenes with beats), the brief before the prose, the librarian's suggestions with accept or dismiss, contradictions, progressions, branches of a story, and an editor with selection actions.

## Things to settle before a brief

1. **The name clash.** A writing app called Errata (`tealios/errata`) exists, close in purpose to ours. Our Errata is the mascot and the Studio's helper. Worth weighing before Errata is more public.
2. **Licences.** OpenWrite and Talemate are AGPL-3.0, AugmentedQuill GPL-3.0, Errata GPL-2.0. We read them for ideas and copy no code.
3. **Planners and mature content.** Which planning models will outline dark or explicit material, and does a planner quietly soften the brief it hands the prose model? Nobody publishes this. It needs our own test, in the chat lab's way.
4. **Measuring.** EQ-Bench's longform test (about 8,000 words over eight chapters, judged by a model, with a slop score) is a starting point for a writing lab. One commentator says its scores don't track good writing well, so it would be a signal, not a verdict.
5. **Where it sits.** Behind roadmap step 6 unless the owner moves it. The smallest version: one manuscript, "write the next scene" on Voice with records by reach, and a mark on each paragraph saying which model wrote it.
