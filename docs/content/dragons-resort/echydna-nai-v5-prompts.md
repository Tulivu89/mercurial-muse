# Echydna — NAI V5 Narrowed Test Prompts

Nov 14, 2026 · @AmbiProp · Narrowed to your locked direction: **dark skin with constellation body freckles**, **multi-colored iridescent scales**, **soft motherly tummy with zero scutes** and faint pearlescent belly/hip markings, **no pupils**, **finned ears**, **heavy thick finned tail**, and **heavy horns** testing a crescent halo or eye between them.

---

## Generation settings

- **Model:** `NovelAI Diffusion V5`
- **Steps:** `20` · **Scale (CFG):** `5.0` · **CFG Rescale:** `0.1`
- **Sampler:** `k_euler_ancestral` · **Noise schedule:** `karras`
- **Size:** `1024x1024` (or `1216x832` landscape for two-view; `832x1216` portrait for solo)

---

## 1. Two-View Reference Sheet (Full Body + Torso, Single Character Block)

### Main / Base Prompt (`v4_prompt.caption.base_caption`)
```text
1girl, reference sheet, multiple views, grey background, full body, upper body, Two views of the same mature dragon woman stand side by side on flat grey wash. Left view shows full body head to toe, standing and facing viewer. Right view frames upper body and torso up close from hips to head, facing viewer. Details remain consistent across views. 1.2::artist:lesly oh::, 1.7::artist:aleksandra skiba::, 1::artist:emmanuel viola::, 2::painterly, cel shading, colored lineart, western comics (style), oil painting (medium)::, Fantasy illustration blending crisp graphic-novel inking with loose painterly color. Thin elegant ink lines with tapering strokes define forms, while visible brushstrokes texture color fills. Shading falls in clear confident shapes with soft painted edges where light meets shadow. high contrast, Deep abyssal palette, soft diffuse light, crisp black shadow shapes. year 2026, rating:nsfw, high complexity
```

### Character Block (`char_captions[0]`)
```text
girl, dragon girl, mature female, tall female, voluptuous, medium breasts, narrow waist, wide hips, thick thighs, soft belly, slight belly, curvy, nude, completely nude, nipples, pussy, human legs, barefoot, small high-arched feet, sharp dark nails, looking at viewer, bare skin stomach, faint iridescent pearl stretchmarks on lower belly and outer hips, body freckles, tiny pale glowing constellation freckles scattered across shoulders, chest, ribs, and hips, iridescent scales, multi-colored oil-slick scales along shoulders, outer thighs, and forearms, pointed webbed fin-ears, translucent ear fins, heavy thick dark-scaled dragon tail, thick tail, iridescent scales on tail, translucent webbed tail fins running along spine and tip, no pupils, || dark blue-grey slate skin, waist-length wavy midnight-blue hair, deep indigo undertones | deep bruised plum-charcoal skin, thick curled soot-black hair, faint violet sheen | dark abyssal indigo-black skin, heavy loose wavy black hair with subtle dark teal sheen ||, || black sclera, glowing pale pearl eyes, no pupils, heavy-lidded languid gaze | blank milky opalescent eyes, no pupils, dark lashes, eerie calm stare | deep abyssal indigo eyes, faint glowing crescent eclipse ring, no pupils, unblinking gaze ||, || heavy thick backward-sweeping dark horns, glowing halo crescent floating between horns | heavy thick curved dark obsidian ram horns, single glowing cosmic eye floating between horns | massive heavy ribbed dark pearl horns framing head, crescent-shaped dark halo arch between horns ||, || dark plum lips, subtle predatory smile | dark plum lips, serene unblinking expression, faint glowing gill-slits on outer ribs ||,
```

### Base Negative Prompt (`v4_negative_prompt.caption.base_caption`)
```text
artist:urushihara satoshi, artist:shirow masamune, artist:yone kinji, artist:shichimenchou, artist:d-rex,

lowres, worst quality, low quality, bad anatomy, bad hands, jpeg artifacts, watermark, signature, photorealistic, 3d, 2.5d, thick lineart, monochrome, greyscale, halftone, sketch, sepia, clothing, dress, shirt, skirt, lingerie, stockings, boots, shoes
```

### Character Negative Prompt (`v4_negative_prompt.char_captions[0]`)
```text
pupils, slit pupils, normal human eyes, large breasts, huge breasts, gigantic breasts, small breasts, flat chest, petite, skinny, flat stomach, abs, muscular, scutes, dragon scutes, belly scales, armored belly, plated abdomen, snake tail lower body, lamia, no legs, wings, dragon wings, feathered wings, pale skin, white skin, auburn hair, crimson hair, white hair, antler horns, thin horns, small horns, furry tail, brush tail, thin tail, 1.5::bad anatomy, bad proportions, wrong anatomy, anatomical nonsense, deformed, disfigured, mutation::, 1.4::bad hands, bad feet, extra digits, fewer digits, extra fingers, missing fingers, fused fingers, extra hands, extra arms, extra legs, missing limb::, 1.3::bad face, extra mouth, bad neck::,
```

---

## 2. Fast Single-Frame Explorer (`832x1216` portrait)

Keep the exact **Character Block** and **Negative Prompts** above and swap only the **Main / Base Prompt**:

```text
1girl, solo, flat grey background, full body, standing, looking at viewer, 1.2::artist:lesly oh::, 1.7::artist:aleksandra skiba::, 1::artist:emmanuel viola::, 2::painterly, cel shading, colored lineart, western comics (style), oil painting (medium)::, Fantasy illustration blending crisp graphic-novel inking with loose painterly color. Thin elegant ink lines with tapering strokes define forms, while visible brushstrokes texture color fills. Shading falls in clear confident shapes with soft painted edges where light meets shadow. high contrast, Deep abyssal palette, soft diffuse light, crisp black shadow shapes. year 2026, rating:nsfw, high complexity
```

---

## Quick tuning tips while testing

- **If the crescent or eye between the horns disappears:** Wrap it with gentle emphasis like `1.3::floating glowing crescent halo between horns::` or `1.3::single glowing cosmic eye between horns::`.
- **If NAI resists `no pupils`:** Raise `1.4::no pupils::` in positive and `1.3::pupils, iris::` in negative (keep `iris` in negative only if testing solid pearl/milky eyes; keep `iris` out when testing the eclipse ring).
- **If scutes still appear on her belly:** Add `1.3::smooth bare stomach, soft unscaled belly::` to positive.
