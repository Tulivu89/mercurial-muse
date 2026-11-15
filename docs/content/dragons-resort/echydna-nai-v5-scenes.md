# Echydna: NAI V5 scene prompts

Nov 15, 2026 · @AmbiProp · Prompts written to match the owner's three renders of Echydna: on the couch in the morning, reclining bare on the divan, and on the upper hall stair in plum silk. Use them to make more images in the same look. `echydna-image-reference.md` holds her canon. This sheet follows the renders where they differ from it, and says where.

## Where the renders differ from her record

| | Record | Renders | These prompts |
| --- | --- | --- | --- |
| Skin | Dark indigo-black | Dusky violet-purple | **Renders.** To go back to the record, swap in `dark indigo skin, blue-black skin` |
| Horns | Spiral ammonite horns sweeping wide and back | Huge coiled ram horns, ribbed, dark glossy brown-black | **Renders** |
| Breasts | Medium, full | Large in two of the three | **Renders** (`large breasts`). For the record, swap in `medium breasts` |
| Forehead | (nothing) | A small dark star-shaped mark under the floating eye | **Added** |
| Belly | Soft | Soft in one, toned in two | **Record:** soft, with abs in the negative |
| Gills | Faint slits on the ribs | Not visible | Left out. Add `glowing gill slits on ribs` for a scene that needs them |
| Claw clip (Suburban Mom) | Hair up in a claw clip | Hair down | **Renders** |

If the renders are the new lock, say so and I'll update her record and the image reference to match.

## Settings

- **Model:** NAI Diffusion V5 · **Steps:** 28 · **CFG:** 5.0 · **CFG rescale:** 0.1 · **Sampler:** `k_euler_ancestral` · **Noise schedule:** `karras`
- **Size:** 1216×832 for the wide shots (renders 1 and 2), 832×1216 for portrait shots (render 3). Both stay in the Opus free tier; upscale afterwards for the wallpaper size the renders were saved at.

## The shared blocks

Each scene uses the same four blocks. Only the scene's **base prompt** and its **outfit and pose** line change.

### Character prompt: her identity (fixed)

Paste this first in the character prompt, then add the scene's outfit and pose line after it.
```text
girl, dragon girl, monster girl, mature female, tall female, voluptuous, curvy, large breasts, narrow waist, wide hips, thick thighs, soft stomach, slight belly, dark purple skin, dusky violet skin, sparkling skin, tiny glowing star freckles across shoulders, chest, hips and thighs, iridescent scales, purple and teal oil-slick scales on shoulders, forearms and outer thighs, 1.2::glowing lavender stretch marks on lower belly and hips::, very long hair, black hair, wavy curly hair, teal highlights, glowing purple eyes, 1.4::no pupils::, empty eyes, half-closed eyes, smoky eyeshadow, dark plum lips, small dark star mark on forehead, huge horns, curled ram horns, ribbed horns, glossy dark brown horns, 1.3::single floating glowing purple eye above forehead between horns::, fin ears, iridescent webbed ear fins, purple and teal fins, large dragon tail, finned tail, iridescent purple and teal tail scales, translucent spiky fins along tail ridge and tip, long dark nails, human legs, barefoot, detailed feet,
```

### Character negative (fixed)
```text
pupils, slit pupils, iris, normal eyes, wings, dragon wings, lamia, snake lower body, no legs, mermaid lower body, belly scales, scutes, plated abdomen, abs, muscular, toned stomach, six pack, petite, skinny, flat chest, pale skin, white skin, antlers, small horns, thin horns, furry tail, tail tuft, extra eyes on face, 1.5::bad anatomy, bad proportions, deformed, mutation::, 1.4::bad hands, bad feet, extra toes, missing toes, fused toes, extra fingers, fused fingers, extra arms, extra legs, missing limb::, 1.3::bad face, extra mouth::,
```

### Base prompt: the look (end every scene's base prompt with this)
```text
semi-realistic, digital painting, dark fantasy, highly detailed, glossy skin, detailed skin texture, iridescent sheen, cinematic lighting, chiaroscuro, rim light, volumetric light, depth of field, rich purple and teal palette, Lush semi-realistic dark fantasy painting with glossy skin, deep soft shadows and warm lamplight against cool blue light, sharp detail on scales, fins and horns. very aesthetic, masterpiece, no text
```

### Base negative (fixed)
```text
lowres, worst quality, low quality, blurry, jpeg artifacts, watermark, signature, text, logo, anime, flat color, cel shading, thick lineart, sketch, monochrome, greyscale, chibi, cropped head, out of frame
```

## The scenes

Each scene gives its **base prompt start** (shot, setting, light), which comes before the shared look, and its **outfit and pose** line, which comes after her identity in the character prompt.

### 1. Morning on the couch (render 1)
*Suburban Mom. Her daytime look: the parlor sofa, judge shows and rare steak.*

**Base prompt start:**
```text
1girl, solo, wide shot, from below, foreshortening, cozy suburban living room, beige sofa, floral throw pillows, purple knit blanket, vase of purple hydrangeas, table lamp, framed family photos, kitchen in background, large window, trees outside, soft morning daylight mixed with warm lamplight,
```
**Outfit and pose:**
```text
purple t-shirt, v-neck, tied shirt, shirt knot, midriff, navel, no bra, covered nipples, charcoal leggings, high-waist leggings, tight leggings, lying back on sofa, reclining, legs apart, one knee up, foot focus, soles, feet toward viewer, holding teacup, steaming tea, floral teacup, arm on backrest, tail draped over sofa back, smug, looking down at viewer,
```

### 2. Bare on the divan (render 2)
*Bare, with a drape. Resting at night.*

**Base prompt start:**
```text
1girl, solo, wide shot, lying on side, opulent dark bedchamber, velvet chaise, plum velvet drapery with gold embroidery, arched window, full moon over the sea, candle lanterns, wine glass, bowl of dark grapes, amethyst crystals, moonlight and candlelight, nsfw,
```
**Outfit and pose:**
```text
nude, plum velvet robe draped over hips, robe slipping off, underboob, reclining on chaise, head resting on hand, hand on belly, lying on side, legs together, thick thighs, tail coiled behind her, relaxed, smirk, looking at viewer,
```

### 3. The upper hall stair (render 3)
*Abyssal Silk. Evenings, holding the landing and sizing up walkers.*

**Base prompt start:**
```text
1girl, solo, full body, from below, gothic stone hall, grand stair landing, black marble balustrade carved with an octopus, pointed arches, tall windows with blue underwater light, hanging candle lanterns, dark wet floor, warm lantern light and cool blue window light,
```
**Outfit and pose:**
```text
dark purple silk gown, floor-length gown, wrap dress, plunging neckline, center opening, navel, exposed lower belly, high side slit, bare leg, off shoulder, gold chains, gold clasps, standing, contrapposto, one hand on balustrade, crossed legs, tail curled on stairs behind her, looking down at viewer, smirk,
```

### 4. The early soak
*Bathhouse Robe. 06:30 to 09:00, before anyone else comes down.*

**Base prompt start:**
```text
1girl, solo, medium shot, dark mineral hot spring, black slate stone bath, rising steam, dim teal pool light, wet stone, faint dawn light through a high window, condensation,
```
**Outfit and pose:**
```text
black silk robe, open robe, wide sleeves, robe slipping off shoulders, wet robe, partially submerged, sitting in water, wet hair, wet skin, water droplets, arms resting on pool edge, tail fins breaking the water surface, half-closed eyes, calm, looking at viewer,
```

### 5. Cedar oil
*Bathhouse Robe. Tuesday afternoons, holding a comb out for someone to oil her hair and scales.*

**Base prompt start:**
```text
1girl, solo, medium shot, warm bathhouse, heated slate bench, steam, small glass bottle of oil, wooden bucket, warm amber light,
```
**Outfit and pose:**
```text
black silk robe, loosely tied, open robe, bare thighs, sitting on slate bench, legs crossed, holding wooden comb, arm outstretched toward viewer, offering comb, oiled skin, shiny scales, hair over one shoulder, tail across the floor, expressionless, looking at viewer,
```

### 6. The jetty at night
*Evening Sovereign. 21:00 to 02:00, dropping fish heads into black water for her youngest clutch.*

**Base prompt start:**
```text
1girl, solo, full body, night, old wooden jetty, black canal water, glowing eyes in the water below, single hanging lantern, mist, moonlight, teahouse back porch in background, cold blue night with one warm lantern,
```
**Outfit and pose:**
```text
black halter dress, tight dress, matte black, keyhole cleavage, backless dress, thigh slit, black and pearl ear cuffs, standing at edge of jetty, holding fish head, dropping fish into water, bucket of fish at feet, tail hanging over the edge into the water, looking down, calm,
```

## If something goes wrong

- **Pupils come back:** raise `1.4::no pupils::` to `1.6`, and add `1.3::pupils, iris::` to the character negative.
- **The floating eye drops out, or lands on her forehead as a third eye:** raise it to `1.5::`, and keep `small dark star mark on forehead` so the model has something else for her brow.
- **Her horns shrink or straighten:** add `1.3::huge curled ram horns::`.
- **She gets abs** (it happened in two renders): add `1.3::soft stomach, slight belly::` and keep `abs` in the negative.
- **Her tail becomes her legs:** add `1.3::two human legs::`.
- **Her skin goes grey or blue:** add `1.2::dark purple skin::`.
