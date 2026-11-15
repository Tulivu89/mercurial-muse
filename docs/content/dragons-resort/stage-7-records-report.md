# Stage 7: Records Report (`dragons-resort-world.json`)

Nov 14, 2026 · @AmbiProp · Packed **Autumn's Leaves** (`Qiulong`, `Errata`, `Echydna`, 2 groups, 12 places, 1 arrival scenario, and 2 lore entries) into a single `studio-world/1` file (`dragons-resort-world.json`), calibrated against `docs/content/standard.md`, `.claude/skills/inkwyrm-records/SKILL.md`, and `docs/bids/content/mo-03-style.md`.

---

## 1. `content:check` Output

```text
# Autumn's Leaves: 20 records
Premise 75 t · every line together 582 t

| Tier | Count | Line words avg/max | Here avg/max | Named avg/max | Chat avg/max |
| --- | ---: | ---: | ---: | ---: | ---: |
| group | 2 | 14 / 14 | 0 / 0 | 71 / 81 | 0 / 0 |
| place | 12 | 14 / 16 | 60 / 72 | 0 / 0 | 0 / 0 |
| scenario | 1 | 16 / 16 | 16 / 16 | 0 / 0 | 0 / 0 |
| lore | 2 | 15 / 17 | 0 / 0 | 54 / 55 | 0 / 0 |
| lead | 3 | 17 / 18 | 704 / 789 | 255 / 268 | 1884 / 2392 |

**Heaviest moments** (a place, its parent, the four heaviest people):
- Errata's Spare Room in Autumn's Leaves: about 2699 t
- Front Hall in Autumn's Leaves: about 2698 t
- Echydna's Suite in Autumn's Leaves: about 2696 t
- Hoard and Restoration Bench in Autumn's Leaves: about 2694 t
- Kitchen and Back Jetty in Autumn's Leaves: about 2688 t

## Missing: 0
## Over budget: 0
## Checks: 0
## Look twice (failure-list catches): 0
```

Per-lead breakdown:
- **Qiulong:** `line 16w` · `here 789t` · `named 268t` · `when 247t` · `chat 2392t`
- **Errata:** `line 18w` · `here 635t` · `named 266t` · `when 287t` · `chat 1628t`
- **Echydna:** `line 17w` · `here 687t` · `named 232t` · `when 226t` · `chat 1632t`

---

## 2. Judgement Calls & Standard Alignment

1. **Qiulong Adapted Without Cutting Her Chat Voice.** Preserved Qiulong v2's verbatim greeting and all 6 example chats (`2392t`, under the `2400t` cap) plus her v2 needs, home actions, bond meter (`Hers`), figures, and week structure—re-pointing her outside slots (`Monday`, `Thursday`, `Saturday`, `Sunday`) to `vOutQiulong` and cleaning the four failure-list flags (`as if`, `noticed`, `earned`, `careful`) while splitting `Speech` cleanly out of `Personality` and `Appearance`.
2. **Strict `Here` Split Across All Three Leads.** Separated `Appearance` (build, coloring, involuntary tells, distinct closing features: Qiulong's crimson tail, Errata's calligraphy-brush ink tail, Echydna's glowing rib gill-slits + finned tail), `Personality` (observable *when X, does Y* responses), and `Speech` (tone, length, cadence, shifts). Removed every comparison (`like`, `as if`) and pose note from reference entries and `Outfits` sets.
3. **`Named` Compression + `When` Tier Gating.** Shared species and family facts live once in `Dragon` and `Echydna's House` groups. Each lead's `Named` fields (`Background`, `Wants`, `Family`, and primary hooks) sit under `270t` (`<= 300t` budget), while intimacy-gated material (`Portraits` / `Bad Company` / `Pampering and Worship` at `acquaintance`; `The Cabinet` / `Past the Velvet Rope` / `The Complication` at `close`; `In Bed` at `romantic`) sits cleanly behind `when` conditions.
4. **Chat-vs-NPC Unity.** Built directly on `studio-world/1`: narrator calls read `Line`, `Here`/`Named`/`When`, `Outfits`, and `Schedule` while skipping `greetings` and `examples`; chat calls read all sections plus `greetings` and `examples`. Every schedule event carries both `rooms` (Scenario set member), `place` (Place record ID for census/adventure checks), and `sets` (active Outfit ID).
5. **Open Pilot Item Deferred to Play-Test (Stage 8):** `chat/src/errata.ts` integration (whether site mascot Errata shares this exact card or keeps a lighter front-page wrapper) and 28k-window multi-lead context tests (`A2`, `A4`, `A5`, `A6` on GLM-4.6 / Xialong).
