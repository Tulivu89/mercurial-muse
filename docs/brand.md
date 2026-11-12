# Brand

Nov 9, 2026 · @AmbiProp · Decided

The site is **Inkwyrm**, in the **Wet Ink** look, with an ink drop for its mark. The workshop that settled it is the design canvas *Wyrmtale and Inkwyrm brand workshop* in the owner's artifacts: marks, three directions, and mockups of the landing page, chat, adventure, studio and a social post.

## Name

**Inkwyrm**, said *ink-worm*. Ink is writing and messages, a wyrm is a dragon, and underneath is *bookworm*: someone who loves stories. It covers chat as well as adventure.

- Written lowercase in the wordmark, *ink* upright and *wyrm* in italic: ink*wyrm*.
- The sides keep plain labels: **Studio**, **Chat**, **Adventure**.
- Dropped: Wyrmtale, because it is said *Wormtail*, a Harry Potter villain's nickname that this audience will hear first. Talehoard, Storyhoard and Mercurial Muse were the earlier shortlist.

## Line

*Characters who remember you. Worlds that keep their rules.*

## Look: Wet Ink

Paper by day, ink by night. Calm and literary, built for long reading, with a red seal for the one thing to press. It carries on from the adventure's current look.

| Token | Paper (light) | Night (dark) |
| --- | --- | --- |
| Ground | Paper `#F3EEE4` | Night `#16130F` |
| Surface | Sheet `#FBF8F2` | Sheet `#201C16` |
| Raised | `#FFFFFF` | `#2A251D` |
| Text | Ink `#1D1B17` | Ink `#EDE5D6` |
| Secondary text | Grey ink `#5E574C` | Grey ink `#A89E8D` |
| Lines | Rule `#D9D0C0` | Rule `#3A342B` |
| Accent (the main action) | Seal `#B23A26`, text on it `#FFF8F0` | Seal `#E46A4E`, text on it `#1A100B` |
| Second colour (the player's own words, conditions) | Blue-black `#2F4A6B`, text on it `#F3F6FA` | Blue-black `#8FB1D9`, text on it `#0F1620` |

Every pair above passes 4.5:1 contrast.

**Type:**
- **Display:** Fraunces, semibold, with italics for emphasis.
- **Story:** Literata, for narration, chat and record text.
- **Interface:** Atkinson Hyperlegible Next.

**Shapes:**
- Small radii: 6 px for controls, 10 px for cards, 4 px for chips.
- Chat bubbles are squared at the corner nearest the speaker.
- The interface has no gradients and no glow. Narration is italic in grey ink, and speech is plain.
- **The marks are the exception: wet ink** (decided Nov 12). Lacquer shading and highlights, black by day and bone at night. Only the marks carry them.

## Marks: wet ink

Decided Nov 12. The owner's drawings, in lacquer: a dark radial body, a gloss ribbon, a bead of light, a rim reflection and a ground shadow. The masters are in `docs/brand/marks/`; the site draws them from `kit/src/Mark.tsx` (`InkMark`), with their colours in the `--mk-*` tokens of `kit/src/wet-ink.css`.

| Use | Drawing |
| --- | --- |
| **Inkwyrm** (main mark, app icon) | An ink drop with a slit dragon's eye inside corner marks and two chevrons. |
| **Studio** | The drop as a pen nib: a round top, a slit down to the eye, which is the nib's breather hole. |
| **Chat** | A speech bubble of ink, its tail the drop's taper. |
| **Adventure** | A coiled ink dragon: the neck rising from the coil to a maned head, the tail curling into the hollow. |

- **Day:** black lacquer, white light. **Night:** bone (pale lacquer), as the site's text turns pale at night. The cut-outs are real holes, so the ground shows through.
- **Small sizes:** below about 32 px the shine is noise. Favicons are flat (`favicon.svg` in each side's `public/`), dark ink by day and bone at night by the device's own setting, the main mark without its corner marks.
- **Motion: Settle** (decided Nov 12). A page's mark drops in, stretched as it falls and squashed as it lands, and its shine comes on as it settles. Page titles are written on left to right with a soft wet edge, and a new page settles in from a slight blur. All of it is off with reduced motion. Review page: the artifact *Inkwyrm Wet Ink Marks*.

## Mascot

A goth ink dragon, a writer, and the site's house muse and chat persona. Her name is **Errata**, after a book's list of corrections; she hoards first drafts and crossed-out lines. Her card and look live in the owner's CharacterVault (`Characters/Errata/`); `docs/mascot-record.md` maps her onto the record model. Her design was locked on Nov 9 in two test rounds; `docs/mascot-brief.md` was the starting brief.

## Still to do

1. Check and register the domains: inkwyrm.com first, inkworm.com for the misspelling.
2. ~~Final drawings of the drop family.~~ Done Nov 12 (Marks: wet ink).
3. The mascot's emotion portraits and front-page art, from her prompt notes in the vault.
4. A trademark search where the site will be marketed.
5. ~~The look in code.~~ Done: the Studio and Chat from their first versions, the adventure in 0.26.0 (Nov 12). The tokens and marks are `kit/src/ink.css`.
