# Bot-Writing Process Retrospective & LLM Hand-Off Guide

Nov 14, 2026 · @AmbiProp · Captured from the Errata (Stages 0–4), Echydna (Stages 0–4 + NAI V5), and Resort (Stages 5–6) build. Focus: what triggered rewrites vs. straight approvals, and how to structure future LLM hand-offs so characters land in fewer passes.

---

## 1. Critique Log: What Failed, Why, and What Fixed It

| Stage | What missed the mark | Root cause | What fixed it |
|---|---|---|---|
| **Errata Stage 0 (Prior chat)** | Pitched Anne Shirley, Howl, and Amélie for a goth baddie mascot. | The brief gave species + negative exclusions (no Elizabeth, Jo, Cyrano, Morticia) without stating her **aesthetic/role vibe** up front. | Give **2–3 positive vibe/role anchors** first ("goth baddie dragon muse, site's mascot"), then contrast against existing cast. |
| **Errata Stages 1 & 3 (Take 1)** | 5 of 6 chats centered on drafts/editing; felt like a job description. | LLM latched onto "muse" as 100% of her identity instead of grounding a whole young woman's off-clock life. | Added night-shift history, B-horror/trash TV, dirty pool/arcade play, strays, spicy takeout, and self-destructive creep pattern. Dropped writing to **1 of 6 chats**. |
| **Errata Stage 4 (Take 1)** | Put outfits inside Always-On `Wardrobe` and invented an Always-On `Her Corner` block. | Hand-off didn't explicitly separate **Set brains** (mutually exclusive outfits) from **Always-On** and **Keyed** brains. | Moved all 5 outfits (with *how she wears them*) into a **Set brain**; kept Always-On empty; moved `In Bed` from neat undressing to clothes half-on / bathroom / thin walls. |
| **Echydna NAI V5 (Take 1)** | Used 2 character blocks; initial pool too narrow before expanding, then narrowed cleanly. | Copied Errata's PNG structure blindly instead of putting framing in Base Prompt and character details in 1 block. | **Wide → Narrow** wildcard loop (`\|\| a \| b \| c \|\|`) inside **1 character block**, then locked winning hits (dark indigo skin, constellation freckles, no scutes, inlaid mother-of-pearl stretchmarks, fin-ears/tail, no pupils, horn-eye). |
| **Echydna Stage 3 (Take 1)** | Repeated `fear`/`pulse` 4 times; 5 of 6 scenes ended in erotica or stranger-evaluation. | Classic LLM drift on "scary/sexy" prompts: leaning on sensory tics (`pulse`) and keeping `{{user}}` stuck in an endless entrance exam. | Cut `fear`/`pulse` outside Chat 1 (`Guest`); made Chats 2–5 **non-erotic, post-threshold household scenes** (daytime judge TV, hair/scale oiling & mortal aging, feeding canal clutch, bleeding-arm complication). |

---

## 2. Why "Proposal → Execution" Won (and the Stage-Order Fix)

### A. Lightweight Proposal Before Heavy Prose
Every straight approval in this session followed the same two-step rhythm:
1. **Short design checkpoint first** (3 distinct 1–2 line seeds, or a non-writing life sketch, or a 1-page spatial/schedule plan).
2. **Owner injects the missing human complication** *before* full prose gets written:
   - *Shego front → Elvira up close*
   - *Self-destructive streak letting creeps use her*
   - *Stretchmarks like inlaid mother of pearl / no belly scutes*
   - *Makima + Manhattan + hurting someone rare*
   - *Suburban mom outfit + daytime TV + breeding/overpowering*
   - *Mom ate Errata's father / "oh, that's just Mom"*
3. **Full prose executes cleanly in 1 pass.**

*Why it works:* Reviewing 15 bullet lines takes 30 seconds and makes gaps obvious. Reviewing 2,000 words of finished dialogue hides structural repetition behind decent sentences.

### B. Do Brains (Stage 4) *Before* Example Chats (Stage 3)
In `pilot-brief.md`, Example Chats (Stage 3) sit before Brains (Stage 4). In practice, flipping **Brains → Example Chats** on Echydna worked dramatically better:
- Example chats must **demonstrate** outfits, hobbies, intimacy rules, and gated secrets **once each** without repeating them.
- Trying to write 6 non-repeating examples *before* defining the 5 Set outfits, daytime quirks, and bed boundaries forces the LLM to invent generic filler—or repeat the default outfit and default tension beat across scenes.
- **Recommended pipeline:** `Seed (0)` → `Appearance + Visual Roll (2)` → `Persona Core (1)` → `Brains: Set Outfits + Keyed Quirks + Gated Rules (4)` → `Palette Map → Greeting & Examples (3)` → `House & Ties (5)` → `Schedules (6)` → `Records (7)`.

*(Even putting Appearance before Persona—or right alongside Seed—helps when image exploration surfaces physical hooks like Echydna's bare belly/stretchmarks or Errata's ink-stained heels that belong in the examples.)*

---

## 3. Anti-Drift Rules for Future LLM Hand-Offs

Include these 6 concrete guardrails in your hand-off prompt so the LLM doesn't regress into one-note defaults:

1. **Positive Vibe + Role First:** State the aesthetic/fantasy archetype up front (*"goth baddie dragon muse"*, *"cosmic horror dragon MILF"*) before listing cast exclusions.
2. **Persona = Decision Core Only:** Tell the model *what* she wakes up for, *what* makes her laugh/snap/soften, and *what* she hides—not long lists of speech quirks or wardrobe habits.
3. **State Brain Architecture Up Front:** Explicitly specify: *Always-On stays empty/minimal; Outfits live in a mutually exclusive Set brain (5 slots: Day, Comfy, Going Out, Sleep, Dirty—describing both clothes and how she wears them); hobbies, quirks, dark past, and Bed rules live in keyed/intimacy-gated Brains.*
4. **The 6-Chat Palette Quotas (Mandatory Before Writing Examples):**
   - **Max 1–2 chats** centered on her primary job/archetype ("muse/editor", "monster evaluation").
   - **At most 1–2 chats** with overt flirting or sexual escalation; **4+ chats must be non-erotic** (everyday hobby, petty argument, bad morning, quiet vulnerability/complication, domestic humor).
   - **Max 1 chat (`Guest`)** evaluating a stranger; Chats 2–6 must treat `{{user}}` as **already past the door**.
   - **1-Use-Per-Tell Lock:** Map every outfit, prop, physical feature, flirt style, and atmospheric tell (`pulse`, `fear`, clothing slip) to **exactly one** chat in a table before drafting.
5. **Mandatory Grounding Questions (Ask/Answer Before Examples):**
   - What mindless or trashy thing does she like when nobody's looking?
   - What makes her genuinely laugh/squeal that has nothing to do with her job or flirting?
   - What non-plot annoyance makes her snap back?
   - What quiet damage or contradiction keeps her from being a flat trope?
6. **Exploration Pattern for Image Gen:** Start with **1 character block** + wide `|| a | b | c ||` wildcards and neutral base lighting → roll → lock winning tags → refine UC exclusions (`no scutes`, `no pupils`, `no cast-member hair/horns`).

---

## 4. Reusable Hand-Off Starter Block

```text
Character concept: [2-sentence vibe/archetype + role in setting]
Already in the cast (do not overlap): [Name: lane] · [Name: lane]
Work in checkpoints—wait for approval between steps:
1. Stage 0 (Seed): Pitch 3 recognizable temperament anchors (1–2 lines each: what she does, no trait lists) + how each contrasts the cast.
2. Grounding Pitch (before Persona/Examples): Propose her off-clock tastes, what makes her laugh/snap outside her job, and one real flaw/complication.
3. Stage 1 (Persona) & Stage 4 (Brains): Persona = decision core only. Brains = empty Always-On, 5-slot Set Outfits (clothes + how worn), keyed quirks/past, and intimacy-gated rules.
4. Stage 3 (Palette Table → Greeting + 6 Chats): Build a 1-use-per-tell table first. Max 1–2 job/archetype chats, max 1 stranger-evaluation (`Guest`) chat, at least 4 non-erotic chats, zero repeated props, poses, or sensory tics (`pulse`, `fear`).
```

---

## 5. Stage 7 Lessons & Formalized Stage 0–7 Pipeline SOP

Completing Stage 7 (`dragons-resort-world.json` validated against `docs/content/standard.md`, `docs/bids/content/mo-03-style.md`, and `npm run content:check`) surfaced three final structural rules that belong in the permanent pipeline:

### Stage 7 Calibration Findings
1. **Reference Text Is Stricter Than Chat Prose.** Similes that work in NAI prompts or example chats (*"like inlaid mother of pearl"*, *"branch like antlers"*, *"rather than shouting"*) fail the `mo-03-style.md` reference checker immediately. Translate similes and contrast framing into flat literal morphology and visible acts when packing `Appearance`, `Personality`, `Speech`, and `Set` outfits.
2. **`Speech` Must Split Cleanly Out of `Personality` and `Appearance`.** Qiulong v2 originally kept speech rhythm inside `Personality` and vocal tone at the tail of `Appearance`. Under Studio defaults (`Here`), separating `Appearance` (body/tells, no clothes/voice), `Personality` (`when this, do that` reactions), and `Speech` (tone/cadence/register, no sample lines) drops per-turn prompt bloat and gives small 28k models separate handles for *action* vs. *wording*.
3. **Budget Discipline Forces Crisp Hook Splits (`named <= 300t`, `chat <= 2400t`).** Putting every trivia detail into `Named` pushes records over the `300t` cap; keeping `Named` to crisp summary hooks (`Background`, `Wants`, `Family`, 1 key hook) and moving deep intimacy lore behind `When` conditions (`bond-acquaintance`, `bond-close`, `bond-romantic`) keeps every moment at ~2,700 tokens (`< 4,000t` ceiling) while preserving full 6-turn example chats (`~1,600–2,400t`).

### Formalized End-to-End Pipeline (Stages 0–7)

| Gate | Deliverable | Review Question (Cheap Checkpoint) |
|---|---|---|
| **0. Seed** | Positive vibe/role + cast exclusions → 3 recognizable 1–2 line anchors | *Can I picture three distinct people doing different things in the same room?* |
| **1. Grounding & Visual Roll** | Off-clock tastes/annoyances/flaw + 1-char-block NAI V5 `\|\| wildcard \|\|` sheet | *Does she have a life outside her job, and are the locked visual hooks distinct?* |
| **2. Persona Core & Appearance** | `Appearance` (body/movement/tells, distinct closer) + `Personality` (decision rules) + `Speech` (cadence) | *Are clothes, poses, voice, and history cleanly separated out of the wrong fields?* |
| **3. Brains & Set Outfits** | Empty Always-On + 5-slot `Outfits` Set (zero poses) + keyed hobbies/family + `When`-gated tier rules | *Do her clothes, mundane habits, and bed boundaries give the examples concrete toys to use?* |
| **4. Palette Table → Greeting & 6 Examples** | 1-use-per-tell map → prose (`pulp-voice`, max 1–2 job chats, 4+ non-erotic, `<= 2400t`) | *Zero repeated tics/props, and is `{{user}}` past the front door after Chat 1?* |
| **5. House, Ties & Space Map** | Shared vs. private rooms + 1 exterior stop per lead + mutual family/cast ties | *Do their ties create natural household friction instead of three isolated islands?* |
| **6. Schedules & Home Sync** | `Daily` + `Monday–Sunday` events binding `place`, `sets` (outfit), `rooms`, `spots`, `needs` | *Can you tell what each character is wearing and doing at any hour without collisions (>4)?* |
| **7. Records Export & `content:check`** | `studio-world/1` JSON (`Group` + `Place` + `Scenario` + `Lore` + `Lead` cards) | **`0 Missing · 0 Over budget · 0 Checks · 0 Failure-list catches`** |

