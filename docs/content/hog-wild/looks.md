# HOG Wild: looks

Nov 15, 2026 · @AmbiProp · The residents' looks as NovelAI V5 character blocks. Four are locked from the owner's rolls, with the tags read from the images' own settings and narrowed to what came out. Two still roll: the Retro, and a red panda reroll for amplified East Asian features. The method is the retrospective's: one character block and neutral light, wide `|| a | b | c ||` wildcards, then lock the hits.

## Keeping six people apart

| Resident | Owns | Signature mod | Silhouette |
| --- | --- | --- | --- |
| **The influencer** | Rose-gold, white, holographic shimmer | Diamond implants on the cheekbones; the eye-camera ring | Slim and long-legged, in fur and holographic fabric |
| **Primus** | Gold and chrome | The chrome arm with gold fittings | The biggest body in the house, with a top knot |
| **Nova** | Black with cyan and magenta | The luminous rim and the status ring at her temple | Petite and quick |
| **The Mole** | Acid green and black | Neural ports with glowing cables; poison-green claws | Slim and narrow-shouldered, in fishnets and a cropped jacket |
| **The Retro** | Red lips and platinum (screen siren) | The beauty mark on the wrong side | An hourglass in a halter dress; nobody else wears her era |
| **The red panda** | Russet, cream and neon orange | The numbered ear tag; the glowing tail bands | Ears and a striped tail; the only animal features in the house |

## The base prompt (the owner's latest)

Swap `1girl` for `1boy` for Primus and the Mole.

```
1girl, solo, indoors, science fiction, simple background, cowboy shot, straight-on, standing, looking at viewer. Plain dark studio backdrop. Even soft key light from the front, thin cyan rim light from behind. 1.5::artist:lesly oh::, 1::artist:aleksandra skiba::, 1.2::artist:emmanuel viola::, 0.9::artist:russell dauterman::, 1::artist:dan mora::, 1.5::cel shading, colored lineart, western comics (style), clip studio paint (medium)::, -1::sketch::, Sci-fi illustration blending crisp graphic-novel inking with vivid cyberpunk color. Thin elegant ink lines with tapering strokes define forms, while smooth airbrushed gradients fill color. Shading falls in clear confident shapes with soft brushed edges where light meets shadow. year 2026, rating:questionable, high complexity
```

**Undesired content (base):**

```
artist:urushihara satoshi, artist:shirow masamune, artist:yone kinji, artist:shichimenchou,
lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page, 2::monochrome, sketch, lineart, plastic skin, fake skin::, background faces, artist name, artist logo,
```

## Locked

### The influencer

```
girl, slim, long legs, 0.4::mature female::. Fair skin.
medium hair, angled bob, rose-gold hair, swept bangs, fiber-optic hair glowing gold at the tips.
frosty ice-blue eyes, tsurime, thick eyelashes. Face heart-shaped, wide cheekbones tapering to a small pointed chin, small upturned nose, glossy pink lips.
three small clear diamond implants along each cheekbone. Thin gold ring around the iris of her left eye, a tiny red recording light at its edge.
choker, black choker, crop top, white crop top, fur coat, white fur coat, off shoulder, leggings. Holographic leggings shift with rainbow sheen.
```

Undesired: `tareme, round face, chubby cheeks, button nose, thick eyebrows, cyborg, mechanical arms, scar, petite, child, aged down`

*The roll is the default outfit. The eye-camera ring didn't show at this framing; it reads at a portrait crop.*

### Primus

The roll as it came out, with the hair changed to a top knot, as the owner asked.

```
boy, tall male, muscular, athletic, broad shoulders, narrow waist, young adult male. Dark brown skin.
bleached blonde hair, top knot, shaved sides. stubble.
gold eyes, glowing eyes. Face square, strong jaw, wide white smile.
full chrome left arm, cyan light seams, gold fittings at the joints and fingertips, exposed pistons at the elbow. gold rings.
white tank top, gold chain, layered gold chains, track pants.
```

Undesired: `bishounen, androgynous, slim, skinny, long eyelashes, makeup, long hair, child, aged down`

*His roll put the chrome on the left arm. Left is locked, so every image agrees.*

### Nova (configuration 1.0)

```
girl, petite, lean athletic build, 0.4::mature female::. Pale translucent porcelain skin, faint inner bioluminescence, subsurface scattering.
medium hair, black hair, cyan streaks, magenta streaks. Light grey eyes, silver radial iris texture, dense dark eyelashes, cyan eyeshadow, pink lipstick. Delicate aquiline nose, high cheekbones, sharp jawline, slender neck, defined collarbones.
a soft luminous rim along every edge of her skin, brightest in shadow. A small glowing ring at the left temple.
simple matte black sleeveless high-collar top, dark fitted trousers, geometric blue-white trim.
```

Undesired: `large breasts, muscular, tall, thick, tan, dark skin, long hair, blonde hair, mechanical parts, exposed wiring, child, aged down`

*Only the hair, eyes, skin and cosmetics change with her configuration. The rim and the temple ring stay in every version: they're how a reader knows it's still her.*

### The Mole

The roll with the owner's poison-green claws. It read more girl than femboy, so the male cues are weighted up and the undesired tags hold the hips and chest down.

```
boy, 1.3::femboy, otoko no ko::, male focus, slim, narrow shoulders, narrow waist, narrow hips, flat chest, androgynous face, young adult male. Light brown skin.
black hair, short curly hair, half-shaved head, acid-green curls on top.
heterochromia, one gold eye and one green eye. Face soft, pointed chin, full lips. stick-on face gems, small green circuit marks across the nose.
Neural jack ports at the nape, glowing green cables looping to the ears. holographic tattoos crawling on forearms, glowing green.
long sharp nails, poison-green claws.
cropped jacket, crop top, short shorts, fishnets, fingerless gloves, combat boots.
```

Undesired: `muscular, broad shoulders, facial hair, beard, large breasts, medium breasts, wide hips, curvy, 1girl, shota, child, aged down`

## Still to roll

### The Retro (screen siren, by default)

The era is the screen siren unless the owner picks another. The wildcards are on the replica's tell and the body.

```
girl, 0.6::mature female::, || hourglass figure, curvy | slim, soft curves ||. || Fair skin | Light skin ||.
short platinum blonde hair, victory curls, red lips, arched brows, pearl earrings. || blue eyes | hazel eyes ||. Face oval, high cheekbones, slightly too symmetrical.
|| beauty mark on the wrong side of her face, mirrored from old photographs | beauty mark, thin pale scar ring around the base of her neck | beauty mark, tiny lot number printed behind her left ear ||.
|| fitted white halter dress, pleated skirt, white gloves | black cocktail dress, fur stole, long gloves | silk robe, bare feet, cigarette holder ||
```

Undesired: `cyborg, mechanical arms, animal ears, tail, long hair, child, aged down`

### The red panda (reroll for East Asian features)

Everything that made the old roll a red panda is kept: the colours, the bands, the markings, the LEDs. The face is pushed toward amplified East Asian features, and the skin is a wildcard because the old roll's rusty brown came from another setting.

```
girl, red panda girl, 0.6::mature female::, east asian, toned, medium breasts. || Fair skin | Light skin | Light tan skin ||.
long hair, wavy hair, orange hair, colored tips, blunt bangs, sidelocks. Russet hair fades to cream at tips.
red panda ears, animal ear fluff, red panda tail, fluffy tail, striped tail. Tail bands glow neon orange.
|| monolid eyes, narrow almond eyes | hooded eyes, long upturned eyes | single eyelids, sharp upturned eyes ||, dark brown eyes, long eyelashes. Face || oval, high cheekbones, small soft nose | heart-shaped, flat nose bridge, small lips | long, sharp cheekbones, small mouth ||.
White markings arc above each eye, russet tear-track stripes run from inner eye corners down cheeks. Faint subdermal LEDs trace the markings.
Small numbered yellow tag clipped through her left ear.
o-ring choker, chest harness, black bikini, garter straps, black thighhighs, platform boots. Bikini and harness edged with thin orange LED lights. Money tucked under garter straps.
```

Undesired: `tall female, fox ears, fox tail, raccoon ears, raccoon tail, cat ears, extra ears, white hair, short hair, see-through, dark-skinned female, round face, child, aged down`

## After the roll

For each still to roll, hand back the tags that won, and any physical hook the roll turned up that belongs in an example chat. Echydna's stretchmarks and Errata's ink-stained heels both came out of a roll this way.
