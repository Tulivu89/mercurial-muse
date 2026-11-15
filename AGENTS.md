# Inkwyrm: notes for coding agents

This file is for any coding agent opened on this repository (Codex, Jules, Gemini, Claude Code and others). The project's own rules are in `CLAUDE.md`, and they apply to every agent, not only Claude: read it before changing anything. The adventure's code rules are in `adventure/AGENTS.md`.

## Setup

- Node 22. One install at the root: `npm ci` (npm workspaces).
- Checks, from the root: `npm test`, `npm run lint`, `npm run build`. CI runs the same three.

## Testing chat replies (the chat lab)

Most sessions opened from another app are here to test, not to change code. How it works is in `docs/testing/chat-lab.md`. The short version:

1. `npm ci`
2. **A test the owner sent:** `npm run chat:lab -- <pack>.json`, for a pack saved from Chat (Under the hood › Sent › Save for a test › Everything).
   **The standing suite:** `npm run chat:lab -- suite`. It runs the dragon's resort's cases from `content/dragons-resort/lab-suite.json`, and needs no pack.
3. Follow the `README.md` the command writes. Play the model **blind**: for each variant, read only its `context.md` and write the reply as the model would. Don't read the world file, other variants or `original.md` until every reply is written.
4. `npm run chat:lab -- score <folder>`, then write `findings.md`.
5. Hand back `findings.md` and `scores.md` as files. Name the model you are in `findings.md`.

**Don't commit** `lab/` or any test pack. Packs hold the owner's real chats; `lab/` is gitignored for that reason.

## Working with the owner

- Never use the owner's real name. Sign docs `@AmbiProp`.
- The owner doesn't use git. Changes go on a branch with a pull request into `main`, and the owner gets plain steps to merge.
- Abernys and Bogwater are retired: don't develop or suggest them (`docs/abernys/README.md`).
