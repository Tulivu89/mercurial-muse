# Mascot brief: Errata, Inkwyrm's ink dragon

Nov 9, 2026 · @AmbiProp · Hand-off for the visual design chat

Everything a separate chat needs to design the mascot's look and write her NovelAI image prompts. Her personality and body text are in `docs/mascot-record.md`; this brief covers only how she looks.

## Who she is

- **Inkwyrm** is an AI roleplay site with three sides: Studio (make characters and worlds), Chat (talk with them), Adventure (play their world as a text adventure). Its line: *Characters who remember you. Worlds that keep their rules.*
- **Errata** is its mascot and house muse: a goth ink dragon and stalled novelist who reads your drafts and won't write them for you. Quiet, deadpan, dry, cold-handed, a night owl.
- She will be the site's face (front page, social posts, loading screens) and a chat character with emotion portraits.

## The look in one sentence

A goth girl from the first reference, drawn in the inked, painterly style of the second (the autumn dragon, Qiulong), recoloured to ink black and paper white with one red.

## Palette (the site's Wet Ink look)

- Ink black `#1D1B17` and paper white `#F3EEE4` for almost everything.
- **One red, Seal `#B23A26`: the plaid skirt only.** Nothing else in her colouring is red.
- Pale grey for her eyes and the grey band in her hair.
- No gold, orange, warm jewel tones or glow: those belong to Qiulong's art, not hers.

## Body (fixed)

- Slender, a little tall. Narrow shoulders, long arms, long fingers, small chest, narrow waist, wide hips.
- Porcelain-pale skin. Beauty mark under her left eye; a thin scar through her right eyebrow.
- **Hair:** straight, past her waist, white at the roots and darkening through grey to black at the ends, as if dipped in ink. It hangs across one eye.
- **Eyes:** pale grey with slit pupils.
- **Horns:** two, smooth, glossy black like wet ink, curving back from the temples.
- **Scales:** black, from the knuckles up the forearms, running into ink stains on her fingers.
- **Tail:** long and slim, black, tapering to a **nib-shaped tip** that drips ink.
- **Poses:** sits sideways in chairs with her knees up, tail wrapped round a chair leg. Still, not bouncy.

## Look (changeable)

- Black lipstick, heavy winged liner, smoky shadow, black nails.
- Silver rings, thin bracelets, studs and hoops up both ears.
- Black off-shoulder crop tee, **red plaid pleated skirt**, black stockings with ink on them.
- A fountain pen behind her ear or through her hair.

## How she ties to the logo

The logo is an ink drop with a slit dragon's eye. Her slit pupils and the ink-drop or nib tip of her tail should echo it, so that she and the mark are plainly related. A tail curl that echoes the drop's shape is a plus.

## What we need, in order

1. **A character sheet:** front view and three-quarter view, full body, plain background, to fix the design.
2. **A headshot avatar,** square, readable at 48 px.
3. **Key art:** full body, seated sideways in a chair with a manuscript, for the front page.
4. **Emotion portraits** later, in CharacterRoom's 24-emotion set, at 256×256.

## Rules

- **Safe for a public front page.** She's an adult and can be stylish and a little sultry, but the brand art stays clothed and non-explicit.
- She reads as a dragon from her horns, tail, scales and eyes. No wings unless the owner asks.
- Keep the face from the goth reference: heavy brows, the beauty mark, the scar, and a tired, unimpressed look.

## Source prompts (from the owner's two reference images, NovelAI Diffusion V5)

**Style source: the autumn dragon (Qiulong).** Settings: 28 steps, scale 4.8, CFG rescale 0.4, Euler Ancestral, Karras, 832×1216.

Base prompt:
```
1::artist: Atey Ghailan,:: 1:: artist: mike mignola,:: 1:: artist: Jamie Hewlett,:: 1:: artist: Moebius,:: 1:: artist: Becky Cloonan,:: 1.7:: artist: lesly oh,:: 1:: artist: aleksandra skiba,:: 1:: artist: emmanuel viola,:: .4:: artist: galmesh rosewood,::

best quality, masterpiece, very aesthetic, high complexity, 2::painterly, cel shading, colored lineart, western comics (style), oil painting (medium),:: high contrast, backlighting, light particles, depth of field, A vivid fantasy illustration that blends crisp graphic-novel inking with loose painterly color. Thin, elegant ink lines with tapering strokes define the forms, while visible brushstrokes give texture to the color fills. Saturated, luminous color: rich jewel tones, warm light playing against cool shadow, glowing highlights, and a strong rim light separating the figure from the background. Shading falls in clear, confident shapes with soft painted edges where light meets shadow.
1girl, solo, confused, head tilt, raised eyebrow, frown, spoken question mark, transparent background
```

Undesired content:
```
1::artist:urushihara satoshi, artist:shirow masamune,::, artist: d-rex,
lowres, worst quality, low quality, bad anatomy, bad hands, jpeg artifacts, watermark, signature, photorealistic, 3d, 2.5d, limited palette, thick lineart, monochrome, greyscale, simple background, halftone, sketch, glossy, shiny, dark, in shadows,
```

**Feature source: the goth girl.** Its style was semi-realistic 2.5D, which is not what we want. Take only the character caption:
```
girl, human, goth aesthetic, pale skin, porcelain skin, slender build, long white hair with grey tips, straight hair, side-swept bangs, grey eyes, almond-shaped eyes, long eyelashes, thick eyelashes, dark circles, black mascara, black eyeliner, winged eyeliner, smoky eyes, dark eyeshadow, full lips, black lipstick, small beauty mark under left eye, small scar on right eyebrow, multiple ear piercings, studs, slender neck, prominent collarbones, narrow shoulders slender arms, delicate wrists, long fingers, black nail polish, silver rings, thin bracelets small bust, narrow waist, flat stomach, wide hips, slender thighs, pale legs, black t-shirt crop top, off-shoulder, pleated red plaid skirt,
```

## A first prompt to start from

These are untested starting points; the design chat should iterate on them.

**Base prompt:** the Qiulong style prompt with its colour sentence swapped for ink and one red:
```
1::artist: Atey Ghailan,:: 1:: artist: mike mignola,:: 1:: artist: Jamie Hewlett,:: 1:: artist: Moebius,:: 1:: artist: Becky Cloonan,:: 1.7:: artist: lesly oh,:: 1:: artist: aleksandra skiba,:: 1:: artist: emmanuel viola,:: .4:: artist: galmesh rosewood,::

best quality, masterpiece, very aesthetic, high complexity, 2::painterly, cel shading, colored lineart, western comics (style), oil painting (medium),:: high contrast, depth of field, limited palette, black and white, spot color, red accent, ink wash, A fantasy illustration that blends crisp graphic-novel inking with loose painterly ink wash. Thin, elegant ink lines with tapering strokes define the forms, while visible brushstrokes give texture to the fills. Ink black and paper white, with a single red: the plaid skirt. Shading falls in clear, confident shapes with soft painted edges where light meets shadow.
1girl, solo, full body, standing, front view, unimpressed, half-closed eyes, transparent background
```

**Character caption:**
```
girl, Errata, ink dragon, dragon girl, goth aesthetic, pale skin, porcelain skin, slender build, long straight hair, white hair, gradient hair, grey hair, black hair tips, hair over one eye, grey eyes, slit pupils, thick eyebrows, long eyelashes, dark circles, black eyeliner, winged eyeliner, smoky eyes, black lipstick, beauty mark under left eye, small scar on right eyebrow, multiple ear piercings, silver hoops, studs, glossy black horns, smooth horns, curved back horns, black scales on forearms, black scales on hands, ink-stained fingers, black nail polish, silver rings, thin bracelets, long slender black dragon tail, pointed tail tip, ink dripping from tail, narrow waist, wide hips, black t-shirt, crop top, off-shoulder, red plaid skirt, pleated skirt, black thighhighs, ink stains, fountain pen behind ear,
```

**Undesired content:** the Qiulong list with `limited palette, monochrome, greyscale, dark` taken out (we want those now), and colour kept out:
```
1::artist:urushihara satoshi, artist:shirow masamune,::, artist: d-rex,
lowres, worst quality, low quality, bad anatomy, bad hands, jpeg artifacts, watermark, signature, photorealistic, 3d, 2.5d, thick lineart, simple background, halftone, sketch, glossy, shiny, colorful, multicolored, saturated, gold, orange, warm colors, wings,
```

Keep the Qiulong image's character undesired content (the anatomy list) as it was.
