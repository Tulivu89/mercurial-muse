# Praxis repository rules

- `main` is the source of truth. Work arrives on short-lived branches and merges into `main`.
- The project charter is `docs/praxis/charter.md` at the repository root. Read it before changing scope or architecture.
- `src/engine` is pure TypeScript: no DOM, no network and no storage. Time and randomness come in as arguments, never from globals. Rules live there and nowhere else. The interface and providers are adapters around it.
- The model never moves discrete state. State moves through a resolved rule or a player override, and every change is recorded with its source. Where the model's judgment is needed it returns a label from a closed list, and an authored table says what the label does.
- A state reaches the model only through its bands, and only when it is off its resting band.
- Modules are read-only canon. Play writes to the save, never to the module.
- Keep the module format as it is, Orbis field names and IDs included. That rule predates the record model (`docs/records.md`): the names stay only while Studio worlds and modules convert both ways, and retire when the adventure reads records directly (roadmap step 6). Don't rename module fields before then.
- The state primitive, the clock, the standard ruleset and the ruleset's schemas live in `core/rules/` since 0.23.0, where the Studio reads them too. The files here with those names re-export them. `core/rules/` is as pure as the engine.
- Saves live in the browser. The server holds no play state and never stores a provider credential.
- Preserve roleplay formatting: narration and action in single asterisks, speech as plain text with no quotation marks, thoughts in parentheses. Square brackets are for notes outside the story (the game's notes to the narrator, or the player's).
- Before completion run `npm test`, `npm run lint` and `npm run build`. CI runs the same three.
