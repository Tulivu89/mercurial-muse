# Writer: sources to revisit

Nov 18, 2026 · @AmbiProp

What was read for `docs/writer/research.md`, and what to go back to before a Writer brief or any build. Read means the repository or official docs were read in a session. Reviewed means only third-party reviews were read, so the details still need checking.

## Open source (read for ideas; no code copied)

| Source | Licence | Read at | What it gave | Go back for |
| --- | --- | --- | --- | --- |
| [tealios/errata](https://github.com/tealios/errata) | GPL-2.0 | `4f44941`, Nov 5 2026 | Prewriter brief, librarian (summary, mentions, contradictions, suggestions, timeline, directions), summary compaction, timelines as branches, per-role models | `docs/context-blocks.md` (prompt blocks the writer can edit), `docs/character-chat.md`, `src/server/librarian/` prompts, the Story Wizard |
| [vegu-ai/talemate](https://github.com/vegu-ai/talemate) | AGPL-3.0 | `7db12b0`, Oct 27 2026 | Agents per job, director planning (outline, critique, beats), world state proposing character changes, layered history and its limits | `docs/user-guide/agents/director/planning.md`, `agents/editor/revisions.md`, `tracking-a-state.md` |
| [StableLlamaAI/AugmentedQuill](https://github.com/StableLlamaAI/AugmentedQuill) | GPL-3.0 | `50d3168`, Nov 7 2026 | Writing, Editing and Chat roles; Sourcebook with Auto relevance and synonyms; scenes with causes, dates and places; relations scoped to scenes | `docs/user_manual/12_scenes_and_annotations.md` (Convergence Map, annotations), `07_ai_chat_assistant.md`, its diff review |
| [ilrein/openwrite](https://github.com/ilrein/openwrite) | AGPL-3.0 | `b029dcf`, Aug 18 2026 | `FEATURES.md`, a feature list written against Novelcrafter (June 2026); typed links between story cards | The docs site (ilrein.github.io) was blocked by this session's network; the same docs are in `apps/docs/guide/` |
| [lmg-anon/mikupad](https://github.com/lmg-anon/mikupad) | not checked | not read | — | Raw continue-the-text writing in one HTML file; what control-minded writers expect |
| Arboris-Novel (`t59688/arboris-novel`) | not checked | not read | — | About 1.2k stars; the most-starred of the smaller apps |
| Novellis, NovelWriter (NovWr), Inkline, Wordcraft (Google PAIR) | not checked | not read | — | Only if a question comes up they might answer |

## Paid services

| Source | Status | What it gave | Go back for |
| --- | --- | --- | --- |
| Sudowrite | Reviewed | Story Bible in sections, Import Novel builds a bible, series folders, story chat, Muse model, writes explicit content, routes across several providers | Official docs and changelog; whether "My Voice" (style training) is real; current prices |
| Novelcrafter | Reviewed, plus OpenWrite's list | Codex with mentions, your own key or OpenRouter, $4–20 a month; entries entered by hand | The help pages for Codex, progressions and prompts |
| DreamGen | Official docs | A scenario per story, each session's own copy; "what happens" kept apart from "how to write it"; Lucid models with a writer role, the small one open-weight | Its model settings guide, for how it steers |
| NovelAI | Known to the owner | Lorebooks, the GLM-4.6 finetune | Nothing as a service |

Links: [Sudowrite: how it works](https://sudowrite.com/blog/how-sudowrite-works/) · [Sudowrite review](https://ucstrategies.com/news/sudowrite-review-i-tested-the-22-month-ai-against-chatgpt-across-70000-words/) · [Kindlepreneur on Sudowrite](https://kindlepreneur.com/sudowrite-review) · [Novelcrafter on OpenRouter](https://openrouter.ai/works-with-openrouter/novelcrafter) · [Novelcrafter review](https://www.jenova.ai/en/resources/novelcrafter) · [DreamGen: writing a story](https://v2.dreamgen.com/docs/how-to-write-story) · [DreamGen: scenario editor](https://v2.dreamgen.com/docs/scenario-editor) · [Lucid on Hugging Face](https://huggingface.co/dreamgen/lucid-v1-nemo)

## Measuring

| Source | Status | Go back for |
| --- | --- | --- |
| [EQ-Bench longform](https://github.com/EQ-bench/longform-writing-bench) | Reviewed | The rubric and the slop list, as a base for a writing lab |
| [EQ-Bench creative writing](https://github.com/EQ-bench/creative-writing-bench) | Reviewed | The short-form rubric |

## Papers named in the other chat (not checked)

All of these came from another chat's summary. Read each one before it is cited in a plan.

| Paper | Claim made for it |
| --- | --- |
| DOME (dynamic hierarchical outlining with memory) | Outlining fused with writing improves plot; a temporal knowledge graph catches conflicts |
| StoryWriter | A planning agent decides which events go in which chapter |
| CreAgentive | A story prototype as a knowledge graph; under $1 per 100 chapters |
| POLARIS-9B | A 9B writer on par with a 27B one in blind human tests |
| PlotTwist | Small models plot as well as far larger ones when the work is split up |
| MemAGent | Generate, reflect, revise: large gains in coherence |
| LoreWeave, WillWrite | Extraction into a graph as you write; retrieval over world guides |

## Still to find

- What writers say they miss in Sudowrite and Novelcrafter (forums, not marketing).
- Which planning models refuse or soften mature outlines (our own test).
- How Sudowrite and Novelcrafter price models in, against the owner's plan of models plus the service (`docs/value.md`).
