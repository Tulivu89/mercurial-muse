# HOG Wild: look options

Nov 15, 2026 · @AmbiProp · Checkpoint 3's look options for all six residents, as NovelAI V5 sheets to roll. This follows the retrospective's method: one character block, wide `|| a | b | c ||` wildcards and neutral light, then lock the winning tags and tighten the undesired content. The style block is the owner's own, read from the two cyberpunk images they attached (the couple at the rainy window and the woman between the bunks), so the cast matches the look already chosen. The picks go back into `00-framework.md`.

## Keeping six people apart

Each resident owns a colour, so no two share hair or a signature glow. The wildcards below stay inside these lanes.

| Resident | Owns | Signature mod | Silhouette |
| --- | --- | --- | --- |
| **The influencer** | Rose-gold, white, pastel shimmer | The eye-camera ring that streams her view | Small and polished, in fur and holographic fabric |
| **Primus** | Gold and chrome | Armour under the skin, or a chrome limb | The biggest body in the house |
| **Nova** | Black with cyan and magenta (her card's version 1.0) | The glow at her edges, which survives every configuration | Petite and quick |
| **The Mole** | Acid green and black | Neural jack ports at the nape | Slim and narrow-shouldered, in a skirt and an oversized hoodie |
| **The Retro** | Her era's colour (red lips with platinum, black, or honey) | A replica's tell: something the original had is slightly wrong | Her era's shape, which nobody else in the house wears |
| **The Idol** | Orange and russet, or silver-white | A numbered ear tag from the biotech trial | Ears and a tail; the only animal features in the house |

**One collision to settle:** Nova's card and the owner's rose-gold image are both petite. If both stay small, the influencer goes *slim, long legs* in the roll below. That's her middle option.

## The base prompt (shared)

Use it for every roll and swap `1girl` for `1boy` for Primus and the Mole. The light is kept plain so the roll shows the person, not the scene.

```
1girl, solo, indoors, science fiction, simple background, cowboy shot, straight-on, standing, looking at viewer.
Plain dark studio backdrop. Even soft key light from the front, thin cyan rim light from behind.
1.2::artist:lesly oh::, 1.7::artist:aleksandra skiba::, 1::artist:dan mora::, 0.8::artist:emmanuel viola::, 2::cel shading, colored lineart, western comics (style), clip studio paint (medium)::, -1::sketch::, Sci-fi illustration blending crisp graphic-novel inking with vivid cyberpunk color. Thin elegant ink lines with tapering strokes define forms, while smooth airbrushed gradients fill color. Shading falls in clear confident shapes with soft brushed edges where light meets shadow.
year 2026, rating:questionable, high complexity
```

**Undesired content (base), from the owner's images:**

```
artist:urushihara satoshi, artist:shirow masamune, artist:yone kinji, artist:shichimenchou,
lowres, artistic error, scan artifacts, worst quality, bad quality, jpeg artifacts, multiple views, very displeasing, too many watermarks, negative space, blank page, 2::monochrome, sketch, lineart, plastic skin, fake skin::, background faces, artist name, artist logo,
```

## The influencer

The heiress act, crying on cue, and the yes to every bid. The first option on each line is the owner's rose-gold image.

```
girl, || petite | slim, long legs | curvy, hourglass figure ||, 0.4::mature female::. || Fair skin | Light tan skin | Deep brown skin ||.
|| medium hair, angled bob, rose-gold hair, swept bangs, fiber-optic hair glowing gold at the tips | very long hair, straight hair, silver-lilac hair, high ponytail | long wavy hair, bubblegum pink hair with a holographic sheen ||.
|| frosty ice-blue eyes | violet eyes | pink eyes ||, tsurime, thick eyelashes. Face heart-shaped, wide cheekbones tapering to a small pointed chin, small upturned nose, glossy pink lips.
|| three small clear diamond implants along each cheekbone | glowing subdermal freckles across nose and cheeks | thin pearl studs set along the brow bone ||.
Thin gold ring around the iris of her left eye, a tiny red recording light at its edge.
|| choker, black choker, crop top, white crop top, fur coat, white fur coat, off shoulder, leggings. Holographic leggings shift with rainbow sheen | strapless dress, sequin dress, white dress, platform heels | oversized hoodie, white hoodie, bike shorts, chunky sneakers, sunglasses on head ||
```

Undesired content for her block: `tareme, round face, chubby cheeks, button nose, thick eyebrows, cyborg, mechanical arms, scar, child, aged down`

## Primus

Mackey on the stage, Homelander underneath, Bateman in private. The biggest body in the house, wearing gold and chrome.

```
boy, tall male, || bodybuilder, huge muscles, broad shoulders, thick neck | muscular, athletic, broad shoulders, narrow waist | lean muscular, swimmer's build ||, || young adult male | 0.6::mature male:: ||. || Tan skin | Olive skin | Dark brown skin ||.
|| short hair, slicked back hair, blonde hair, undercut | buzz cut, dark hair | long dark hair in a man bun, shaved sides ||. || stubble | clean-shaven | short boxed beard ||.
|| blue eyes | gold eyes, glowing eyes | red cybernetic eye, scope reticle ||. Face square, strong jaw, wide white smile.
|| chrome jaw plating along the jawline and chin | full chrome right arm, exposed pistons at the elbow | subdermal armor, hexagonal plates raised under the skin of chest, shoulders and forearms ||.
|| gold grill on lower teeth | small gold sponsor logo implanted at the temple | gold-plated knuckles ||.
|| shirtless, cargo pants, tactical belt, holster | white tank top, gold chain, track pants | tailored suit, black suit, open collar, gold watch ||
```

Undesired content for his block: `bishounen, androgynous, slim, skinny, long eyelashes, makeup, child, aged down`

## Nova

Her card's version 1.0 is fixed. What rolls here is what stays the same across every configuration: the mark of a made body.

```
girl, petite, lean athletic build, 0.4::mature female::. Pale translucent porcelain skin, faint inner bioluminescence, subsurface scattering.
medium hair, black hair, cyan streaks, magenta streaks. Light grey eyes, silver radial iris texture, dense dark eyelashes, cyan eyeshadow, pink lipstick. Delicate aquiline nose, high cheekbones, sharp jawline, slender neck, defined collarbones.
|| faint glowing seam lines at wrists, collarbone and the backs of the knees | a soft luminous rim along every edge of her skin, brightest in shadow | a small status light at the left temple, cyan when idle ||.
|| barcode tattoo on inner forearm (from the owner's second image) | serial number printed small at the nape | Halcyon maker's mark, a thin ring etched below the collarbone ||.
|| simple matte black sleeveless high-collar top, dark fitted trousers, geometric blue-white trim | oversized white shirt, bare legs | completely nude ||
```

Undesired content for her block: `large breasts, muscular, tall, thick, tan, dark skin, long hair, blonde hair, mechanical parts, exposed wiring, child, aged down`

## The Mole

A femboy and the performative counterculture: anti-corporate patches on a corporation's stream.

```
boy, femboy, otoko no ko, slim, narrow shoulders, narrow waist, flat chest, androgynous face, || young adult male ||. || Fair skin | Light brown skin | Deep brown skin ||.
|| medium hair, wolf cut, black hair, acid-green tips | short hair, bleached white mullet | black hair, half-shaved head, acid-green streak ||.
|| green eyes | heterochromia, one green eye and one cybernetic eye with a reticle | grey eyes, dark eyeliner ||. Face soft, pointed chin, full lips.
|| septum piercing, lip ring | eyebrow slits, stick-on face gems | two small circuit tattoos under the eyes ||.
Neural jack ports at the nape, glowing green. || fingertip data spikes | holographic tattoos crawling on forearms | taped knuckles, cable coiled at the wrist ||.
|| oversized black hoodie covered in anti-corporate patches, pleated skirt, thigh highs, platform boots | cropped jacket, crop top, short shorts, fishnets, combat boots | sweater dress, knee socks, headphones around neck ||
```

Undesired content for their block: `muscular, broad shoulders, facial hair, beard, large breasts, 1girl, shota, child, aged down`

## The Retro

Her era is a pick, and it goes with her seed: the screen siren goes with Norma Desmond and Marilyn, the rock queen with Silverhand. The pop princess fits any of the three. The replica's tell is the line to watch.

```
girl, 0.6::mature female::, || hourglass figure, curvy | slim, wiry | slim, toned midriff ||.
Era: || screen siren: short platinum blonde hair, victory curls, red lips, beauty mark, arched brows, pearl earrings | rock queen: black shag mullet, smoky eyes, dark lipstick, heavy eyeliner, studded leather | pop princess: long honey-blonde hair, chunky highlights, frosted lip gloss, butterfly clips, glitter on cheekbones ||.
|| blue eyes | hazel eyes | dark brown eyes ||. Face oval, high cheekbones, slightly too symmetrical.
Replica tell: || beauty mark on the wrong side of her face, mirrored from old photographs | thin pale scar ring around the base of her neck | tiny lot number printed behind her left ear ||.
|| fitted white halter dress, gloves | ripped band t-shirt, leather jacket, torn fishnets | low-rise jeans, tiny baby tee, rhinestone belt ||
```

Undesired content for her block: `cyborg, mechanical arms, animal ears, tail, child, aged down`

## The Idol

A fox girl or a red panda girl, from a trial line still in beta.

```
girl, || petite | slim ||, 0.4::mature female::. || Fair skin | Light skin, rosy cheeks ||.
|| fox ears, fox tail, fox girl, orange hair, ears and tail orange with white tips | fox ears, fox tail, fox girl, silver-white hair, white ears and tail | red panda ears, red panda tail, ringed tail, russet hair, white markings on cheeks and above the eyes ||.
|| twintails | hime cut | short bob, hair clips ||. || amber eyes, slit pupils | dark brown eyes, sparkling eyes | gold eyes ||. Face heart-shaped, small mouth, bright eyes.
Small numbered yellow tag clipped through her left ear. || patchy fur at the base of one ear | shed hairs on her clothes | pink irritated skin at the tail root ||.
|| frilly idol dress, puffy sleeves, ribbons, thigh highs | oversized track jacket, short skirt, sneakers | qipao, side slit, hair ornaments ||
```

Undesired content for her block: `tall female, muscular, cyborg, mechanical parts, dark skin, long nails, child, aged down, loli, round face, chubby cheeks` *(she must read as a grown woman in her twenties; raise `mature female` if she rolls young)*

## After the roll

Lock the hits, then hand back the picks, as the resort did. For each resident: the tags that won, the undesired tags that kept the cast apart, and any physical hook the roll turned up that belongs in an example chat. Echydna's stretchmarks and Errata's ink-stained heels both came out of a roll this way.
