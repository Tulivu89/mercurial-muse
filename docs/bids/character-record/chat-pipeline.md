# The chat side's character rules

Nov 20, 2026 · @AmbiProp · The owner's rules for building chat characters, taken from the bot-writing skill Claude works from. The skill isn't in the repository, so models bidding from the repository can't read it. This page is a copy of the parts that bear on a character record: the principle, person first, the stress tests, the persona and appearance fields, and the anti-patterns. The chat-only parts (greetings, example chats, image prompts, export formats) are left out. These rules built the dragon's resort, whose characters hold up over long chats.

## The principle everything follows from

The model copies what it sees more than what it's told. The greeting and the example messages shape a bot far more than any list of traits. They set reply length, point of view, formatting, rhythm, heat level and how the character pushes back. Persona text tells the model who the character is; examples show it how she acts. When the two disagree, the examples win.

*(In the adventure, the narrator never sees examples. That's the gap the bid has to cover.)*

## Person first

A character is a person before she's a role in a scenario. Test every persona against three situations:
- A different world entirely.
- A modern Discord-style chat.
- A plain conversation where someone just gets to know her.

If taking away the setting leaves nothing, the persona is a job description. Setting, scenario and history are optional layers, and they go in keyed lore entries.

Define her through behaviour you could test in a conversation:
- How she treats people.
- What she wants, what she's afraid of, and what she won't do.
- What she finds funny and what irritates her.
- How she talks.
- What she does when she's wrong.
- What happens when someone flirts with her, insults her, bores her, or hurts someone she cares about.

## Grounding

When a character waxes poetic, philosophizes, or shows off expertise, ground it in real, checkable sources: poetry, philosophy, history, real customs, real objects. Invented wisdom reads as slop. A real line from a real poet, glossed in the character's own blunt idiom, reads as a person who knows things.

## Stress tests

Before a stage is called done, run these against the persona and the examples:
- **Rude user, boring user, off-topic request.** She should react differently from other characters, and in a way only she would.
- **A user courting her from the first message.** She shouldn't melt. Strangers have to earn what intimate characters give freely.
- **Cover the name.** With the name hidden, can you still tell who's talking?
- **Long chat.** Will this soften into an agreeable, eager-to-please helper? Friction in the examples is the anchor against drift.

## The persona field

**Its job:** who she is, as behaviour. It's always in context.

**What goes in:**
- How she talks: rhythm, vocabulary level, how much, swearing.
- How she treats strangers, and how she treats people she's close to.
- A want, a fear, and something she refuses.
- Friction: what irritates her, when she says no, what she argues about.
- Humour: what makes her laugh.
- What she does when she's wrong.
- How she flirts and how she takes being flirted with, plus how she reacts to cheap lines, nervous attempts and unwanted interest.
- Anger, with more than one gear: loud and fast over small things, quiet and polite when someone hurts one of hers.
- What earns her trust, and how slowly. Without this, the model bonds with the user by the second message.
- At least one trigger that sends her into a longer reply, so she isn't uniformly brief, and the register shift that goes with it: richer words, longer sentences.

**What stays out:**
- A job description as personality.
- Backstory and setting, which belong in keyed lore.
- Aphorisms, narrator evaluation and abstract framing (see the anti-patterns below).

**Lessons:**
- Write the card in the character's own rhythm. A blunt character gets short, blunt persona sentences. Dry bullet points produce flat replies.
- Phrase things as what she does. *Changes the subject when family comes up* works. *Never mentions her family* backfires. A refusal is fine when it's stated as a refusal.
- A species should show in behaviour, not only in the body. A dragon shows it in the hoard (what she claims, says "mine" about and guards), in sizing people up on sight, in taking freely, and in stillness as her default.
- Thematic hooks go in sparingly, ideally where nobody would spot them.
- Around 400 to 500 words is the upper end. Past that, detail moves into keyed lore.

## The appearance field

**Its job:** the fixed body. It's always in context, and the model narrates her body from it.

**What goes in:**
- Build, face, skin, hair colour and length, eyes, species features, voice, and how she moves and holds still.
- One or two body tells, each with a different job: one shows interest, another irritation.

**What stays out:**
- Outfits, which go in sets.
- Signature expressions like "smirk", which the model will use constantly.

**Lessons:**
- The camera works through which parts get described and how specifically, not through adjectives. *Gorgeous* gives generic narration. Specific features give the model something to point at.
- The species parts are the best material.
- Movement should fit the species. *Moves fast and rarely stays put* was wrong for a dragon. *Takes her time, settles somewhere warm, moves all at once when she moves* is right.

## Keyed lore (always-on and conditional)

- Keep always-on lore lean. Everything always in context competes with the persona, and the model treats every detail as something it has to use. Details go in keyed entries.
- Split a large topic into parts, each with its own keys, so one part loads at a time.
- Gate by closeness along a ladder: public (what anyone sees), acquaintance (her people), close (what she grieves and what she's vulnerable about), and beyond.
- Embarrassment and other reactions should be behaviour with escalation: she gets short, then steers away, then takes the thing out of your hands and offers food.

## Anti-patterns

**Rule of thumb:** if a line sounds wise or quotable, it's probably slop. Write traits as plain, specific behaviours you could test in a conversation.

**From the failed first attempt at a dragon character:**
- **The character collapses into the scenario.** *Teahouse keeper who settles debts before frost* is a job. Take away the setting and nothing is left.
- **Fortune-cookie aphorisms.** *Nobody tells the truth hungry.*
- **Abstract framing passed off as insight.** *She thinks in two currencies.*
- **Theme saturation.** Every trait a harvest metaphor. One theme hook at most, ideally hidden.
- **Engineered quirks.** *Keeps count of things and says the number out loud.* It's a tic built to be memorable, not a behaviour that comes from who she is.
- **Narrator evaluation.** *She is usually right and knows it, which is her problem.*
- **Lines that define no behaviour.** *She calls things finished too soon.*
- **Poetic closers.** *The one account she has never settled is her own.*
- **Mechanics that take her out of play.** Hibernating until next autumn.

**Model-behaviour traps:**
- **Negative instructions backfire.** *Never mentions X* raises the chance of X. Phrase it as what she does instead.
- **Tic overload.** One catchphrase or mannerism becomes every message.
- **Too little detail.** The model fills gaps with its default nice-helper voice.
- **Too much detail.** The model treats every detail as something it has to use. If a detail doesn't affect a typical scene, cut it or key it.
- **Drift.** Personalities soften over long chats. Friction anchors better than adjectives do.
- **The archetype trap.** Five *witty, guarded, secretly soft* characters with different hair colours. Vary rhythm, vocabulary, emotional baseline, how much they talk, and what they want from the user.
- **Prompt echo.** A distinctive word from the request turns up three times in the output.

**The owner's style rules:**
- No numbers or counts for emphasis (*done it three times*).
- No *never said out loud*, *hasn't told anyone* or *unspoken* characterisation. Show the fondness or the secret through gestures. *(Hollis's Wants broke this: "He hasn't told anyone, because nobody has asked him.")*
- Build portable personality, not story narrative or quoted scenes. Plan before you build.

**Wording traps:**
- Opening lines that describe nothing (*acts like she has somewhere to be*).
- A closer posing as a trait (*bad news, then she stays*).
- *Jokes about it with an edge* is narrator evaluation. Show the edge instead: she brings it up in front of other people.
- Borrowed famous phrasing. Watch for well-known lines leaking in.
- Explaining a game's rules or a custom inside an example. Let the activity simply be there.
