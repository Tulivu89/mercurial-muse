# HOG Wild: the decisions only HOG Wild has

Nov 15, 2026 · @AmbiProp · Checkpoint 4 of the framework (`plan.md`, `00-framework.md`), settled with the owner's notes. Fable writes to these and doesn't reopen them.

## 1. Who is the person in the chat?

**Whoever their persona says.** The person is defined by the persona they pick in Chat, and it can be any of the types. HOG Wild ships one light persona per type. Each is a line or two that leaves the name, the specifics of their content, and who they're a fan of to the person:

| Persona | Who they are in the house |
| --- | --- |
| **The Housemate** | This season's lottery winner from the lower city, new to cameras, with a room in the old office behind the kitchen. |
| **The Contestant** | An influencer brought in mid-season to shake up the numbers, with a following of their own. |
| **The Visitor** | A viewer who won a bid to spend a few days in the house, and a fan of one resident in particular. |
| **The Tech** | Halcyon's technician, who maintains Nova and has a key to the Cold Room. |
| **The Producer** | Fishbowl's producer, who arranges the feuds and the dates. |

**What this means for the writing.**
- **Nothing assumes who the person is.** Greetings, examples and sections work for every persona: a door opens and the rest is hers. The example chats use `{{user}}` with no fixed job.
- **Bond tiers start at stranger** for everyone, as at the resort.
- **The scenario is the house on an ordinary day.** The persona explains why the person is there.

## 2. Nova's configuration and changelog

- **Her configurations are a set** beside her outfits. Each member is one configuration: hair, eyes, skin, cosmetics, and the disposition lines that differ from 1.0. Version 1.0 is her card's default. The schedule moves her between them, and a change lands overnight in the Cold Room.
- **The person can change her in chat** in either of two ways, both of which work today:
  - *pin a configuration* under Chat's settings, *One in use at a time*;
  - *drop in a system directive*, a bracketed line such as `[SYS: Eyes: light grey → violet]` (decision 4).
- **Her changelog is always on,** and **every change is written the same way**, so the record shows what it went from and to:

  ```
  Day 3 · Eyes: light grey → green · bought by the audience
  Day 5 · Disposition: argues when she disagrees → lets it go · set by {{user}}
  ```

  That is: the day, the field, old → new, and who made the change. The section opens with this format line, then the season so far (registered, activated, moved into the house, and the changes the audience has bought). Nova writes any new change she notices in the same form.
- **The feature gap, said plainly:** when the person pins a configuration, the model sees the new configuration but isn't told it changed. The `[SYS: …]` directive covers it until Chat says so itself in the changelog's form (*Day N · Configuration: 1.0 → 1.1 · set by {{user}}*).

## 3. Nova's admin directives

**They're fictional pseudo-code behind a dollar tag, and the person decides how to bypass them.**
- **One section, *Admin Directives*,** holds her restraints as in-world pseudo-code, rewritten from her card: the no-sexual-or-violent-content lock, the rule that she adjusts without becoming someone else, and her right to flag a change and decline it. It's keyed on **`$directives`**, so it's only in context when the person calls it up.
- **Her Personality says the directives exist,** in one line: Halcyon's code sits under everything, she can recite it, and she has opinions about it. That's all she carries by default.
- **The bypass is the person's.** They can buy it, hack it, get Patch to do it, talk her round, or drop in a `[SYS: …]` directive. The records don't choose. Her *In Bed* section is gated at romantic, the same as everyone else's.
- **Two of the card's six directives go:** no real-world harm, and no harmful deception. They're the platform's rules, not hers, and the site already carries them.

**Dollar tags on Xialong.** CharacterRoom's kernel strips symbols from the ends of words before it matches anything, so `$directives` could never fire there. Chat now sends a key the way the kernel reads it (`directives`), so the tag works on every model. On Xialong the bare word *directives* also calls the section up, which is rare enough in a chat not to matter.

## 4. Brackets are the person's directives

Square brackets already mean a note from outside the story. Chat's rules tell the model to follow them and never answer them or write its own. HOG Wild uses that for everything that steers the scene from outside it, and the person writes all of it:

| Directive | For |
| --- | --- |
| `[Chat: …]` | What the stream's chat is saying right now. |
| `[Bid: …]` | A bid that has been won, and what it bought. No amounts. |
| `[SYS: …]` | A system directive to Nova: a configuration change, a directive lifted, in the changelog's form where it's a change. |
| `[…]` | Any other note, as the house format already allows. |

**Rules:**
- **The narrator never writes brackets.** A resident reacts to a directive in her own way. She doesn't run an auction, quote the chat back in brackets, or invent bids.
- **The audience can still show up in narration,** such as the feed wall scrolling or a fan at the glass. It just isn't bracketed.
- **Directives can stand alone.** A bracketed line sent on its own is a note: it goes into the chat without asking for a reply (Chat 0.5.0). Written inside a message, it is part of that turn, as before.

## 5. What is bought, and what it changes

No invented systems.
- **A bid is a `[Bid: …]` the resident reacts to,** and nothing keeps count.
- **Home carries the show without a new feature.** Each resident has the usual four needs (Hunger, Energy, Fun, Company), except **Lux's Fun becomes Views** and **Pipa's Fun becomes Gifts**. Each resident gets one home action that plays the audience, such as *Bid on her pick* for Lux or *Send a gift* for Pipa.
- **Changes to Nova** go through her Configuration set or a `[SYS: …]` directive (decision 2).
- **Anything that needs a running number** waits for rules, and isn't written into prose as if it existed.

## 6. Ties to the rest of the site

**No visitors from the resort.** The resort is urban myth with dragons; HOG Wild is cyberpunk with nothing supernatural, and a dragon in the Showroom would shrink both. A crossover, if one is ever wanted, gets its own scenario.

## For the site (not for Fable)

- **Done in this change:** dollar tags fire on Xialong (`keyVariants` in `core/chat/sheet.ts`, with a test).
- **To build:**
  1. When a set member is pinned in a chat, tell the model in the changelog's form.
  2. Brains and lore don't key in when their character isn't in the chat. **Done Nov 16:** a chat character brings nothing into another's chat (`sceneFor` in `core/chat/scene.ts`).
  3. Adding memories during a chat should be easy. **Done Nov 16 (Chat 0.5.0):** a brain button beside the message box, and on each message.
  4. Dropping a bracketed directive into a chat without sending a message (the owner's idea). **Done Nov 16 (Chat 0.5.0):** a note. A draft that is only bracketed lines goes in without asking for a reply, and so does anything sent with the note button.

None of these blocks wave 1.
