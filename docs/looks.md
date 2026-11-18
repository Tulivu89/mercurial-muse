# Looks

Nov 18, 2026 · @AmbiProp · First build, for testing

A look is a skin the site wears over Wet Ink. A world names one, and while someone is inside that world, the header, controls, headings and story change to it. Everywhere else the site stays Paper or Ink Night. It started because HOG Wild clashed with the site: one look can't serve every genre.

The study is the design canvas *Inkwyrm Cyberpunk Skins* in the owner's artifacts: the three directions mocked up on Nova's kitchen chat, the motion board, the night comparison, and Outrun against a bid's CSS.

## Decided

- **Night is Ink Night.** Blue-black ink instead of brown. Ground `#12151A`, sheet `#1A1E25`, raised `#222731`, text `#ECE7DD`, grey ink `#A3A7B0`, rule `#303642`, seal `#E8735A` with `#14100D` on it. The map's night ground cooled with it.
- **A world chooses its look** (`world.look` in `core/records/schema.ts`): Live Feed, Outrun, Phosphor or Halcyon. Unset, it is Wet Ink. The Studio sets it on a world's About page. HOG Wild wears Live Feed.
- **The player decides** under Settings › Look: *Follow the world* (the default), *Wet Ink everywhere*, or one look everywhere. The same choice holds in Chat, the Studio and the adventure.
- **Where it applies.** Chat follows the world of the chat, character or home in view. The Studio follows the open world, so an author sees what players will. The adventure and the Overview wear a look only when the player picked one for everywhere; modules don't carry a look yet.

## How it is built

- `kit/src/look.ts` puts `data-look` on `<html>` beside `data-theme`, and loads the look's fonts from Google Fonts the first time it is worn.
- `kit/src/looks.css` redefines the tokens of `ink.css` and gives the shared parts their behaviour: the site header, `.btn`, `.icon-btn`, `.bar-btn`, `.chip-btn`, `.seg`, `.send`, chat bubbles, headings, portraits, `.ink-write` and the marks.
- Live Feed, Outrun and Phosphor have no day version, so they bring night with them (`theme.ts`). The map, the rules' colours and the marks then take their night values. Halcyon follows paper or night.
- Corners are tokens now: `--r-ctrl` (6 px), `--r-card` (10 px) and `--r-chip` (4 px) in `ink.css`, read by every side's stylesheet. A look changes them in one place. `--mono` is a token too.
- `.send.working` marks Send while a reply is written, in Chat and the adventure, so a look can show it. In Chat, `.turn.streaming` marks the reply as it arrives.

## The looks

| Look | Ground | Acts | Player | Faces | Comes alive |
| --- | --- | --- | --- | --- | --- |
| **Live Feed** | Navy-black `#0A0E15` | Magenta `#FF4D94` | Cyan `#46D9F5` | Chakra Petch headings, IBM Plex Sans story | Titles arrive in steps with a colour split; Send jolts when touched and pulses on air while a reply is written |
| **Outrun** | Violet-black `#090014` | Magenta `#FF3DF0` | Cyan `#4DF5FF` | Orbitron headings, Chakra Petch interface, IBM Plex Mono story | The owner's Character Engine theme: Send is a seven-bar level meter, dim at rest, the rainbow on hover, fast and magenta while the reply is written; buttons light cyan; a horizon grid in the header |
| **Phosphor** | Black-green `#060908` | Amber `#FFB547` | Green `#5CF29A` | Space Mono headings, IBM Plex Mono throughout | Replies as a transcript with the speaker above; a block cursor while a reply streams; buttons light like a selected line |
| **Halcyon** | `#0D0C12`, or `#EEF0F4` by day | Rose-gold `#F4AE93` (`#A64B33` by day) | Ice `#A6DBFF` (`#1F5F8C` by day) | Syncopate headings, Instrument Sans story | Clipped corners; titles flicker in like a signal; a light passes over Send when touched, and keeps passing while a reply is written |

Every text pair passes 4.5:1, and story text and narration pass 7:1.

## What every look keeps

- Story text in a reading face at 7:1 or better. Display faces only on headings, names and buttons.
- Scanlines on the header band and on portraits, never behind words someone reads.
- Motion when something arrives or is touched, and while a reply is written. Nothing loops on text, and all of it stops under reduced motion (the meter shows a fixed reading).
- One colour to act and one for the player, as Wet Ink has seal and blue-black.

## From the owner's Outrun, left out on purpose

The Character Engine theme also had a full-screen scanline and vignette layer, a moving floor grid, a vsync roll every 9 seconds and a tape dropout every 17. They sit over or behind the story, and they move while someone reads, so they stay out. The grid is in the header band, still. If wanted, they could come back as an *Extras* switch that is off by default.

## From the bid

A bid (`ai_studio_code.css`) proposed Outrun, Cold Signal and Ceramic as `data-theme` values. What came from it: redefining the same token names, colouring the marks through `--mk-*` (the drop's eye glows in the look's colour), and the stepped title reveal and the marks' snap. What changed: looks use their own attribute, because `data-theme` is the player's paper or night and gets reset; reduced motion now wins; the corner tokens are real; fonts are loaded. Cold Signal went into Live Feed and Ceramic into Halcyon's day version.

## Still to do

1. The owner tries each look in Chat and the Studio, and says what is too busy or too quiet.
2. A look for adventure modules launched from a world (carry `look` through `inkwyrm.launch`).
3. The rest of the shared parts the looks don't reach yet: the Studio's pickers, Chat's collection cards and tabs, the adventure's own controls. Where a side hand-rolls a part that `wet-ink.css` already has, it moves onto the shared one.
