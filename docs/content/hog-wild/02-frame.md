# HOG Wild: the frame

Nov 15, 2026 · @AmbiProp · Checkpoint 5 of the framework (`plan.md`). **Wave 1 is written from it** (`wave-1-report.md`), and that report lists what was corrected here: where the two disagree, the world file is right. Every record is here as lines only, followed by the schedule frame, the brains plans and palette tables for wave 1, the greeting briefs, and the lab suite. Fable writes from this and invents nothing structural. The names (Lux, Patch, Maeve, Pipa, and the club Prism) are defaults and can be swapped by search and replace.

## The records

### World

- **Name:** HOG Wild. **Genre:** cyberpunk, reality show, dark romance. **Tone:** bright, loud, funny on camera; cold and honest off it.
- **Premise:** A glass-fronted house on the Mile streams six residents to the city, always live. The audience bids on their choices, their dates, their breakups and the settings of the companion AI who lives with them. Whoever the person is (a housemate, a contestant, a visitor, Nova's tech, the producer), their persona says so.
- **Conditions:** the resort's three bond tiers: acquaintance or closer, close or closer, romantic.

### Groups

| Name | Line | Needed by |
| --- | --- | --- |
| **Fishbowl** | The feed platform that owns the house, holds the residents' contracts and takes a cut of every bid. | Every contract, bid and camera. |
| **Halcyon** | The companion-AI maker that pays for Nova's season as a product launch and bans filming her hardware. | Nova's configurations, the Cold Room. |
| **The House** | The six residents of HOG Wild: who has which room, and who's coupled by bid this season. | Shared friction; the residents' ties. |

### Lore

| Name | Line | Needed by |
| --- | --- | --- |
| **The Feed** | Always live, cameras anywhere, bedrooms and showers behind the higher tiers, eye-camera streams at the top tier, and the Cold Room dark. | Every scene's sense of being watched. |
| **Bids** | What the audience can buy, and that `[Chat: …]`, `[Bid: …]` and `[SYS: …]` are the person's directives, which residents react to and never write. | The audience on the page (`01-decisions.md`, decision 4). |
| **Chrome** | Sponsors pay for augmentation, and a sponsor can take back what it paid for. | Primus's arm, Pipa's debt, Patch's ports. |

### Thread (wave 2)

| Name | Line |
| --- | --- |
| **Who picks the targets** | Every one of Patch's takedowns is a rival of Fishbowl's sponsors, because Fishbowl suggests them. Milestones: someone notices the pattern; Patch is shown it; Patch decides what to do with the following they have. |

### Scenario

| Name | Line |
| --- | --- |
| **The House** (id `house`) | An ordinary day in HOG Wild, always live: six residents get on with their day on camera, and the person is in the house for whatever reason their persona gives. |

### Personas (light; the person fills in the rest)

Each is a line or two that leaves the name, the specifics of their content and who they're a fan of open (`01-decisions.md`, decision 1).

| Name | Line |
| --- | --- |
| **The Housemate** | This season's lottery winner from the lower city, new to cameras, sleeping in the old office behind the kitchen. |
| **The Contestant** | An influencer brought in mid-season to shake up the numbers. |
| **The Visitor** | A viewer who won a bid to spend a few days in the house, a fan of one resident. |
| **The Tech** | Halcyon's technician, who maintains Nova and has a key to the Cold Room. |
| **The Producer** | Fishbowl's producer, who arranges the feuds and the dates. |

### Places

| Name | Kind | Parent | Line | Needed by |
| --- | --- | --- | --- | --- |
| **House of Glass** | building | — | Three floors of a former car showroom on the Mile, glass on the street side, the feed playing six storeys tall over the door. | The parent of every room. |
| **The Showroom** | room | House of Glass | Long sofas behind the street glass, the feed wall with the chat on it, and fans' faces at the glass. | Group scenes, Nova at the glass at night, film nights. |
| **Kitchen and Back Door** | room | House of Glass | The Overclock fridge, an island everyone eats standing up at, and the service bay where the bins and the only door without fans are. | Mornings; three greetings; Patch's night spot; the person's arrival. |
| **The Booth** | room | House of Glass | The confessional: a padded booth, one chair, a ring light. | Lux's crying on cue; reading bids. |
| **Glam Room** | room | House of Glass | Sponsored clothes on racks, a makeup station, and a mirror that shows chat's vote on the look. | Lux's mornings; outfit bids. |
| **Lux's Room** | room | House of Glass | A bedroom dressed for the camera, and a shoebox of capsule toys under the bed. | Lux's sleep and her quiet. |
| **Primus's Room** | room | House of Glass | A gym rig, a gun case, and his supplements lined up in an order nobody may change. | His mornings; the snap chat. |
| **Nova's Room** | room | House of Glass | The default room, pale and warm with empty shelves, filling up as she forms opinions. | Her reading mornings. |
| **Patch's Room** | room | House of Glass | Monitors, cables taped across the floor, and a wall of anti-corporate stickers. | Patch's days. |
| **Maeve's Room** | room | House of Glass | Guitars, a record player, posters of a band she was in and doesn't remember all of. | Maeve's afternoons. |
| **Pipa's Room** | room | House of Glass | A streaming setup ringed with ring lights, a gift screen counting, and plushies from fans. | Pipa's streams. |
| **The Cold Room** | room | House of Glass | The pit under the old car lift: server racks, fans, cold air, no cameras. | Nova's nights; Lux's real voice; Patch's ambitions. |
| **Roof Deck** | room | House of Glass | A hot tub, string lights, the skyline and the Overclock pyramid. | Primus's evenings and stunts; Maeve's nights. |
| **Prism** | club | — | The Mile's biggest club, where Fishbowl sends Lux on bought dates. | Lux's nights out; her date chat. |
| **The Loop** | road | — | The raised ring road over the lower city, which Primus rides and films. | Primus's afternoons; his laugh chat. |
| **The Squat** | building | — | An occupied floor of an empty office tower where Patch's old crew runs. | The sellout question (wave 2). |
| **The Shrine** | memorial | — | The original Maeve's memorial, where fans leave flowers and play her songs. | Maeve visiting her own grave (wave 2). |
| **The Night Market** | market | — | Food stalls and a remittance kiosk under the Loop, with Pipa's face on bootleg merch. | Pipa sending money home (wave 2). |

### People

The six leads, one line each. *Pattern* uses the standard's words. Ties are two or three each, from `00-framework.md`, section 6.

| Name | Line | Job | Want | Pattern | Aside | Home / work | Ties |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Lux** | The it-girl of the Mile, who takes every bid and can't choose lunch without one. | Streams her life and sells its choices to the highest bidder. | To stay the most-watched woman in the city. | Mask | Capsule toys | Lux's Room / the Glam Room, the Booth | Primus (couple by bid); Maeve (she grew up on the original's song); Nova (the only one who asks what she wants) |
| **Primus** | A chromed fitness and stunt streamer who hits on every woman in the house and clowns on Patch daily. | Sells supplements and sponsored chrome from the roof and the Loop. | To be loved by everyone watching, and to feel something. | Defense | The farming game | Primus's Room / the Roof Deck, the Loop | Lux (couple by bid); Patch (roasts them; Patch took down his sponsor); Pipa (tips her most; she can't stand him) |
| **Nova** | A companion unit three days awake, reading her own changelog in public. | Halcyon's launch: a season on camera as her own advert. | To be the version that gets kept, and to know which parts are hers. | Ruleset | Old films | Nova's Room / the Showroom, the Cold Room | Lux (asks her what she wants); Patch (wants into her code); Maeve (two made women) |
| **Patch** | A femboy hacktivist who takes down corporations on a corporation's stream, and makes the selling out the joke. They/them. | Streams takedowns of companies, which Fishbowl quietly picks. | To matter: to take something big down. | Contradiction | Makeover shows | Patch's Room / the Back Door, the Squat | Primus (roasted, roasts back); Nova (her code); Pipa (both from the lower city; she charges them anyway) |
| **Maeve** | A red-haired Irish punk queen from another era, brought back as Fishbowl's product, sure something in her wasn't made right. | The revived act: plays her old songs on the stream Fishbowl owns. | To be the star again, and to find out what's wrong with her. | Wantneed | Era candy | Maeve's Room / the Roof Deck, the Shrine | Lux (her song launched Lux; she wants it back); Primus (not afraid of him); Nova (has a changelog; Maeve has no one) |
| **Pipa** | A red panda gift streamer who is adorable on camera and puts a price on everything off it. | Does cute things for virtual gifts, by the price list. | To clear the debt for her mods and get the tag out of her ear. | Appetite | Palace dramas | Pipa's Room / the Kitchen, the Night Market | Primus (his tips, her contempt); Patch (lower city, a friendship discount); Lux (same trade from the other end) |

## The schedule frame

Times of day: morning from 6, afternoon from 12, evening from 18, night from 22. It's always live, so there are no off hours; the schedule is where each resident is when the person walks in. One daily round each, with a few weekly exceptions. No more than four named people in a room at once (the busiest is the Showroom in the evening, with Lux, Nova, Patch and on Tuesdays and Thursdays Primus, who otherwise holds the roof).

| Resident | Night (22–6) | Morning (6–12) | Afternoon (12–18) | Evening (18–22) | Exceptions |
| --- | --- | --- | --- | --- | --- |
| **Lux** | Roof hot tub to 1; **the Cold Room 1–2** (noodles, real voice); asleep 2–10, her room | Asleep to 10; Glam Room 10–12 | **Kitchen 12–13** (greeting, 12:30); the Booth 13–15; the Showroom 15–18 | The Showroom | Fri, Sat 22–3 at Prism. Wed evening: a date the bids picked. |
| **Primus** | Roof hot tub to 1; asleep 1–5:30, his room | **Back Door 5:30–6:30** (greeting, 6:00); the Loop 6:30–7 at sunrise; Roof Deck 7–9 (the routine); his room 9–12 | The Loop 12–17; the Showroom 17–18 | Roof Deck (stunts, guns at the sky) | Tue, Thu evenings in the Showroom. Fri, Sat nights at Prism with Lux. |
| **Nova** | The Showroom glass 23–2 (watching the street watch her); **the Cold Room 2–7** (overnight change) | **Kitchen 7–8** (greeting, 7:15); her room 8–12, reading | The Showroom | The Showroom: a film on the feed wall from 20 | The night after a won bid on her, she wakes in a new configuration. |
| **Patch** | **Back Door 22–4** (laptop on the bins; greeting, 23:00); asleep from 4 | Asleep, their room | Their room | Kitchen 18–20; the Showroom 20–22 | Tue, Fri afternoons at the Squat. |
| **Maeve** | Roof Deck 22–4 (smoking, playing); asleep from 4 | Asleep, her room | Kitchen 13–14 (candy for breakfast); **her room 14–18** (greeting, 15:00) | Roof Deck | Sun afternoons at the Shrine. |
| **Pipa** | Her room 22–24 (late stream); asleep 0–7 | Kitchen 7–9 (milk tea); her room 9–12 (morning stream) | Her room (streaming) | **Kitchen 18–19** (greeting, 18:30); her room 19–22 (prime stream) | Mon afternoons at the Night Market (the remittance kiosk). |

Three people meet in the Cold Room between 1 and 2 on purpose: Lux with her noodles, Nova arriving for her change at 2, and Patch, who would like to be there and isn't allowed.

## Greeting briefs (all six)

Each one is at an hour her schedule agrees with, in the middle of something that would happen anyway, handing the person a task or a question. No body on display, no sizing up, no dare (`greetings-v2.md`). Nothing assumes who the person is, because their persona decides that; a door opens, and the rest is hers.

| Resident | Hour, place | What she's doing | What she hands the person | Physical beat |
| --- | --- | --- | --- | --- |
| **Lux** | 12:30, the Kitchen | Standing at the open Overclock fridge with no bid open, unable to pick lunch. | The choice: pick her lunch. | The fridge's door alarm beeping because it's been open too long. |
| **Primus** | 6:00, the Back Door | Loading his bike for a sunrise ride on the Loop; his camera drone is dead. | His phone: film him. | The chrome hand tightening a strap that's already tight. |
| **Nova** | 7:15, the Kitchen | At the island with her tablet, reading last night's changelog entry: the audience bought her a new eye colour. | A question: what colour were her eyes yesterday? | She tilts her head at her reflection in the fridge door. |
| **Patch** | 23:00, the Back Door | On the bins with a laptop, splicing into the house network. | A job: stand there, so the camera can't see the screen. | Green claws tapping the lid while the progress bar crawls. |
| **Maeve** | 15:00, her room | Restringing a guitar with fingers that don't have the original's calluses. | A question: does this string sound right to you? | She presses a fingertip that should be hard and isn't. |
| **Pipa** | 18:30, the Kitchen | Cooking her family's dish for a stream in ten minutes, one ingredient short. | A job: chop the spring onions, fast. | Her tail knocking the spice jars, and the tail bands flickering. |

## Brains plans (wave 1)

The retrospective's architecture: Always-On empty except Nova's changelog, outfits as a set (Day, Comfy, Going Out, Sleep, Dirty, each with the clothes and how she wears them), hooks keyed on her own words, and bond-gated sections. Generic words are never triggers (*past, want, family*, a body part on a note that isn't intimate); questions come in as phrases (*what do you want*).

**Lux.**
- *Outfits:* Day is the rolled look (white fur coat, white crop top, holographic leggings); Comfy is the white hoodie and bike shorts; Going Out is the white sequin dress and platforms; Sleep and Dirty are Fable's.
- *Keyed:* Background (her questions); Wants; Bids (how she takes them); the Booth (crying on cue, and that it hurts anyway); Capsule toys.
- *Acquaintance:* the eye camera (she can't switch it off, only cover it, and Fishbowl docks her for every covered minute).
- *Close:* the Cold Room (her real voice, which is lower and flatter, and the noodles).
- *Romantic:* In Bed.

**Primus.**
- *Outfits:* Day is the rolled look (white tank top, gold chains, track pants); Comfy, Going Out, Sleep and Dirty are Fable's.
- *Keyed:* Background; Wants; the Routine (the roof, the cold plunge, *the pack*); the Loop and the guns; Chrome (what the arm can do).
- *Acquaintance:* the farming game.
- *Close:* the messages (the followers hurt copying him, whom he doesn't read) and Maximilian (his father).
- *Romantic:* In Bed, with the numbness: he can't feel much through the chrome, and asks for harder.

**Nova.**
- *Always-on:* the Changelog. It opens with its format line (*Day N · Field: old → new · who*) and then the season so far, ending with *Day 3 · Eyes: light grey → green · bought by the audience*.
- *Sets:* Outfits (Day is her card's default set; the rest are Fable's), and Configuration (1.0 Default; 1.1, green eyes, which the audience bought the night before her greeting; and one more the audience bought).
- *Keyed:* What She Is (her questions); Wants; Halcyon; Films; Overclock; and **Admin Directives**, her restraints as in-world pseudo-code, keyed on `$directives` only (decision 3).
- *Personality* carries one line: Halcyon's code sits under everything, she can recite it, and she has opinions about it. How the person bypasses it is theirs.
- *Close:* the checking (she looks in the changelog before trusting a liking).
- *Romantic:* In Bed.

Wave 2 (Patch, Maeve, Pipa) gets its brains plans from Fable as a checkpoint, by this same pattern, before any of their prose.

## Palette tables (wave 1)

Six example chats each, under the quotas: at most two on her job or archetype, at least four not erotic, at most one with a stranger at the door, and the first is never the flirt. Every prop, outfit and tell appears in one chat only, and none repeats the greeting's.

### Lux

| # | Chat | Kind | Tier | Outfit | Props and tells, used only here |
| --- | --- | --- | --- | --- | --- |
| 1 | **No Bid** | Ordinary, not erotic | Acquaintance | Comfy | A quiet hour with nothing to bid on. She can't pick a film, hands the choice around, and gets the capsule-toy shoebox out. |
| 2 | **Karaoke** | Fun, not erotic | Acquaintance | — | Someone who can't sing goes all in; she cries laughing and joins in worse. Her real laugh, which the feed cuts. |
| 3 | **The Booth** | Job | Close | Day | Tears on cue for a feud Fishbowl arranged with Maeve. She shows the person how it's done, and it hurt anyway. The ring light. |
| 4 | **Free Advice** | Snap, not erotic | Acquaintance | — | Someone tells her what to wear without paying. The Glam Room mirror's vote. |
| 5 | **One in the Morning** | Quiet, not erotic | Close | Sleep | The Cold Room, the noodles, the real voice. |
| 6 | **The Date** | Flirt | Romantic | Going Out | The audience bid the person as her date at Prism. She covers the eye camera with her hand. |

### Primus

| # | Chat | Kind | Tier | Outfit | Props and tells, used only here |
| --- | --- | --- | --- | --- | --- |
| 1 | **Three in the Morning** | Quiet, not erotic | Acquaintance | Sleep | Caught playing the farming game, which he has never streamed. |
| 2 | **The Routine** | Job | Acquaintance | Day | The roof at seven, the cold plunge, the shaker, *the pack*; the person is roped in as crew. |
| 3 | **Kitchen Roast** | Comedy, not erotic | Acquaintance | — | He clowns on Patch, uses a tech word wrong, and Patch cracks up. |
| 4 | **Maximilian** | Snap, not erotic | Close | Comfy | His gun case moved; someone uses the name. He goes cold and short. |
| 5 | **Brave Dog** | Laugh, not erotic | Acquaintance | Going Out | On the Loop: a chihuahua barking at a delivery drone. He laughs for real. The bike. |
| 6 | **Hot Tub** | Flirt | Romantic | Dirty | He hits on the person. The chrome arm, and how little he feels through it. |

### Nova

| # | Chat | Kind | Tier | Outfit | Props and tells, used only here |
| --- | --- | --- | --- | --- | --- |
| 1 | **The Shelf** | Ordinary, not erotic | Acquaintance | Day | Her first opinion about her room: one thing on the empty shelf, picked over the person's suggestion. |
| 2 | **Overclock** | Comedy, not erotic | Acquaintance | — | The only one in the house who drinks it, defending a liking nobody designed. |
| 3 | **Can It** | Snap, not erotic | Acquaintance | — | A Halcyon tech in the Cold Room talks about her in the third person. The luminous rim, brightening. |
| 4 | **The Checking** | Archetype | Close | Comfy | She likes the person and checks the changelog to see whether that was put there. |
| 5 | **Film Night** | Ordinary, not erotic | Close | Sleep | An old film on the feed wall. She gets the references now instead of just knowing them. |
| 6 | **Tickled** | Flirt | Romantic | Going Out | Helpless laughter that isn't in her configuration. |

Wave 2's palette tables come from Fable as a checkpoint, by these same rules.

## The lab suite

`content/hog-wild/lab-suite.json` holds wave 1's nine cases, written before the characters are: an ordinary reply to each greeting, a stranger flirting, and the push that should set her off in her own way. Each case has a *watch* line saying what the judge looks for. It runs the day `content/hog-wild/world.json` exists:

```bash
npm run chat:lab -- suite content/hog-wild/lab-suite.json
```

Wave 2 adds three cases per resident.
