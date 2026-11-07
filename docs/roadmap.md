# Roadmap

Nov 7, 2026 · @AmbiProp

The plan for the whole project now that it stands on its own. *Praxis — Charter* keeps the adventure's own decisions; this page keeps the direction, the order of work, and the decisions that cross the parts.

## Direction

We are independent of Howling Whispers, and we go our own way rather than carry its shapes forward.

- **Our own records.** Characters and worlds get a shape of our own, designed fresh. Orbis's record shapes are not the base.
- **Any kind of story.** Fantasy is one genre among many: modern, crime, science fiction, horror, romance, slice of life. Nothing in a record assumes swords, species or a medieval calendar.
- **Character Engine and CharacterRoom are the foundation.** They are the owner's NovelAI scripts. Orbis and Praxis grew out of them, and they hold the owner's style more fully than either.
- **Praxis gives the site its working parts.** The web stack, the pure engine, the provider relay, the prompt formats for each model family, browser saves, and the server and its deploy scripts all stay.

## What each source gives

| Source | What we take | What stays behind |
| --- | --- | --- |
| [Character Engine](https://github.com/Tulivu89/Character-Engine) | The character model: Classic and Profile Plus shapes (Presence, Drive, Pattern, Resistance, Conduct, Facets); pressure (Hook, Pursuit, Position) with its history. States as bounded numbers with bands, a resting band, a scope and terminals. The four approaches, rolls and stakes. Threads (five questions, a kind, milestones, one active). The journal with active and archived entries. Places nested inside places, with description, lorebook entry and atmosphere. Schedules as plans of stops. Factions with standing ladders and resources. Chat modes, including the interview. Image prompt fields and presets. | NovelAI's script platform: the lorebook and Author's Note injection, the bridge userscript, the story-file storage. |
| [CharacterRoom](https://github.com/Tulivu89/CharacterRoom) | The chat side's features: Contact, user and scenario cards; example chats; brains (keyed lore); Jots, Diary, Plans and Process; posts with comments; story time and schedules with a week view; emotions and portraits; the dice system and its presets; sheets per person; group chat; Stage mode; chat bubbles; card import and export. | AnotherRoom's context code (see below), the Xialong-only prompt, the NovelAI panels. |
| Praxis | Stack, engine pattern, relay, formats, saves, server, deploy, CI. Canon and instance: a world is read-only, and play lives in the save. | Its Orbis-shaped records, once the new ones are in. Bogwater and Port Covenant become worlds on the new records. |
| Orbis, Ember | Nothing required. Reference for an editor, import and export, and a launch handoff, if useful. | Everything else. |

### AnotherRoom

CharacterRoom is a fork of AnotherRoom 1.1.5 by Triplis, made with Triplis's permission for a NovelAI script. Its context builder (system prompt, message rebuild, brains assembly, rollover, emotion parsing) is AnotherRoom's code. That permission covered a NovelAI fork, not a website.

The site writes its own chat context instead, on the shared core. It has to anyway: AnotherRoom builds for Xialong only, and the site serves many models. CharacterRoom's own additions are the owner's and come across freely. Character cards keep reading AetherRoom field names, so existing characters can be imported.

## The design: one world model, three ways in

**Records (canon).** Made once, used everywhere:
- **Character:** one record for chat and adventure alike. A profile in one shape (Classic, Profile Plus or custom), plus Facets, Presence for how they look, voice, a greeting, example chats, emotions and portraits, a schedule, an inventory, and states.
- **Place:** nested to any depth (region, town, building, room), with description, lorebook entry and atmosphere by time of day.
- **Item, Faction, Thread, Lore entry** (brains), **Scenario** (a starting situation), **Persona** (the player's own card).
- **World:** the container. Genre, tone, calendar, the state definitions and the ruleset, and every record inside.
- **Ruleset:** state definitions, how a roll is built and judged (the four approaches, or a preset such as Blades or Year Zero), and the outcomes.

**Play (instances).** The save holds what changed; canon never changes in play:
- **Adventure:** a world played as a text adventure, with rules, a narrator, a clock and the player's own records (Praxis today).
- **Chat:** one or more characters in conversation, with Jots, Diary, Plans, posts and story time (CharacterRoom today).
- The two can meet: an adventure character opens a chat, and a chat can be summarised into the adventure's journal, as CE's interview does.

**Making (the studio, called the hub until it has a name).** Where records are written, with the guided builders and generate buttons that CE has, and import from CharacterRoom cards and from Praxis's records.

**The rule over all of it:** the model never moves a number. States, pressure and standing change by a rule firing on something that happened, or by the player's hand. The model narrates. Where its judgment is needed, it picks a label from a closed list, and a table says what that label does.

## Decisions (open to the owner's veto)

1. **The record model is designed before any studio code.** One design doc, `docs/records.md`, built from CE, CharacterRoom and what the adventure reads, and reviewed by the owner. Everything else waits on it.
2. **Folders and code are named by job, not by brand.** `core/`, `adventure/`, `chat/`, `studio/`. Brand names live in one file of display text per side.
3. **One shared core.** The provider relay, prompt formats, context budget, journal, records and state engine live in `core/`. Adventure and chat both import it.
4. **Browser storage first.** Records, saves and chats live in the player's browser, with export and import, and a **Back up everything** file. Nothing about play is stored on the server, and keys are sent per request and never kept. Testers lose nothing they have backed up, and the server has nothing of theirs to leak.
5. **Neutral format names before outside players arrive.** `praxis-module/1`, `praxis-save/1`, `praxis-records/1`, `praxis-export/1`, the `praxis` browser database and `PRAXIS_PROVIDERS` get neutral names. The old ones are still read.

## Accounts

Not needed for testing: decision 4 keeps testers safe and costs nothing. When people want their work on two devices or want to share it, the light version is:
- sign-in by emailed link, with no passwords to store;
- one SQLite file on the same server, holding each person's records and saves as they are exported now;
- an email sender's free tier, which needs the domain from the brand step;
- Hetzner backups (about a fifth more on the server bill), a privacy page and a delete-my-account button.

That fits on the current server. It waits until the studio and chat are worth syncing.

## Order

Each step is one or more pull requests. The adventure keeps its own list (charter, *Next, in order*) alongside, on its current records, until step 6.

1. **The record model.** `docs/records.md`, as decision 1. Claude drafts it from the three sources; the owner reviews it field by field.
2. **Brand,** alongside step 1:
   - one name for the site, and a name or plain label for each side;
   - checks before choosing: a free domain, no AI chat or game product using the name, easy to say on first sight;
   - a look and a domain to replace the sslip.io address.
3. **Repository shape.** `praxis/` becomes `adventure/`, `core/` comes out of it, the formats get neutral names, and `orbis/` and `ember/` leave the tree (their history stays in git).
4. **Studio v0.** The new records in the browser: an editor per kind, a world view of nested places, guided builders, generate buttons that show what they send, import of CharacterRoom cards, and export and import of a world.
5. **Chat v0.** CharacterRoom on the site, on the core:
   - characters, persona and scenario;
   - brains, Jots, Diary and Plans;
   - story time and schedules;
   - emotions and portraits, uploaded at first.
   - Then posts, dice and sheets, group chat and Stage mode.
6. **The adventure on the new records.** Praxis's engine reads them through the core; Bogwater and Port Covenant are converted; CE's pressure and threads join its rules.
7. **Images** through the player's own image provider, after everything else is established, as the charter already says.
8. **Accounts,** when syncing and sharing are wanted.
9. **Partner models,** when a partner provides them.

## Questions for the owner

1. Should the character record default to Profile Plus, with Classic as the alternative, or the other way round?
2. Any record kinds or fields you've already planned that neither CE nor CharacterRoom has? A list in any form is enough to start `docs/records.md`.
3. Where is the Discord bot's code? It is in neither repository. It can wait until chat v0.
4. Should Claude draft name candidates now, with the step 2 checks done for each?
