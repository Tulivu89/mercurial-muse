# Bids

Nov 11, 2026 · @AmbiProp

Some questions go out to several models at once. The owner hands a brief to each one, and the answers come back here. This page says how a bid runs, so every topic is handled the same way.

## The folders

One folder per topic:

| File | What it is | Who writes it |
| --- | --- | --- |
| `brief.md` | The question, what exists, the constraints, and what to hand back. Written to be read without the repository. | Claude |
| `claude.md` | Claude's own proposal, written from scratch **before any bid is read**. Only for some topics; see below. | Claude |
| `<model>.md` | A bid, one file per model: `chatgpt.md`, `grok.md` and so on. | The owner uploads them |
| `decision.md` | Claude's informed proposal: what to build, taken from everything above, with credit and the calls made where the bids differ. | Claude |

Topics now: `maps/` (decided and approved, with a prototype; phases M1 to M3 built), `ui/` (decided and built) and `worldbuilding/` (bids in, decision to write).

## The steps

1. **Brief.** Claude writes `brief.md`, plus screenshots or examples a bidder needs.
2. **Claude's uninformed proposal, if it could win.** When Claude holds something the bidders don't (the code, the owner's earlier tools, what was tried and dropped), it writes `claude.md` at the same time as the brief and it is merged before the brief goes out. It is never revised afterwards, so it stays a fair comparison. When the question is mostly taste, or the bids are already in, Claude skips this step.
3. **Bids.** The owner gives `brief.md` (and its screenshots) to each model, and uploads each answer to the topic's folder as `<model>.md`.
4. **Decision.** Claude reads every bid and its own `claude.md`, then writes `decision.md`:
   - the plan in a few lines;
   - where the bids agree, taken as settled;
   - where they differ, a table with the call and the reason;
   - where `claude.md` was beaten, and by whom;
   - the data, the phases, and credit;
   - the questions left for the owner.
5. **The owner approves or vetoes.** Then the plan becomes a phase in the brief for the part it belongs to (`docs/studio-brief.md`, `docs/chat-brief.md`, or the adventure's list in `docs/praxis/charter.md`), and the roadmap says so.

## Where each topic stands

| Topic | Brief | Claude's own | Bids | Decision |
| --- | --- | --- | --- | --- |
| Maps | `maps/brief.md`, Nov 11 | None: the bids were in first | ChatGPT, DeepSeek, Gemini 3.8 Flash, Grok | `maps/decision.md`, Nov 11; revised three times on Nov 12 with the owner's answers (circles drawn from hex ground, travel from levels and the map from the start, roads on cells in place of routes, refining tools, lean icons, no fog yet), and `maps/prototype.html` to try it; approved Nov 12, M1 to M3 built the same day (Studio 0.9.0 to 0.11.0, adventure 0.27.0) |
| The look and layout of the site | `ui/brief.md`, Nov 11 | `ui/claude.md`, Nov 11 | ChatGPT, Gemini 3.8 Flash, Grok (with `mockups.html` and `frames/`) | `ui/decision.md`, Nov 12; built the same day at the owner's word (Studio 0.8.0, adventure 0.26.0, Chat 0.3.1) |
| Worldbuilding tools | `worldbuilding/brief.md`, Nov 11 | `worldbuilding/claude.md`, Nov 11 | ChatGPT, Gemini 3.8 | To write |
