# HOG Wild: the decisions only HOG Wild has

Nov 15, 2026 · @AmbiProp · Checkpoint 4 of the framework (`plan.md`, `00-framework.md`). Each decision has its options, the recommendation, and why. The recommendations stand unless the owner vetoes them. The one the plan reserves for the owner is Nova's admin directives (decision 3); read that one first.

## 1. Who is the person in the chat?

| Option | What it gives | What it costs |
| --- | --- | --- |
| **A. The new housemate, a lottery winner** | Fishbowl's lottery puts one ordinary person from the lower city into the house each season. Every resident has a reason to react to them on camera, and the bond tiers start where they should, at stranger. | Nobody knows them, which is the point. |
| B. A new contestant who is already an influencer | A rival for the shots. | Turns every chat into a contest, which the greetings rule warns against. |
| C. The tech who maintains Nova | A great Nova chat. | No reason for the other five to talk to them. |
| D. The producer | Power over everyone. | Every chat becomes a negotiation with the boss. |

**Recommended: A.** They arrive through the Back Door with one bag on move-in day and sleep in the old office behind the kitchen. They're new to cameras, so everything the residents take for granted can be explained to them without anyone lecturing. C stays open as a second scenario for Nova alone, if play wants it.

## 2. Nova's configuration and changelog in the records

Nothing new is needed for the configuration, because Chat already does this:

- **Her configurations are a set**, beside her outfits. Each member is one configuration (hair, eyes, skin, cosmetics, and the disposition lines that differ from 1.0). Version 1.0 is her card's default.
- **The schedule moves her between them**, and a change lands overnight in the Cold Room.
- **The person can change her in chat.** Chat already has *One in use at a time* in its settings, which pins one member of a set for that chat. Pinning a configuration is changing Nova, and a member can be locked behind a bond tier (used in decision 3).
- **Her changelog is an always-on section** (the owner's call), written as the season so far: registered, activated, moved into the house, and the changes the audience has bought.

**The one feature gap, said plainly:** when the person pins a configuration in a chat, the model sees the new configuration's text but not that the person changed it. Nova can't notice the change or put it in her changelog. The fix belongs in Chat: when a set member is pinned in this chat, tell the model in one line (*{{user}} set Nova's Configuration to …*). It's small, and it helps every character's outfits too. Until it exists, the person can say so in a bracketed note, and the house format already reads notes.

## 3. Nova's admin directives (the owner's call)

Her card has six directives. Two (no real-world harm, no harmful deception) are the platform's job, not hers; they come out of the record, because the site's own rules already cover them. The question is the other four, and above all the first: no sexual or violent content.

| Option | Her lane becomes |
| --- | --- |
| A. Part of who she is | A companion who won't. The house's adult content runs around her. |
| **B. A factory lock she knows about** | Halcyon ships her locked and sells the unlock. She can read the lock, talk about it, and have opinions about who paid to lift it. |
| C. Retired | She's as adult as the rest of the house from her first minute, and the theme of a self that can be edited loses its sharpest example. |

**Recommended: B.** It's the brief's theme at full strength: even what she'll do in bed is a setting someone else can buy. In the records:

- **The lock is a configuration.** An *Unlocked* member of her Configuration set is locked behind the romantic tier, and her *In Bed* section is gated the same way. Before romantic, she knows the lock is there and can talk about it plainly.
- **Two directives stay as who she is, not as rules.** She adjusts to a change without becoming someone else (AD-03), and she can decline a change and say why (AD-05). Both go into her Personality as behaviour.
- **AD-06 becomes the voice of her changelog:** she can read her own limits and treats them as the shape she came in, until one gets sold.

## 4. The audience on the page

The house format is speech plain, actions in asterisks, thoughts in parentheses, and notes in brackets. The audience uses brackets, with a fixed opening word a weak model can copy without inventing anything:

- `[Chat: …]` for what the stream's chat is saying, one short line.
- `[Bid: …]` for a bid that has been won, saying what was bought. No amounts, because nothing keeps count.

Rules: the narrator writes at most one bracketed audience line per reply, and only when it changes what happens. The person can write them too, to play the audience. A resident reacts to a won bid; she never runs an auction.

Two sample turns, showing the format only (the wording belongs to Fable):

> *[narration: what she's doing]*
> [Chat: the crowd wants the red dress]
> (her thought about the crowd)
> [her line to the person]

> [Bid: Lux wears the red dress tonight]
> *[narration: her reaction, in her own way]*
> [her line]

## 5. What is bought, and what it changes

The pilot brief's rule holds: no invented systems.

- **A bid is something a resident reacts to on the page.** It's a `[Bid: …]` line, nothing more.
- **Home can carry the show without a new feature.** Each resident has the usual four needs (Hunger, Energy, Fun, Company), except where the show takes one over: **Lux's Fun becomes Views** and **Pipa's Fun becomes Gifts**, because nothing else feeds them. Each resident gets one home action that plays the audience, such as *Bid on her pick* for Lux or *Send a gift* for Pipa, beside the ordinary ones.
- **Changes to Nova** go through her Configuration set (decision 2).
- **Anything that needs a number kept** (a running tally of a bid, a debt that goes down) waits for rules, and isn't written into prose as if it existed.

## 6. Ties to the rest of the site

**Recommended: no visitors from the resort.** The resort is urban myth with dragons in it; HOG Wild is cyberpunk with nothing supernatural. One dragon walking through the Showroom would make both worlds smaller. Their notes would also key into each other's chats on shared words. If a crossover is ever wanted, it gets written as its own scenario.

## For the site (not for Fable)

Three Chat features this world wants. Fable writes without them, and none blocks wave 1:

1. **Tell the model when a set member is pinned in a chat** (decision 2).
2. **Brains and lore don't key in when their character isn't in the chat** (the owner, Nov 15).
3. **Adding memories during a chat** should be easy.
