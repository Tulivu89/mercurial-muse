# Echydna: NAI V5 scene prompts

Nov 15, 2026 · @AmbiProp · Six scenes for NAI V5. The first three take their poses, framing and settings from the owner's renders (on the couch in the morning, reclining on the divan, on the upper hall stair); the last three are new scenes from her schedule, framed the same way. Her body, colours and outfits are her record's (`echydna-image-reference.md`). The renders drew her heavier and larger-chested than the record, so the identity block and its negative push back against that.

## Settings

- **Model:** NAI Diffusion V5 · **Steps:** 28 · **CFG:** 5.0 · **CFG rescale:** 0.1 · **Sampler:** `k_euler_ancestral` · **Noise schedule:** `karras`
- **Size:** 1216×832 for the wide shots (scenes 1, 2, 4, 5), 832×1216 for the tall ones (scenes 3, 6). Both stay in the Opus free tier; upscale afterwards.

## The shared blocks

Each scene uses the same four blocks. Only the scene's **base prompt start** and its **outfit and pose** line change.

### Character prompt: her identity (fixed)

Paste this first in the character prompt, then the scene's outfit and pose line after it.
```text
girl, dragon girl, mature female, tall female, statuesque, long legs, curvy, medium breasts, narrow waist, wide hips, slight soft belly, dark abyssal indigo-black skin, body freckles, tiny pale glowing constellation freckles across shoulders, chest, ribs and hips, iridescent scales, multi-colored oil-slick scales on shoulders, forearms and outer thighs, smooth bare stomach, soft unscaled belly, faint iridescent pearl stretchmarks on lower belly and outer hips, heavy loose wavy black hair, waist-length hair, subtle dark teal sheen, pointed webbed fin-ears, translucent ear fins, deep abyssal indigo eyes, 1.4::no pupils::, unblinking gaze, dark plum lips, heavy thick black horns, ridged ammonite horns, horns sweeping wide and back, 1.3::single glowing cosmic eye floating between horns::, heavy thick dark-scaled dragon tail, iridescent scales on tail, translucent webbed tail fins along ridge and tip, sharp dark nails, human legs, barefoot, small high-arched feet,
```

### Character negative (fixed)
```text
1.3::large breasts, huge breasts, gigantic breasts::, 1.2::plump, chubby, fat, thick arms, wide waist, thick waist::, abs, muscular, toned stomach, petite, skinny, flat chest, pupils, slit pupils, iris, normal human eyes, wings, dragon wings, lamia, snake lower body, no legs, belly scales, scutes, plated abdomen, pale skin, white skin, purple skin, antlers, thin horns, small horns, ram horns, furry tail, tail tuft, forehead mark, 1.5::bad anatomy, bad proportions, deformed, mutation::, 1.4::bad hands, bad feet, extra toes, missing toes, fused toes, extra fingers, fused fingers, extra arms, extra legs, missing limb::, 1.3::bad face, extra mouth::,
```
`purple skin`, `ram horns` and `forehead mark` are there because the renders drifted to them. Drop one from the negative if it starts fighting the scene's lighting.

### Base prompt: the look (end every scene's base prompt with this)
```text
semi-realistic, digital painting, dark fantasy, highly detailed, glossy skin, detailed skin texture, iridescent sheen, cinematic lighting, chiaroscuro, rim light, volumetric light, depth of field, Lush semi-realistic dark fantasy painting with glossy skin, deep soft shadows and warm lamplight against cool blue light, sharp detail on scales, fins and horns. very aesthetic, masterpiece, no text
```

### Base negative (fixed)
```text
lowres, worst quality, low quality, blurry, jpeg artifacts, watermark, signature, text, logo, anime, flat color, cel shading, thick lineart, sketch, monochrome, greyscale, chibi, cropped head, out of frame
```

## The scenes

**Base prompt start** (shot, setting, light) goes before the shared look. **Outfit and pose** goes after her identity in the character prompt.

### 1. Morning on the couch (render 1)
*Suburban Mom: the parlor sofa, judge shows and rare steak.*

**Base prompt start:**
```text
1girl, solo, wide shot, from below, foreshortening, cozy suburban living room, beige sofa, floral throw pillows, purple knit blanket, vase of purple hydrangeas, table lamp, framed family photos, kitchen in background, large window, trees outside, soft morning daylight mixed with warm lamplight,
```
**Outfit and pose:**
```text
oversized heather purple t-shirt, v-neck, tied shirt, shirt knot under breasts, midriff, navel, no bra, charcoal leggings, high-waist leggings, tight leggings, hair up, claw clip, loose strands, lying back on sofa, reclining, one knee up, foot focus, soles, feet toward viewer, holding teacup, steaming tea, floral teacup, arm on backrest, tail draped over sofa back, smug, looking down at viewer,
```

### 2. On the divan (render 2)
*Bare, with a drape: resting at night.*

**Base prompt start:**
```text
1girl, solo, wide shot, lying on side, opulent dark bedchamber, low divan, dark plum velvet drapery, arched window, full moon over the sea, candle lanterns, wine glass, bowl of dark grapes, amethyst crystals, moonlight and candlelight, nsfw,
```
**Outfit and pose:**
```text
nude, dark silk drape over one hip, reclining on divan, lying on side, head resting on hand, other hand on belly, legs together, tail coiled behind her, relaxed, half-closed eyes, looking at viewer,
```

### 3. The upper hall stair (render 3)
*Abyssal Silk: evenings, holding the landing and sizing up walkers.*

**Base prompt start:**
```text
1girl, solo, full body, from below, gothic stone hall, grand stair landing, black marble balustrade carved with an octopus, pointed arches, tall windows with blue underwater light, hanging candle lanterns, dark wet floor, warm lantern light and cool blue window light,
```
**Outfit and pose:**
```text
floor-length wrap gown, midnight purple and dark indigo silk, plunging neckline, gown parted below navel, exposed lower belly, high side slit, bare leg, backless, off shoulder, standing, contrapposto, one hand on balustrade, crossed legs, tail curled on the stairs behind her, looking down at viewer, serene,
```

### 4. The early soak
*Bathhouse Robe: 06:30 to 09:00, before anyone else comes down.*

**Base prompt start:**
```text
1girl, solo, wide shot, from side, dark mineral hot spring, black slate stone bath, rising steam, dim teal pool light, wet stone, faint dawn light through a high window,
```
**Outfit and pose:**
```text
oil-dark silk robe, wide sleeves, open robe, robe slipping off shoulders, wet robe, sitting in water up to the waist, wet hair, wet skin, water droplets, arms along the pool edge, head tilted back, tail fins breaking the water surface, half-closed eyes, calm,
```

### 5. Cedar oil
*Bathhouse Robe: Tuesday afternoons, holding a comb out for someone to oil her hair and scales.*

**Base prompt start:**
```text
1girl, solo, wide shot, from below, warm bathhouse, heated slate bench, steam, small glass bottle of oil, wooden bucket, warm amber light, foreshortening,
```
**Outfit and pose:**
```text
oil-dark silk robe, wide sleeves, loosely tied low, open robe, bare thighs, sitting on slate bench, legs crossed, holding wooden comb, arm outstretched toward viewer, offering comb, foot toward viewer, hair over one shoulder, tail across the floor, expressionless, looking down at viewer,
```

### 6. The jetty at night
*Evening Sovereign: 21:00 to 02:00, dropping fish heads into black water for her youngest clutch.*

**Base prompt start:**
```text
1girl, solo, full body, from below, night, old wooden jetty, black canal water, faint glowing eyes in the water, single hanging lantern, mist, moonlight, teahouse back porch in background, cold blue night with one warm lantern,
```
**Outfit and pose:**
```text
matte black halter dress, form-fitting, keyhole front, plunging neckline, backless dress, thigh slit, obsidian and pearl ear cuffs, standing at edge of jetty, contrapposto, holding fish head over the water, bucket of fish at her feet, tail hanging over the edge into the water, looking down, serene,
```

## If something goes wrong

- **She comes out heavy again:** raise the body line in the negative to `1.4::`, and add `1.2::slender arms, long legs::` to her identity.
- **Her chest grows:** raise `1.3::large breasts…::` in the negative to `1.5`.
- **Pupils come back:** raise `1.4::no pupils::` to `1.6`, and add `1.3::pupils, iris::` to the negative.
- **The floating eye drops out, or lands on her forehead:** raise it to `1.5::`.
- **The horns turn into ram horns:** add `1.3::ammonite horns sweeping wide and back::`.
- **Her skin goes purple:** add `1.2::dark indigo-black skin::`. Warm lamplight pushes it that way, so the morning and bath scenes need it most.
- **She gets abs:** add `1.3::soft stomach::`.
- **Her tail replaces her legs:** add `1.3::two human legs::`.
