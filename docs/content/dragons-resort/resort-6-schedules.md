# The Dragon's Resort, stage 6: schedules

Nov 14, 2026 · @AmbiProp · Coordinated 24-hour and weekly schedules (`Daily` + `Monday–Sunday`) built to CharacterRoom v2's exact minute-of-day schema (`0–1439`), pairing each slot with its room, active Outfit Set, and `"Called now..."` arrival state.

---

## 1. Errata — Night-shift clock (`12:00–04:00` awake)

### `Daily`
- **04:00–12:00 (`240–720`)** · `vErrataLoft` · *Outfit: Sleep Wear*
  Dead asleep tangled in her sheets. Called now, she arrives barefoot in a wrinkled sleep shirt with ink-stained heels and messy bangs, squinting furiously until someone puts black coffee in front of her.
- **12:00–13:30 (`720–810`)** · `vKitchenPorch` · *Outfit: Comfy*
  On the back steps in an oversized horror hoodie with black coffee, sneaking cold kitchen scraps to the one-eared alley cat. Called now, she arrives with cat hair on her sleeve and refuses small talk.
- **13:30–17:00 (`810–1020`)** · `vErrataLoft` · *Outfit: Comfy*
  *(Overridden Monday–Sunday below.)* Cross-legged on floor cushions flipping through stacks of ruined drafts with a chewed-cap pen. Called now, she brings two loose pages and a pencil behind her ear.
- **17:00–19:30 (`1020–1170`)** · `vParlor` · *Outfit: Standard Day*
  Perched sideways on the front barstool with iced black coffee and a dog-eared paperback, people-watching anyone stepping in from the road. Called now, she arrives already sizing up whoever walked in last.
- **19:30–22:30 (`1170–1350`)** · `vKitchenPorch` / `vParlor` · *Outfit: Standard Day*
  Eating extra-spicy takeout straight out of the carton in the side booth while Qiulong runs the dice tables. Called now, she brings the half-empty carton and chopsticks in her teeth.
- **22:30–04:00 (`1350–240`)** · `vErrataLoft` · *Outfit: Comfy*
  Prime hours on floor cushions watching 80s rubber-suit horror tapes or playing dirty eight-ball in the back room. Called now, she arrives wide awake, spoiling for trouble and loud commentary.

### `Monday–Sunday` (`13:30–17:00` / evening overrides)
- **Monday `13:30–17:00` (`810–1020`)** · `vOutErrata` · *Outfit: Standard Day*
  Browsing the Neon Strip's thrift racks and print-shop scrap bins for cheap silver and misprinted paper. Called now, she arrives smelling of newsprint and rain, pocket rattling with tarnished rings.
- **Tuesday `13:30–17:00` (`810–1020`)** · `vErrataLoft` · *Outfit: Comfy*
  Sorting milk crates of bootleg horror VHS tapes and yelling at a trashy afternoon dating show. Called now, she brings a plastic tape sleeve with no label and wants to argue about the ending.
- **Wednesday `13:30–17:00` (`810–1020`)** · `vOutErrata` · *Outfit: Standard Day*
  At the Neon Strip arcade, hogging the fighting cabinets with pocket quarters. Called now, she arrives mid-match, bragging about a cheap ring-out before her sleeves are even pushed up.
- **Thursday `13:30–17:00` (`810–1020`)** · `vBathhouse` · *Outfit: Comfy*
  Soaking late in the cooler slate pool after staying up too long, hair piled up with two wooden pencils. Called now, she arrives wrapped in a towel, damp and slightly less sharp-tongued than usual.
- **Friday `21:00–03:00` (`1260–180`)** · `vOutErrata` · *Outfit: Going Out*
  Out at the Neon Strip dive bar running the pool table and leaning across people's shots in platform boots. Called now, she arrives smelling of clove smoke and cheap beer, blue chalk smudged on her fingers.
- **Saturday `21:00–03:30` (`1260–210`)** · `vOutErrata` · *Outfit: Going Out*
  Midnight double-feature at the sticky-floor revival cinema—or out past last call chasing bad company. Called now, she arrives cold-cheeked in ripped fishnets and smeared black liner, daring someone to keep up.
- **Sunday `13:30–17:00` (`810–1020`)** · `vParlor` · *Outfit: Comfy*
  Sprawled across the parlor lounge with sour candy while Echydna watches judge shows, muttering dry commentary at Mom's screen. Called now, she arrives with half a bag of sour rings and zero patience for stairs.

---

## 2. Echydna — Unhurried tidal clock (light sleep, bridges day & deep night)

### `Daily`
- **02:00–06:30 (`120–390`)** · `vEchydnaSuite` · *Outfit: Unclothed / Bare*
  Quiet horizontal rest on her low slate divan with the small bedside television muted or glowing low. Called now, she rises barefoot and unbothered without reaching for clothes first.
- **06:30–09:00 (`390–540`)** · `vBathhouse` · *Outfit: Bathhouse Robe*
  Early morning soak in the dark mineral pools before Qiulong's bench work starts. Called now, she arrives wrapped loosely in heavy wet silk, cool skin smelling of cedar steam and salt.
- **09:00–13:00 (`540–780`)** · `vParlor` · *Outfit: Suburban Mom*
  Curled barefoot along the front lounge sofa in yoga leggings and a claw clip, eating rare steak strips off a saucer while watching daytime court and paternity shows dead-seriously. Called now, she brings the plate and expects you to sit close.
- **13:00–17:00 (`780–1020`)** · `vEchydnaSuite` · *Outfit: Suburban Mom*
  *(Overridden Monday–Sunday below.)* Heavy afternoon stillness in her cool suite, resting her tail across the floorboards. Called now, she appears silently in the hall as if she had been waiting outside your door.
- **17:00–21:00 (`1020–1260`)** · `vParlor` · *Outfit: Abyssal Silk*
  Holding court quietly by the upper stair or front lounge in midnight-plum silk, appraising evening walkers without blinking. Called now, she steps effortlessly into your path without hurrying.
- **21:00–02:00 (`1260–120`)** · `vKitchenPorch` · *Outfit: Evening Sovereign*
  Out on the back stone jetty dropping fish heads and raw scraps to the youngest clutch under the black canal water. Called now, she arrives with cold salt water on her bare ankles and a tin bucket handle still hooked over two fingers.

### `Monday–Sunday` (`13:00–17:00` / late overrides)
- **Monday `13:00–17:00` (`780–1020`)** · `vOutEchydna` · *Outfit: Abyssal Silk*
  Walking the salt canal lock past the resort wall to check on older brood moving upriver. Called now, she arrives damp past the knees, unhurried and carrying the chill of deep tidewater.
- **Tuesday `13:00–17:00` (`780–1020`)** · `vBathhouse` · *Outfit: Bathhouse Robe*
  Sitting on the warm slate bench waiting for someone to comb cedar oil through her hair and shoulder scales (overlapping briefly before Qiulong claims the hot pool at five). Called now, she arrives holding a wooden comb out without asking.
- **Wednesday `13:00–17:00` (`780–1020`)** · `vParlor` · *Outfit: Suburban Mom*
  Watching back-to-back afternoon soap operas and home-renovation reruns from the sofa, uttering calm verdicts on fictional marriages. Called now, she doesn't pause the television before looking straight through you.
- **Thursday `13:00–17:00` (`780–1020`)** · `vOutEchydna` · *Outfit: Evening Sovereign*
  Out along the dark coastal flats beyond the salt lock, returning occasionally with an odd antique wreck piece for Qiulong. Called now, she arrives smelling of kelp, ozone, and cold rain.
- **Friday `21:00–01:00` (`1260–60`)** · `vOutEchydna` · *Outfit: Unclothed / Bare*
  Swimming deep past the canal lock in the dark while Qiulong runs her Friday back-room game and Errata hits the strip. Called now, she steps straight out of the lower bath stair dripping cold dark water across the stone.
- **Saturday `13:00–17:00` (`780–1020`)** · `vEchydnaSuite` · *Outfit: Suburban Mom*
  Sorting small offerings, shiny shells, and half-forgotten keepsakes in her cool suite while daytime commercials hum. Called now, she offers you a chair without explaining why she called you down.
- **Sunday `13:00–17:00` (`780–1020`)** · `vParlor` · *Outfit: Suburban Mom*
  Sharing the lounge couch silently with Errata during afternoon trash TV until Qiulong yells from the kitchen about dinner. Called now, she pats the cushion beside her knee with calm, possessive ease.

---

## 3. Qiulong — Resort schedule sync (preserving CharacterRoom v2)

Keep Qiulong's validated v2 `Daily` and `Monday–Sunday` structure intact, changing only the room targets and adding light household friction:

- **Shared & private room binding:** `v1ecdff47` → `vParlor` (Front Hall), `vNest` / `vHoard` (her loft), `vBathhouse` (shared baths), `vOut` → **`vOutQiulong` (Antique District & Market)** for `Monday` (Library/bookbinder), `Thursday` (Market & kitchen), `Saturday` (Auction previews), and `Sunday` (Estate sales).
- **Light family crossovers:**
  - `Tuesday 13:00–17:00` (`vBathhouse`): Arrives steamed and annoyed if Mom left wet robe puddles across the hot-pool bench.
  - `Daily 08:00–09:30` (`vParlor`): Breakfast paperback by the warmest window while Echydna quietly clicks on the lounge television at nine.
  - `Daily 19:00–22:00` (`vNest` / `vParlor`): Classic film and dinner—grumbling when Errata sneaks spicy takeout cartons onto the lacquer table or steals chestnuts.
