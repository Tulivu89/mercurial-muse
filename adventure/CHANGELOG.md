# Praxis Changelog

Newest first.

Praxis is pre-alpha. Versions below `0.1.0` do not exist; the project starts at
`0.1.0` so that every change from the first commit onward is recorded.

Use `X.Y.Z` semantic versioning, where `Z` is required. A new milestone gets a
short human-readable name after the version.

## 0.28.0 - The evaluator - 2026-11-18

The bridge between your own words and the dice (`docs/reviews/adventure/decision.md`, A1; charter, Next 4).

- **A check proposed from what you write.**
  - After a turn in your own words, the suggestions model reads it against closed lists the rules give: the approaches, who and what is here, and what each approach can do to each of them. If it sounds like something uncertain, it proposes one check, with what you want from it, above the turn box.
  - **Roll it** settles it through the rules like any check.
  - **Change** opens the check with it filled in.
  - **Not a check** sets it aside, and so does your next turn.
  - Nothing rolls by itself.
- **Options:** a chip beside *Make a check* asks for up to three checks that fit the scene, each with a few words for its button.
- **Only what's on the lists:** a proposal naming an approach, target or aim that isn't there is refused (`engine/evaluator.ts`), shown in the call log, and never guessed at. The model picks labels; the dice and the tables decide.
- **Settings › Checks › Propose a check from what you write,** on by default.

## 0.27.6 - Looks - 2026-11-18

- **Settings › Style**: a look over paper and ink (`docs/looks.md`), the same choice as in Chat and the Studio. Send shows when a turn is being written, so a look can bring it to life.
- **Night is Ink Night**: blue-black instead of brown. Corners come from the site's shape tokens.

## 0.27.5 - Abernys retired - 2026-11-15

- New game offers Bogwater only, until a game of its own replaces it. Port Covenant stays as a test fixture and isn't offered.

## 0.27.4 - Gemini - 2026-11-15

- **Google AI Studio (Gemini)** is on the provider list, through Google's OpenAI-compatible door. Its keys have come with a free daily allowance. The server relays to it once it's deployed.

## 0.25.2 - The mark - 2026-11-12

- The tab shows Inkwyrm's mark (`public/favicon.svg`): flat ink by day, bone at night, by the
  device's setting. The Adventure dragon is drawn too (`favicon-adventure.svg`), for when the
  adventure takes the Wet Ink look.

## 0.25.1 - Inkwyrm - 2026-11-11

- Players read Inkwyrm where they read Praxis: the page title, the loading line, the start
  screen's wordmark, the version line, the guide, the connection notes and the relay's errors.
  Code names, browser storage (`praxis` database, `praxis.*` settings) and file formats keep
  theirs, so nothing a player has is lost.

## 0.25.0 - Threads - 2026-11-11

- **Threads with milestones** (Character Engine's): a module's new `threads` list. A thread asks
  five questions for its author (pressure, objective, opposition, cost, consequence) and has
  milestones in order. A milestone is reached when its state conditions hold on or after its
  first day, and missed once its last day is over. The rules check at the end of every turn that
  moves the world, pay its experience by the rule, and keep it among what was earned, so undo
  takes it back. A milestone with no condition is the player's to mark.
- **The narrator hears one beat:** the first open milestone of the thread the player follows,
  in the lorebook section after you. Never the questions, the other threads or the experience.
- **The Journal lists the threads**, each with its milestones reached, next, missed or yours to
  mark, **Follow this thread** and **Mark reached**. You › Journal shows the one followed.
- **Saves** gain `thread` (the one followed); older saves follow the first with anything left.
- **Bogwater 0.2.0:** its five threads from the module plan, with the 90 experience the plan
  sets: still free when the patrol leaves (day 4), through Orlo's day at the dock (day 12), the
  Pact's claim ended, Corran found out, the war started or stopped, tamecap to Morwen by day 8,
  Lowri's fate, a barrel run, Edric's strongbox and the bend fence ruling. The scene actions that
  paid experience for these no longer do; the milestones pay instead, in the same turn.
- The guide's Growth chapter says where milestones come from.

## 0.24.1 - Routes shared - 2026-11-10

- The route schema and its requirements move to `core/rules/ruleset.ts`, where the Studio now
  writes routes; `module.ts` exports them as before. No change in play.
- The round-trip pass now also proves the shared schedule model: every person's day leaves the
  Studio as events with a place and a condition and comes back as the same day plans.

## 0.24.0 - From the Studio - 2026-11-10

- **Worlds sent from the Studio.** The start screen lists every world the Studio handed over
  with **Play in the adventure**, under *From the Studio*, each with Play and Remove. The Studio
  leaves the converted module in this browser (`inkwyrm.launch`), and an address ending
  `/?launch=<world id>` starts that one straight away.
- **The converters are proved on every test run.** `npm test` now runs the suite twice: once as
  before, and once with every module turned into a Studio world and back first
  (`npm run test:roundtrip`, `tests/roundtrip.config.ts`), the census included.
  `tests/studio-roundtrip.test.ts` holds Bogwater and Port Covenant to the same parsed module
  after the trip.
- No change to the rules, the module format or saves.

## 0.23.0 - Shared rules - 2026-11-10

- **The rules move to `core/rules/`,** because the Studio now reads them too: the state
  primitive and its band sentences (`state.ts`), the story clock (`clock.ts`), the sentence
  helpers (`words.ts`), the standard ruleset `four-approaches/1` (`standard.ts`) and the
  ruleset's own schemas, split out of the module schema (`ruleset.ts`). The files in
  `src/engine/` with those names re-export them, and `module.ts` still exports every schema it
  did, so nothing that imports the engine changes.
- No change in play. The module format, saves and every rule are as they were, and the tests
  pass untouched.
- `AGENTS.md` notes that the Orbis field names in modules stay only while the converter between
  Studio worlds and modules lives.

## 0.22.2 - Chat's door - 2026-11-09

- **Streaming through the relay.** `POST /api/narration/stream` takes the same request as
  `/api/narration/chat` and answers as server-sent events: `delta` with text as the provider
  writes it, then `done` with the whole reply and its diagnostics, or `error`. A provider that
  answers whole is passed on in one piece. A model's thinking is held back from the stream as it
  is from a whole reply. The adventure itself still asks for whole replies.
- A narration request can carry `top_p`, `top_k`, `min_p` and extra `stop` strings, sent on only
  when given.
- The server also serves Chat at `/chat/`, when it is built, and the start screen links to it.

## 0.22.1 - The Studio's door - 2026-11-09

- The server also serves the Studio at `/studio/`, when it is built (it is, with `npm run build`
  from the root).
- The start screen links to it.

## 0.22.0 - New layout - 2026-11-09

- **The adventure moves to `adventure/`,** and its narration code (providers, prompt formats,
  the relay's request and reply shapes) to `core/`, for the chat side to share. One npm
  install at the repository root serves both.
- **Neutral file formats.** Modules, saves, save files and records files are written as
  `adventure-module/1`, `adventure-save/1`, `adventure-export/1` and `adventure-records/1`.
  The `praxis-*` formats are still read, so old saves, exports and modules open as before.
  A save exports as `<name>.save.json`.
- **The server runs as the `inkwyrm` service** from `deploy/inkwyrm.service`, installed and
  kept in step by `deploy.sh`, which also moves a server from the old layout once.
  `NARRATION_PROVIDERS` in `/etc/inkwyrm.env` adds providers; `PRAXIS_PROVIDERS` and
  `/etc/praxis.env` are still read.
- Orbis and Ember leave the repository.
- Nothing changes in play. Browser storage keeps its names, so saves and connections carry over.

## 0.21.0 - Any narrator - 2026-11-05

- **Narration from more providers.** Settings › Narration chooses where narration comes from:
  NovelAI, OpenRouter, Featherless, ArliAI, Infermatic, NanoGPT, DeepSeek or Z.ai, each with
  the player's own key, or a server of the player's own.
  - The relay forwards only to the providers in its list, at `/api/narration/*`, with the key in
    `X-Provider-Key`. It still stores, logs and echoes no key.
  - A server of the player's own (koboldcpp, llama.cpp, LM Studio, Ollama, TabbyAPI, vLLM) is
    called from the browser with the same request, never through the relay.
  - `PRAXIS_PROVIDERS` lets a server operator add providers, such as a partner's endpoint.
- **Prompt formats.** One prompt can be written in GLM, ChatML, Qwen 3 (thinking off),
  Llama 3, Mistral (V7 and older), Gemma or DeepSeek format, guessed from the model's name or
  chosen by hand, so the prefill works on most open models. Providers without a completions
  endpoint get chat messages, with the prefill as the reply's start where the provider
  continues one (OpenRouter) and thinking turned off where the provider allows.
- Thinking a model writes into its reply is removed before anyone sees it.
- Models: long lists (OpenRouter's hundreds) become a field with suggestions; providers that
  list none take a typed name. The model's own window is shown when the provider gives it, and
  the window setting goes to 32k, 64k and 128k.
- NovelAI connections, keys and settings carry over unchanged.

## 0.20.0 - Bogwater - 2026-10-18

From *Praxis — Bogwater Module Plan*, the new test module.

- **Abernys: Bogwater**, the module the start screen offers first. A runaway from a Port
  Covenant indenture comes up in the net at the long fence on the first night of the eel run,
  with the Pact's contract inked on their arm.
  - Nine places, each with its rooms as child places that cost no time to move between,
    standing in for partitions until Praxis has them.
  - Seventeen people with dossiers, one daily round each in four times of day, and two weekly
    exceptions. Sitting day, boat day and run nights come from schedule rules.
  - Four threads on clocks that meet on sitting day: the ink, Corran's war, the tamecap cure
    and Cadfan's barrels. Their story events are schedule rules counted from day 1.
  - Five routes to freedom, a protagonist's economy priced on the ten-step scale, jobs, and
    sixteen scene actions.
  - Everything invented is marked `canonStatus: "draft"` for the owner.
- **Schedules can wait on a state.** A schedule rule's `when` can name a state and its
  bounds, on the person, the player or the world (`characterId: "world"`). Lowri only gets
  loose if nobody cured her; the patrol only raids Nest's island while Corran's game is
  unknown; the officer goes home once the Pact has no claim.
- **Scene actions can read and set world states**, with `characterId: "world"`.
- Port Covenant stays playable, and its tests still run, until Bogwater covers them.

## 0.19.0 - Making Things - 2026-10-17

From *Praxis — Growth, Challenge and Economy*, as decided on Oct 17.

- **Making things with Focus.** Leverage and Prepared help your next check against the same
  target. A thing you make carries that help to any later target it fits.
  - Begin in You › Making. The materials cost half the thing's worth.
  - Work on it with Focus. Each success adds to a track as long as the thing's step: a
    knife's worth 1, a sword's 2, a horse's 3, a house's 5.
  - Each check takes an hour, half a day, a day or a week by step, and a failure takes as
    long again. A despair spoils the materials.
  - It is Average, or Hard for fine or secret work.
  - When it is done, the thing goes into your pack.
  - What you are making goes where you go. The narrator knows you are at it, and the ledger
    records each work begun, finished, spoiled or given up.
  - Making things earns no experience. Selling what you make is the profit.
- **Port Covenant 0.11.0:** the forged writ is fine work.

## 0.18.0 - Coin and Things - 2026-10-17

From *Praxis — Growth, Challenge and Economy*, as decided on Oct 17.

- **Coin** is part of the standard ruleset, on a ten-step scale: a knife 1, a sword 10, a
  horse 100, a house 1,000, a castle 10,000.
  - Only exchanges count. Drinks, meals and a bed are never counted.
  - The narrator reads what you could afford, in the You entry and only off its resting
    band ("You could buy a sword or hire a blade for a month."), never the number.
- **Goods** are kinds of thing on that scale, and your pack counts them. The ledger records
  every change. Each good does one job:
  - **Help:** a boost die where it fits.
  - **Weapons** add harm to a successful Force check against someone: a knife or club +1,
    and it can be hidden; a sword, axe or spear +2.
  - **Armour** takes the first Health a failure costs you, and a rest sets it right: a
    jerkin 1, mail 2, plate 3. Plate gets in the way of Finesse.
  - **Things you use up:** a poultice, a tonic, a smoke pot.
- **Buying, selling and taking,** each a turn the rules settle:
  - Buy from anyone here who sells.
  - Sell to them: they pay full worth for what they sell themselves, and half for anything
    else.
  - Take what someone carries once they are down or have given way: their purse by tier,
    and their goods.
- **Bribes,** in the check panel, for Flair and Finesse against someone:
  - Their price makes the check one step easier; a scale above makes it two.
  - They are paid only if taken. On a despair they pocket it and refuse anyway.
  - A minion takes their price without a roll.
  - Someone not for sale takes it as an insult: one setback die.
- **Bargain:** Flair builds it on someone who sells. Each point takes a quarter off your
  next purchase from them, up to half. A despair means they won't deal with you until
  tomorrow.
- **Terms that run out:** a state can count down by the day or the hour.
- **Scene actions:**
  - They can have opening hours and market days.
  - They can add goods to your pack or take them out.
- **Port Covenant 0.10.0:**
  - The traveller starts with 40 coin and a knife.
  - Hiring Garrick buys a month: his pay counts down by the day, and he stays behind when
    it runs out.
  - Pell sells poultices, tonics and smoke pots. Once you have Leverage on him, his back
    room has a forged Covenant writ for ten coin.
  - Cadfan sells knives, jerkins and lockpicks, and on market day in Caerwyn has a dead
    man's mail shirt for half its worth.
  - Garrick, the gate guard and the dock toughs carry weapons and armour.
  - The Arbiters are not for sale.
- The default line for a check reads "on a garrison guard", not "on A garrison guard".

## 0.17.0 - Growth - 2026-10-17

From *Praxis — Growth, Challenge and Economy*, as decided on Oct 17.

- **Experience**, a state on the player that the narrator never hears about. You earn it:
  - for **overcoming** someone the first time a roll brings them to an end: a minion 1, a
    rival 4, a nemesis 10, and a gang one minion's worth for each of them;
  - for **obstacles**: 1, or 2 if Hard or worse;
  - for **lessons**: 1 for failing against a rival or nemesis, at most once a scene;
  - at **milestones** a module sets. Signing the Covenant is worth 5.

  Succeeding without a roll earns nothing. Nothing pays twice: the save keeps what has
  been earned.
- **Spending it,** in You › Growth:
  - Raising an approach costs ten times the new rating, up to 4.
  - Charges are now a ladder: Raw, Practiced, Trained, Expert (+1 to +4) and Master (+1 to
    +5). Each step costs five times its new charge.
  - A ladder changed in play lives in the save, and the ledger records each step.
  - Undo takes it back with the turn before it.
- **One lane onto another's ground for every approach**, at one setback die and the owner's
  cost: Force intimidates (Strain), Finesse strikes from cover (Health), Flair talks
  suspicion down (Alert), and Focus works out a lock (Security). With a strong approach, a
  lane is worth about one rating step less than its owner.
- **Rank:** a person's rank, 0 to 2, upgrades that many of their difficulty dice to
  challenge dice.
- **Gangs:** several people who act as one. Their number is their Health and Strain and
  how many difficulty dice they bring, up to four.
- **Port Covenant 0.9.0:**
  - Signing the Covenant is a milestone.
  - Brond is rank 1.
  - The dock toughs are a gang of three at the harbour, all draft.

## 0.16.1 - 2026-10-17

- **Wait or go quietly.** A skip button beside Wait and beside each Go, in Scene and on the
  map, moves the clock or you by the rules without a turn: followers come along, people keep
  their day, a long enough wait is a rest, and nothing is written or sent to the narrator. It
  sees where and when you are on your next turn. For putting the time or the place right when
  the story has drifted. The ledger marks these moves as quiet, and Undo takes them back with
  the turn before them.
- **A fight that ends stays over.** When a check puts the last one in a fight down, or makes
  them yield to Force, and no one else here is hurt but still standing, the outcome says the
  fight is over and no one else takes it up or comes to join it. The place's Alert falls to
  uneasy. Talking someone round is not a fight. This is the standard ruleset's new `fight`
  rule, which a module can change.

## 0.16.0 - The Outer Lanes - 2026-10-17

- Port Covenant 0.8.0 adds three places to test schedules, followers and contracts. All of
  it is draft.
  - **The Tarred Rope**, an alehouse in the outer lanes, kept by Pell. Garrick Hale, a
    sellsword between contracts, can be hired there for ten coin.
  - **The Reddles**, a human fisherman and his harefolk wife. They have a house in the outer
    lanes and a family record. He works the boats on the harbour and drinks at the Tarred Rope
    in the evening; she mends nets at home and sells the catch on the harbour.
  - **The contract hall** on the harbour, where Odile Fenn brokers indenture. Wren's contract
    can be bought there for twenty-five coin.
- **Coin:** the traveller starts with 40.
- **Two kinds of hold over someone,** each with a follow rule:
  - Bound by contract: "She must go where you go and do the work you set, whether she will
    it or not."
  - In your pay: "He will travel with you and do the work you hired him for, while the pay
    lasts."
- **Scene actions can do more:** require people to be present (`present`), check another
  person's state (`when[].characterId`), and change it (`effects[].characterId`). A bargain
  is offered only where it belongs, with the right people there, and while you can pay.
  What it changes is told in each condition's own words as part of the outcome, and is
  not repeated as a condition to keep that turn.
- **A side effect never undoes a success.** After a success, a complication reads
  "Something small goes against you as well, without undoing what you achieved."
- **Continuing an edit:** the edited text is sent without trailing space, and the narrator's
  continuation joins it with exactly one.

## 0.15.0 - Clean Copy - 2026-10-17

- The reply's opening reads as clean sentences, one to a line, because the reply copies
  whatever it looks like:
  - "Show that it works: she believes your lie and lets you through."
  - "Remember that the garrison guard has given way. He will take your word over anything
    he can see or know, and do as you ask, until something new changes his mind."
  - Every line ends with a full stop and holds at most one colon.
- Outcomes are one plain sentence a line ("It fails and makes no headway against the gate
  Arbiter."). Condition words are written as sentences with the person's own pronouns.
- People carry pronouns (`pronouns`, as Orbis's persona record writes them). Port Covenant
  0.7.0 gives each person theirs, and local people can be given them in the record form.
- Once a turn is resolved, only the story stays in the narrator's context: no rolls and
  no rulings in the transcript.
- The latest reply can be edited. **Save** keeps it as written; **Continue from here** hands
  the edited text back as the start of the reply, and the narrator carries on from it.
- A minion falls to one success: the standard minion tier has 1 Health and 1 Strain, and
  Port Covenant's tiered people take their limits from their tier. A success that wears
  someone down without finishing them reads "Success, not over yet" on its check card.

## 0.14.1 - Stakes - 2026-10-16

- A check can say what you want from it ("She lets me through without signing."). The
  outcome then says outright whether it happens:
  - a success: "It works, so this happens: she lets you through without signing.";
  - a partial one: "This does not happen yet: …";
  - a failure: "This does not happen: …".
  The check card shows it.
- Someone who has given way now "takes your word over what they see or know". A lie the
  scene could disprove, such as a name not in the ledger, still lands.
- Settings › What the narrator was sent:
  - **Copy all** and **Save as a file**: everything sent, with the replies that came back.
  - **Try this turn 5 more times**: asks again without changing the story and lists every
    reply, so how often the narrator follows a ruling can be counted.

## 0.14.0 - The Scene and Its Cast - 2026-10-16

- The narrator's context is laid out the way NovelAI lays out a story, with each thing
  sent once:
  - **First system message, fixed for the story:** brief rules, the house format shown by
    example from another story, and the world, with the land's top regions one line each.
  - **Second system message, the lorebook section:**
    - the story so far and you;
    - where you are (forced on while you are there);
    - who is present and what they are doing (the dramatis personae);
    - what lies between them;
    - lore switched on by key.
  - **The transcript:** each past turn keeps your words with what the rules decided.
  - **Your words this turn, alone.**
  - **The reply's opening, as NovelAI's prefill:** "Understood. I will: …" with the outcome
    and every condition to keep true, then "[Of course, here you go:]" and an opening `*`.
- The world-wide list of names is gone. Character and other lore switches on by key:
  - **From where:** anything named since the scene began, in your words, a reply or an outcome.
  - **How long:** it stays on until you leave.
  - **Short names:** someone present also answers to the last word of their name ("guard").
  - **Targets:** anyone a check targets switches on.
  - **Longer names win:** where two names overlap, the longer one counts, so "the garrison
    guard" is not the garrison.
- Outcomes and conditions are brief facts that say what they mean:
  - "It works.", "It gains ground, but it is not over yet.", "It fails: it makes no headway
    against …".
  - Conditions say whether more is needed: "is hurt: bleeding and slowed, but still fighting",
    "is close to giving way: still holding out, but not for much longer", "has given way:
    they believe you, back down or do as you ask, until something new changes their mind".
  - Any loss now leaves the resting band, so a success always shows.
  - The screen shows only the words before the colon.
- Schedules hold while you are with someone: nobody walks out mid-conversation. They are
  "due at the Governor's court by now" instead, and go when you leave, wait or rest.
- Followers: someone can come with you when you travel.
  - **Who:** a companion once your bond reaches its warmest two tiers (`followsFrom` on a
    bond kind changes that); a captive once they are down; or someone who has given way to you.
  - **The rules:** `ruleset.follow` lists these. Their row in Scene offers it, and
    "Bring along anyway" sets it by hand.
  - **On the road:** followers keep no schedule. Each journey checks their reason again, and
    anyone it no longer holds for stays behind.
- Narration in asterisks shows in italics. Settings › What the narrator was sent shows the
  prefill. A reply that repeats the prefill is trimmed to the story.

## 0.13.0 - The Context Ladder - 2026-10-16

- The house format is now speech as plain text with no quotation marks, *narration and
  action* in asterisks, and (thoughts) in parentheses, which nobody else in the story
  hears. Square brackets are for notes outside the story: the game's to the narrator, or
  the player's. The story view, the composer, the Guide, the opening and AGENTS.md follow it.
- What the narrator is sent is laid out by how often it changes, and each thing has one
  home. The system message never changes in play: the directions, the world, a names-only
  list of who and where, and the journal. Then the transcript. Then the game's notes for
  the turn, as their own message: `[ Lore: … ]` for you and the people, things, groups and
  history here and anything just named; one `[ Scene: … ]` paragraph for where you are,
  who is here doing what, what shows and the ways out; and `[ Outcome: … ]` for what the
  rules decided. The player's words come last, alone.
- Nothing is said twice. A person's profile is lore while they are here and the scene only
  says they are here and what they are doing; the names list carries no descriptions; a
  fact the outcome states is not repeated in the scene that turn.
- Statuses read as story, in other people's terms: a guard "has given way to you: they
  believe you, back down or do as you ask", "is near death", "is wavering"; everyone at a
  place "is watching closely". States take `npcLabels` for this, and a terminal can carry a
  `playerNote` for when it is you who arrives there.
- An outcome says plainly what happened and what to do with it: "Flair succeeds. What you
  just tried works on the garrison guard. The garrison guard has given way to you … Show it
  in this reply, and let it change what the garrison guard does from here on." Failures,
  Focus, costs and side effects get the same treatment; arrival, waiting and resting are
  told to "you".
- A copied `[ Lore ]`, `[ Scene ]` or `[ Outcome ]` line is taken out of a reply. Settings
  › What the narrator was sent labels each message.
- *Abernys: Port Covenant* 0.6.0 takes its approach ratings, Health, Strain, Alert, dice
  and rest from the standard ruleset instead of repeating them, and its opening follows the
  house format.

## 0.12.0 - Four Ways - 2026-10-16

- Every person, thing and place in a scene can be acted on with the Four Approaches, with
  nothing authored. People: Force hurts or overpowers (Health), Flair persuades, charms,
  bluffs or intimidates (Strain), Finesse lifts, slips past or plants (a deed: it works or
  it fails, and failure raises Alert), Focus reads them for Leverage. Things: Force breaks
  them (Integrity), Finesse picks or takes them (Security), Focus studies them (Prepared).
  The place: Finesse lies low (Alert), Focus searches it (Prepared).
- Focus builds an edge for the other approaches. Leverage on a person makes the next
  check against them one step easier per point; Prepared on a thing or place adds a boost
  die per point. Both go up to two and are spent on the next check by another approach,
  unless switched off on the check. The rules guide has a chapter with the odds.
- Difficulty comes from the target: its own, by approach or for all; a random one fixed by
  the save's seed; its tier (minion Easy, rival Average, nemesis Hard); or the module's.
- Something in the story: on the check screen, name a door, a crowd or two guards, say
  how hard it is, and it joins your records, here, aimed at.
- The check screen is rebuilt around who or what you aim at, with what each approach does
  to it and how hard. Things in the Scene show their state and offer a check.
- The standard ruleset, `four-approaches/1`: a module that extends it gets the Four
  Approaches states, costs, dice, rest, tiers and deeds beneath its own, so a world with
  no rules of its own is playable.
- *Abernys: Port Covenant* 0.5.0 extends the standard ruleset, gives its people tiers, and
  adds the registry strongroom door (Daunting to force, Hard to pick). All draft.

## 0.11.0 - The Narrator's Notes - 2026-10-16

- The narrator's instructions are rewritten for GLM-4.6 as what to do rather than what
  not to: a text adventure in second person, present tense; each reply is the next beat
  and stops where the player can act; time moves only as far as the player's action; the
  scene is the truth of the moment; an Outcome is shown exactly as decided.
- The scene's notes now sit in one labelled `<scene>` block before the player's words,
  instead of lines in square brackets, which are the player's inner voice.
- Mentioned records: a person, place, group, piece of history, lore block, people, family
  or thing named in the player's words this turn or in the last two replies, and not
  already in the scene, gets a fuller note for that turn, within 800 tokens. Keys are the
  name, the name without its article, the parts of a person's proper name, a title role
  ("the Governor"), and any `keys` a record lists. The moment's reserve grows to 3,000.
- Gaps closed: the player character's appearance reaches the narrator (manner and voice
  stay the player's); world, faction and thing states off their resting band are facts;
  module items can lie somewhere or be carried (`locationId`, `heldBy`); a scene action
  that reaches a terminal tells the narrator.
- Xialong uses the same prompt as GLM-4.6 for now; a prompt built NovelAI's way is on hold.

## 0.10.1 - 2026-10-16

- `deploy/deploy.sh` deploys the newest `main` in one command on the server, following
  the owner's steps, and stops before the restart if any check fails. The README says how.

## 0.10.0 - Living World - 2026-10-16

- Dossiers. People can carry how they look, how they carry themselves and how they speak
  (Orbis's `appearance`, `personality` and `speech`). Everyone present reaches the
  narrator with theirs, within a fixed share of the window: a crowded room gives the
  later arrivals their first line only. The moment's reserve grows to 2,500 tokens.
- Schedules, in Character Engine's shape: a day of stops by the hour, other days picked by
  weekday, month, day of the month or a span of days. People follow their day as the
  clock moves, and a wait tells the narrator who left, who arrived and who came by and
  went on. Someone put somewhere by hand stays until their day next moves them. A new
  save starts everyone where their day has them. The Scene shows what each person is
  doing and until when.
- Relationships, one record per pair: what it is, what happens when both are in the
  room, and what each side wants. Its bond is a relationship state whose tiers are words.
  Relationships between people who are both present reach the narrator, and a tier off
  its resting band does too.
- Bonds in play. Start one with anyone from their row in Scene, write what lies between
  you, set its tier by hand or end it; it lives in your records and exports with them.
  A triumph against someone with the approach that owns the bond (Flair) warms it a
  tier, and a despair cools it. You lists your bonds.
- The turn's changes show comings and goings where you were; everyone's days elsewhere
  stay in the ledger.
- The rules guide has a chapter on people and bonds.
- *Abernys: Port Covenant* 0.4.0: dossiers and days for the gate staff, the Governor, the
  High Arbiter, the garrison captain, Cadfan (with a market day in Caerwyn) and Brond;
  four bond kinds (Acquaintance, Rivals, Friends, Uneasy allies); relationships between
  the Governor and the High Arbiter, the Governor and the captain, and the gate staff.
  All draft.
- Not yet: the evaluator, which waits on the generation test.

## 0.9.1 - 2026-10-16

- The menu is back where it was meant to be: in the same scroll as the story, under the
  prompt. Scroll past the prompt at the end of the story to reach the five sections,
  all closed until you open one. The header bar and the menu buttons on the prompt row
  are gone; the Scene heading now carries the place, the time and who is here.
- A check opens in the prompt's place. The journal, the rules guide and the record form
  open where the menu was, and going back returns to the section you came from.
- Opening a save, sending a turn or a reply landing shows the end of the story with the
  prompt at the foot of the screen. A reply taller than the screen shows from its start.
- The generation test, in Settings › Testing. It measures by time whether NovelAI reuses
  a long prompt it has just read, word for word or with a new ending, and whether a call
  on a second model costs the first its reuse. It reports in words and copies the numbers
  for pasting back. The relay now reports how long NovelAI took to answer.

## 0.9.0 - Dice - 2026-10-15

- Checks on the Four Approaches and Genesys dice. Choose what you are trying, against
  whom or what, the approach and a charge; see the dice and the exact odds, and what
  success and failure would do; then roll, or succeed without rolling.
- The rules settle every check. Success wears the target down by the net successes.
  Failure, and two or more threat, cost what the module's approach table says: Force in
  Health and noise, Finesse in Alert, Focus in time, Flair in Strain. A secondary approach
  adds a setback die and pays the owner's cost. An approach with no claim cannot move it.
- Charges spend and come back when all on an approach are used or after a full rest;
  pushing reuses a spent one for 2 Strain. Edge, Story Points on both sides, and the
  hidden momentum count work as the proposal says. Wounds and watchful scenes add
  setback dice.
- Waiting eight hours or more is a full rest: Health +1, Strain restored, charges fresh.
- Each check leaves a receipt in the story: the dice as rolled, the verdict and the
  chance it had. Settling without a roll is recorded as the player's choice, and
  Settings can make that the default.
- The narrator gets one outcome line per check, with the target's new band.
- *Abernys: Port Covenant* 0.3.0: the approach table, the traveller's charges (Flair
  trained), setbacks and the rest rule, all draft.
- Saves from 0.8 open with nothing spent.

## 0.8.0 - Play Screen - 2026-10-15

- A new interface. The story and the composer fill the screen. The menu is one scroll
  of five sections, one open at a time, each heading saying enough to know whether to
  open it: Scene, You, Map, World, Settings. On a phone it covers the story; on a wide
  screen it sits beside it.
- Every turn shows what changed and whether the rules or the player changed it. The
  scene's own actions, a short wait and the nearest ways out sit above the composer.
- The narrator's context is now sized to the model's window and laid out by how often
  each part changes. The transcript's start stays put between cuts and a whole piece
  leaves at once, so the prompt's prefix can be reused. A who's who of the world's
  people, groups and places goes in the system message, so the narrator reaches for
  what exists instead of inventing it, and the groups and history bearing on the scene
  go in the latest message.
- The journal keeps the story so far and is sent with every turn. Before a piece of
  story leaves the window, Praxis suggests a short entry recording it; when the journal
  passes its budget, it suggests combining the oldest entries. Nothing joins the journal
  until the player keeps it. The player can write, edit, archive and restore anything,
  and switch the suggestions off.
- Local records: the player can add people, places, things, groups and notes to a save.
  The narrator reads them like the module's own, a local place can be travelled to,
  and the records can be exported and imported on their own. The module never changes.
- Authored scene actions settled by the rules. *Abernys: Port Covenant* 0.2.0 adds
  signing the Covenant at the landward gate, and links the Pact to the Arbiters and to
  Port Covenant.
- A rules guide, How Praxis plays, written from the Four Approaches proposal.
- Settings for the model's window, reply length, journal budget and piece size, reading
  size and typeface, and a testing group: draft markers, numbers beside bands, what the
  narrator was sent, and diagnostics.
- A remembered NovelAI token connects by itself. The token estimate is corrected from
  NovelAI's own prompt counts.
- Saves from 0.7 open with an empty journal and default settings.

## 0.7.3 - Codespace Fix - 2026-10-15

- Codespaces now build Praxis and serve it the way production does, on port 8791,
  started on every codespace start rather than when an editor attaches.
- The page says "Loading Praxis…" until the app draws, and shows the error if the
  app script fails or the app crashes, instead of a blank page.
- CI now starts the production server and checks it serves the page and its script.

## 0.7.2 - GLM Prompt Route - 2026-10-15

- NovelAI's chat endpoint answered GLM-4.6 in completion format with empty text
  (113 tokens generated, none returned). Narration now defaults to sending one prompt
  in GLM's own chat format, thinking off, to the completions endpoint. The chat route
  stays available as a setting under Connect NovelAI.
- Diagnostics now name the endpoint and show the raw first choice, with long token
  lists shortened.

## 0.7.1 - Narration Diagnostics - 2026-10-14

- Give replies room for reasoning models: GLM-4.6 thinks before it answers, and the
  old 500-token limit could be spent entirely on thinking, leaving an empty reply.
  The default is now 2048.
- Explain that case by name when it happens, and strip leaked thinking from replies.
- Add a Diagnostics panel on the play screen: the last ten narration calls with what
  NovelAI sent back (status, finish reason, reply and reasoning lengths, usage, and
  NovelAI's own error text), without the token, with a copy button.
- Add a Codespaces setup: any branch can be opened in a codespace that installs
  and starts Praxis by itself, so changes can be tried with real narration before
  they are merged or deployed.

## 0.7.0 - First Narration - 2026-10-14

- Add turns. Speaking or acting opens a turn; an action is resolved by the rules
  first and carries its outcome to the narrator for that turn only. A reroll replaces
  the narration without resolving the action again. Undo restores the world as it was
  before the turn and drops everything recorded since.
- Add the context compiler. The narrator's rules and the world's canon come first,
  then the transcript, then the moment: the scene, who is present, standing facts,
  the ways out (closed ones with their reasons), the outcome and the player's words.
  The clock reaches the narrator only as its time band.
- Add per-character maximums and bands read as a share of them, so the Four
  Approaches NPC tiers (a minion's 2 Health, a rival's 5) read correctly. The gate
  staff in the Abernys module now use them.
- Add a NovelAI relay to the server: the player's key travels with each request and
  is never stored, logged or echoed; only the models and chat paths are forwarded,
  and every body is validated first.
- Add browser saves. Every change is saved in this browser with its module beside it;
  saves can be continued, deleted, exported to a file and imported on any device.
- The shell now narrates: connect NovelAI, write, narrate, reroll, undo, and inspect
  exactly what the narrator was sent.

## 0.6.0 - Clock and Travel - 2026-10-14

- Add the story clock, ported from Character Engine: one stored number of minutes,
  an authored calendar (the real one by default), and time bands as the only time
  words the model will be given.
- Add places and travel. A hop into or out of a place is priced by its depth tier;
  authored routes are priced by distance at the module's walking pace. Journeys take
  the quickest open way and resolve in one step. Routes can require a state of the
  player's character, in one direction or both, with the reason shown when closed.
- Add the save: clock, positions, state values and a ledger. Travel and waiting are
  actions; setting a state, the clock or anyone's position by hand are overrides,
  recorded as the player's.
- Add scene presence: the place, who else is there, the ways out and the time.
- Add the first module, *Abernys: Port Covenant*, built from the Abernys docs.
  Invented details (distances, district names, the gate staff, the player character)
  are marked `canonStatus: "draft"`.
- The development shell now plays the module without a model: travel, wait, set any
  value, read the ledger.

## 0.5.0 - Rebuild - 2026-10-14

- Replace the Java bridge and browser prototype with a TypeScript rebuild on the
  Orbis and Speculus stack: React and Vite, a thin Express server, zod and Vitest.
  The previous prototype remains in the history at `d3b13ee`.
- Add the engine's state primitive, ported from Character Engine: scoped bounded
  values, clamping at the write, bands with a resting band, standing-fact lines,
  terminals that fire on crossing, and a ledger entry for every change that names
  whether a rule or the player made it.
- Add the `praxis-module/1` format: Orbis-shaped world records, characters, items,
  a state catalog and a scenario, with reference and cycle checks.
- Add a development shell that loads and validates a module file.
- Add a CI workflow running tests, type checks and the build.
- `package.json` is now the only version source.

## 0.4.0 - Free-roam Controls - 2026-10-05

- Continue the existing Praxis slice with a reading window above a multiline
  action prompt and switchable Manual, Assisted AI and Full AI control modes.
- Keep optional Hollowmere milestones, travel, fatigue, Endurance rolls and
  character panels. Market and Bakery remain test fixtures.
- Add mode-specific narration instructions and `/api/v1/ai/action` for one
  player-triggered Full AI action selected from the current available choices.
- Reject unavailable action keys before resolving prototype mechanics. AI
  responses never apply model-supplied health, inventory or other state fields.
- Add Pause AI, discard stale responses, and prevent overlapping actions.
- Save/resume local state, transcript, goal, mode and draft without API tokens.
  Preserve unreadable saves and confirm before resetting.
- Route travel before incidental “look” verbs, reject unmapped destinations,
  preserve the exact submitted text and avoid duplicate history entries.
- Extract browser session/application code and add Java boundary tests and
  Node tests for intent routing, action choices, saves and history.
- Health and inventory mechanics and server-owned sessions remain future work.

## 0.3.0 - AI Pipe - 2026-09-30

### NovelAI bridge

- Start the Java runtime side with a small HTTP service bound to
  `127.0.0.1:8787` by default.
- Add NovelAI as the first narration provider through the current
  OpenAI-compatible text endpoint.
- Add `GET /api/v1/health`, `GET /api/v1/ai/models`,
  `POST /api/v1/ai/turn`, and `POST /api/v1/ai/director`.
- Accept a user's NovelAI Persistent API token through the
  `X-NovelAI-Token` request header. The browser keeps that token in memory only
  and does not write it to localStorage.
- Keep optional server-side `NOVELAI_TOKEN` support as a development fallback,
  not a repository secret.
- Add model discovery and a default `glm-4-6` model selection.
- Keep every generation request tied to a human action in the prototype.

### Narration boundary

- Send only the active Praxis scene projection, story phase, player condition,
  visible exits/items, runtime-approved objectives, short conversation history,
  and already-resolved outcomes to the narrator.
- Explicitly instruct the narrator not to invent persistent state, hidden scene
  contents, inventory, successful rolls, movement, task completion or canon.
- Return narration separately from authoritative state and always mark
  `authoritativeStateChanged: false` on AI responses.

### Story Director

- Add a first Story Director pipe that turns one runtime-approved objective into
  a natural task briefing.
- Reject AI task responses that select an objective key outside the supplied
  allowed set.
- Keep the current allowed-objective set in the browser prototype for now, with
  the production requirement documented: the Java runtime must own the rail and
  objective set before Praxis can treat it as authoritative.

### Hollowmere prototype

- Upgrade `prototype/hollowmere-demo.html` to the v0.3.0 AI-pipe slice.
- Add live free-text narration and scene-present NPC conversation when NovelAI is
  connected.
- Add an AI setup dialog with memory-only Persistent API token handling and model
  selection.
- Add **Ask for next task** to the Story panel.
- Keep time, fatigue, movement, rolls and milestones in Praxis state rather than
  handing them to the model.
- Preserve a deterministic fallback mode when no AI token is connected.
- Add `prototype/praxis-ai.js` as the browser-side bridge client.

### Build and documentation

- Add a Java 21 Maven build and shaded executable JAR target.
- Add Jackson for JSON request/response handling.
- Ignore Maven `target/` output.
- Add `docs/AI_PIPELINE.md` with API contracts, provider boundary, token handling,
  build steps and the nginx proxy shape for deployment.

## 0.2.0 - Hollowmere Story Slice - 2026-09-30

### Story model

- Define Praxis as authored stories on **semi-hard rails** rather than a fully
  open-world simulation.
- Keep freeform talking, investigation and local exploration inside active
  scenes while allowing the story to enforce milestones, access rules, branches
  and consequences.
- Make time and fatigue first-class costs of freedom. Conversation, exploration,
  waiting, rest, exertion and movement can advance authoritative state.
- Record that system rolls are used when uncertain actions matter to persistent
  state rather than letting narration choose the result.

### Scene presence

- Adopt **scene presence** as the active context boundary.
- Define the scene-state payload around current location, story phase, time,
  fatigue, present characters, available local interactions and story progress.
- Keep inactive or inaccessible scene contents out of narration context.
- Keep the HUD/runtime state visible so the player can distinguish narrative
  texture from authoritative recorded state.

### Hollowmere prototype

- Add `prototype/hollowmere-demo.html` based on the supplied Praxis functional
  concept.
- Replace the abstract dungeon as the immediate development target with a small
  Hollowmere starter slice.
- Add a tiny orientation rail with market, bakery and return milestones.
- Add free text actions, local look/talk/explore/rest actions, runtime-owned
  scene transitions, time advancement and fatigue/recovery.
- Preserve the dice concept by requiring an Endurance check for scene movement
  at high fatigue.
- Add a scene-state / Author's Note preview showing exactly what the narrator is
  allowed to know about the active scene.
- Keep the market and bakery scenes explicitly marked as **test fixtures**, not
  final Orbis canon or final Bitterroot map structure.
- Retain the responsive phone layout from the supplied prototype.

### Architecture and hosting

- Establish that Praxis is **Java-driven**. The planned Java runtime / API owns
  authoritative reality; the web GUI is a presentation layer above it.
- Keep authoritative story/session state, action validation, movement/access,
  inventory/economy, fatigue/health, dice/checks, context gating and persistence
  on the runtime side in the production design.
- Keep NovelAI or another narration provider outside authoritative state.
- Keep Praxis separate from Speculus, Fabula and Orbis while the interaction
  model is being proven.
- Keep the GUI loosely coupled to a versioned API contract and redesignable,
  especially for mobile, without changing runtime rules.
- Keep the current HTML/JavaScript prototype explicitly non-production. The
  JavaScript state engine proves the interaction model only.
- Keep the Java runtime implementation as the next architecture step after the
  story/session API contract is stable.
- Serve a temporary work-in-progress landing page at
  `praxis.thehowlingwhispers.com`.
- Serve it from `/var/www/praxis` through the nginx `praxis.conf` vhost.
- Activate HTTPS with a Let's Encrypt certificate and keep HTTP redirected to
  HTTPS while preserving ACME renewal access.
- Confirm automatic certificate renewal with `certbot renew --dry-run`.

## 0.1.0 - Praxis Pre-Alpha

- Establish the repository as the experimental player-facing narrative/state
  bridge between freeform AI text and authoritative game state.
- Confirm Praxis stays completely separate from Speculus and Fabula. No imports,
  forks or shared runtime code while the interaction model is unproven.
- Start from the three-room demo concept as the development target.
- Defer the Java runtime and backend until the interaction model is proven.
- `main` only. No feature branches.
