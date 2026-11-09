# Mercurial Muse: instructions for Claude

Read `README.md` for what each folder is, then `docs/roadmap.md` (the direction and order of the whole project), `docs/praxis/charter.md` (every decision and the progress table) and `docs/praxis/working-notes.md` (how the work gets done) before changing scope or architecture. Praxis's own code rules are in `praxis/AGENTS.md`.

## The project

The site is **Inkwyrm** (`docs/brand.md`: the name, the Wet Ink look and its tokens, the ink-drop marks); the repository keeps its working name. An AI roleplay platform whose strength is its features: scripted context management, a rules-driven roleplay system, and worldbuilding and character-building tools. Three parts on one core: the Praxis text-adventure RPG (built), a deep character-chat side, and a studio for worlds and characters. The foundations are the owner's NovelAI scripts, Character Engine (`Tulivu89/Character-Engine`) and CharacterRoom (`Tulivu89/CharacterRoom`); the records are our own, for any genre, not Orbis's. CharacterRoom's context management (the owner's rewrite) carries across to the site and grows to serve every model family. The record model is `docs/records.md`; its first worked example is the mascot, Sepia (`docs/mascot-record.md`). Players bring their own model keys until a partner provides models.

- `praxis/` is the working app. Most work happens here.
- `orbis/` and `ember/` are reference copies from the Howling Whispers deployment. Nothing builds on them; they leave the tree in roadmap step 3.
- `docs/abernys/` is the setting, all the user's own. `docs/praxis/` holds the design docs, including the Bogwater test module's plan and full design.

## Working with the user

- Never use the user's real name in anything. Sign docs `@AmbiProp`.
- The user doesn't use git. When something needs their action, give the specific plain steps (open the pull request, **Merge pull request**, **Confirm merge**) and handle everything else.
- Keep replies concise and lead with what changed or what to do next. Don't narrate failed attempts at length.

## Writing and worldbuilding

- Pulp-voice for every record field and design doc: concrete, plain, no AI-slop patterns. The narrator copies the records' voice.
- Names a reader can say on first sight: Welsh and Celtic as inspiration only, anglicised or plain fantasy, a few clichés at most.
- No glossary words: dock, not staithe; eel fence, not weir.
- A character shows their species in one or two traits and a colouring, never a restated species record.
- A place or person exists only if a scene or a rule uses it. At most four named people in a place at once.
- Schedules in times of day (morning from 6, afternoon from 12, evening from 18, night from 22): one daily round for most people, a few exceptions for the people threads turn on.
- Known stories can model dynamics, never names or details.
- The full rules are in `docs/praxis/bogwater-plan.md` under Writing rules.

## Git and checks

- Work on a branch and open a pull request into `main`. CI runs Praxis, Orbis and Ember checks separately, each only when its folder changes.
- In `praxis/`, run `npm test`, `npm run lint` and `npm run build` before finishing.
- Deploys: `deploy/setup-server.sh` once on a fresh Ubuntu 24.04 server, then `bash /srv/muse/deploy/deploy.sh`.
