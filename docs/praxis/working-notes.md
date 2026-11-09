# Praxis — Working notes for the next session

Nov 6, 2026 · @AmbiProp

Read *Praxis — Charter* first: it holds every decision and the progress table. This page is how the work gets done.

## Where things stand

- Praxis now lives in `Tulivu89/mercurial-muse`, under `praxis/`, at 0.21.0 (Bogwater, and narration from any OpenAI-compatible provider). `orbis/` and `ember/` are reference copies of those apps, to trim; the root README lists what belongs to the old Howling Whispers deployment. The HW-Praxis repository and its server are no longer where work lands. *Praxis — Growth, Challenge and Economy* is the design behind 0.17 to 0.19. Its odds came from a scratch script over `src/engine/dice.ts` (exact, every face), so rerun one rather than estimating.
- The test module is now *Abernys: Bogwater* (`modules/abernys-bogwater.json`, the first button on the start screen). Its design is the Claude Doc *Praxis — Bogwater Module Plan*: the Plan tab for rules and phases, the Bogwater tab for every place, person, number and reason. The JSON is the source; the script that first generated it was scratch, so edit the JSON and keep the doc in step. Port Covenant stays until the coverage audit, then retires.
- `tests/engine-bogwater.test.ts` includes a census: forty days of schedules at the four times of day, failing on any stop that isn't a real place or any place with more than four people. A new schedule has to pass it.
- The house format: speech plain, with no quotation marks; *narration and action* in asterisks; (thoughts) in parentheses; [notes] in square brackets, outside the story. Don't bring back quotes or bracketed thoughts.
- Compliance is measured, not guessed: Settings › What the narrator was sent › "Try this turn 5 more times" lists every reply, and Copy all / Save as a file exports them with the context. Ask the owner for that file when a ruling is ignored.
- The evaluator is the last piece of v0.3. It waits on the owner's generation test results (Settings › Testing › Generation test, then **Copy the results**). It should also let free text propose a check rather than the player always choosing one.
- Still open from earlier releases: transcript branches; NPC opposition dice (every check is Average until characters carry approach ratings).
- The layout: one scroll, the story, the prompt at its end, the menu under the prompt. No header bar and no menu button; the owner was explicit about this. The design canvas (artifact *Praxis play screen*) still shows the older overlay menu; the app is the source of truth.

## Working with the owner

- Worldbuilding rules from the Bogwater review: names a reader can say on first sight (Welsh is inspiration, not spelling); no glossary words (dock, not staithe); a person shows their species in one or two traits and a colouring; a place or person exists only if a scene or a rule uses it; at most four people in a place at once. Schedules in times of day only (morning from 6, afternoon from 12, evening from 18, night from 22): one daily round for most people, a few exceptions for the people threads turn on. A festival fills a day; a service a quarter or half. Known stories (The Godfather, Les Misérables, Skyrim's towns on UESP) can model dynamics, never names or details.
- Pulp-voice holds for every record field.

- The owner has repository access only and does not use git. Give them plain steps: open the pull request, **Merge pull request**, **Confirm merge**. If GitHub ever offers to resolve conflicts in the browser, they should stop and say so.
- The plan past the first server is `docs/roadmap.md`: brand, the shared core, the hub, the chat side.
- Sign project docs @AmbiProp. Never use their real name.
- Codespaces have not started for them on their phone (stuck on "Setting up your codespace"). Testing so far is CI plus Claude's headless browser runs; real narration needs their key in their own browser. They often work from a phone only.
- Deploying: on the owner's Hetzner server (Ubuntu 24.04, live since Nov 7, 2026 at `135-181-31-213.sslip.io`), `deploy/setup-server.sh` sets everything up once and `bash /srv/muse/deploy/deploy.sh` updates it, as the `praxis` account. Until there is a domain the address is `<ip>.sslip.io`. Setup can be done from a phone: `deploy/cloud-config.yaml` goes in Hetzner's Cloud config box, and a page at `http://<ip>` gives the deploy key and shows progress. Updates still need a terminal: a PC, or Termius on the phone, as root with a password (the server has no SSH key). Plan for a proof of concept: Ubuntu 24.04 on the cheapest 4 GB shared plan (CX23, or CAX11 on Arm) in Germany or Finland, public IPv4 kept (GitHub has no IPv6), no volumes, backups or Hetzner firewall. Claude cannot reach servers from its sandbox.
- Branding is undecided; Mercurial Muse is a working name. Players bring their own model keys until a partner provides models.

## Repository mechanics

- Claude can push only to `claude/*` branches. Open pull requests with the REST API, not `gh pr create`: `gh api repos/Tulivu89/mercurial-muse/pulls -f title=… -f head=<branch> -f base=main -F body=@file`.
- After pushing a new branch, set its upstream: `git config --add remote.origin.fetch +refs/heads/<b>:refs/remotes/origin/<b>; git fetch; git branch --set-upstream-to=origin/<b>`.
- CI: `gh api repos/Tulivu89/mercurial-muse/commits/<sha>/check-runs` (one workflow per part: Praxis, Orbis, Ember, each running only when its folder changes). Job logs are not reachable through the proxy; read failures from `check-runs/<id>/annotations`.
- CI runs `npm test`, `npm run lint`, `npm run build` and a production serve check. The npm registry is blocked in the sandbox, so new dependencies cannot be added (the lockfile cannot be updated).

## Checking locally without npm

- Tests: `node --import tsx --test tests/*.test.ts`, with a small Vitest stand-in in `/home/claude/node_modules/vitest` and zod 4 from a shim over `/opt/npm-tools/node_modules/zod/v4`.
- Types: `tsc` from `/opt/npm-tools` against a config that maps `zod` to the v4 typings, with React type stubs in `/home/claude/node_modules/react`. The stubs are loose; CI's real React 18 types caught a `RefObject` mismatch once.
- Browser: bundle `src/main.tsx` with esbuild from `/opt/npm-tools` (aliasing react, react-dom and zod), point a copy of `index.html` at the bundle, then drive it with Playwright (Chromium is installed) at 375 px with `/api/novelai/*` stubbed. Google Fonts do not load in the sandbox.
- These live in the session's scratchpad and will need recreating in a new session.
- **In the Oct 17 session the registry was unreachable and `node_modules` was empty.** What worked:
  - **Tests:** a Vitest stand-in at `node_modules/vitest/index.js` (describe, it, expect with the matchers the engine tests use). zod 4 came from a shim in `node_modules/zod` that re-exports `/opt/npm-tools/node_modules/zod/v4`. Each test file ran with `/opt/npm-tools/node_modules/.bin/tsx tests/<file>`.
  - **Engine types:** `tsc` 6 from `/opt/npm-tools`, with a config that extends `tsconfig.app.json`, sets `types: []` and `ignoreDeprecations: "6.0"`, maps `zod` to `/opt/npm-tools/node_modules/zod/v4/index.d.cts`, and includes only `src/engine`. The interface types are checked by CI only.
  - **Browser:** esbuild from `/opt/npm-tools`, then `python3 -m http.server` started in the same command as the Playwright script, because a server left running between commands dies. Bundles need `--define:__PRAXIS_VERSION__='"<version>"'`.
- The Oct 18 session was the same: no registry, the same shims, each test file run with tsx.

## Engine rules worth remembering

- Narration lives in `src/narration/` (no DOM, no Node), shared by the server's relay (`server/narration-relay.ts`) and the browser (`src/ui/narration.ts`): `formats.ts` writes one prompt per model family and guesses the family from the name; `providers.ts` lists the providers the relay may reach, plus `PRAXIS_PROVIDERS`; `upstream.ts` builds the provider's body and reads the reply. Its relative imports end in `.js` because the server compiles them with NodeNext. A player's own server ("custom") never goes through the relay.
- NovelAI's browser settings keep their old storage names (`praxis.novelai.token`, `.model`, `.mode`) so existing players stay connected.

- A schedule rule can carry `when.state`: `stateId`, `atLeast` and `atMost`, and `characterId`, which defaults to the person and can be the player or `"world"`. `whereabouts` and `scheduledPositions` take a state test built by `stateTestFor(module, save.values)`; `followSchedules` builds its own. Scene action conditions and effects can name `characterId: "world"` for a world-scope state.
- A countdown state set high stays put: Bogwater cures Lowri by setting Rabitis to 1000, inside its "well" band. The calendar's `monthDay` counts from 0, so the 14th is 13.

- The engine is pure: ids, the clock and randomness come in as arguments. Rules live in `src/engine` only.
- The model never moves state. Journal suggestions are text the player keeps; checks are settled by `settleCheck` with an injected `random`.
- Context is laid out by rate of change and the transcript cuts in whole pieces so the prefix stays reusable. Don't make the transcript budget slide with every turn.
- Each thing has one home in the prompt. Messages: a fixed system message (rules, format example, world); a lorebook system message (journal, you, place, dramatis personae, relationships, key-activated lore); the transcript (past outcomes kept beside their words); your words alone; then `plan.prefill`, which the relay puts after the empty think block. `replyFrom` puts the opening `*` back on the reply. Key activation scans the scene's words, replies and outcomes only, never the notes.
- Labels are "words: what they mean"; the screen shows the words (`band().short`), the narrator both. State words for other people go in `npcLabels`; a terminal's `note` is about "them" and its `playerNote` (or the note turned to "you") is for the player. Owner names in facts are made definite ("The garrison guard").
- Local records are laid over the module by `playable(module, save.local)`; engine functions call it themselves. Bonds the player starts are local records of type `bond`.
- Schedules run whenever a turn moves the clock (`passTime` in turns.ts) and on a hand-set clock. Relationship states are owned by `pairKey(a, b)`.
- Schedules hold for people with you on your own turns (`followSchedules(..., { hold: true })`); travel, wait, rest and a hand-set clock release them. `save.held` and `save.following` are part of the world state, so undo restores them.
- The prefill is held to a shape by a test: "Understood. I will:", then one clean sentence a line ("Show that …" for each outcome line, "Remember that …" for each condition), each ending in a full stop with at most one colon, then the mark and `*`. Outcomes are built one sentence a line (`directive` joined with newlines). Condition labels are sentences with |they| |them| |their| for the person's pronouns; the screen shows the words before the first comma, colon or full stop.
- Scene actions are the authored way to do a bargain until there is an economy: `present` (who must be here), `when[].characterId` and `effects[].characterId` (another person's state). What an action changes is added to its outcome in each condition's own words, so the authored outcome should say only what happens ("You pay Garrick Hale ten coin, and he pockets it without counting.").
- Wren's schedule keeps her at the contract hall. A bound follower keeps no schedule, but if she stops following she goes back to the hall by her day; an economy pass should give an owned person a place at their owner's.
