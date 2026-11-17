# Notes: Character Card V2 and V3

Nov 17, 2026 · @AmbiProp

Read from `kwaroran/character-card-spec-v3` (SPEC_V3.md, MIT) and `malfoyslastname/character-card-spec-v2` (spec_v2.md, no licence stated). The V3 spec's `concepts.md` and the shared keyword definitions were not read.

## V2 (`chara_card_v2`, `spec_version: "2.0"`)

- `data` holds the V1 fields (name, description, personality, scenario, first_mes, mes_example) plus creator_notes, system_prompt, post_history_instructions, alternate_greetings, character_book, tags, creator, character_version, extensions.
- **Nothing is ever destroyed.** Optional fields and unknown keys in `extensions` must survive import and export. This is the rule an exporter has to keep.
- `system_prompt` and `post_history_instructions` override the player's own unless empty, and `{{original}}` inside them stands for what they replace.
- **The book**: name, description, scan_depth, token_budget, recursive_scanning, extensions, entries.
- **An entry**: keys, content, extensions, enabled, insertion_order (lower goes in earlier); optional case_sensitive, name, priority (lowest dropped first over budget), id, comment, selective with secondary_keys (needs a key from both lists), constant, position (`before_char` or `after_char`).

## V3 (`chara_card_v3`, `spec_version: "3.0"`)

New on the card:
- `nickname`: `{{char}}` becomes this, not the name.
- `group_only_greetings` (must be present, may be empty): greetings for group chats only.
- `assets`: `{type, uri, name, ext}`. Types icon, background, user_icon, emotion, other, or `x_` custom. URIs are https, data URLs, `embeded://path` (spelled that way on purpose) or `ccdefault:` (the card's own picture). With none, the PNG itself is the icon.
- `creator_notes_multilingual`, `source` (append only), `creation_date`, `modification_date` (Unix seconds).
- Apps must not add top-level fields; their own data goes in `extensions`, namespaced.

The book adds `use_regex` on entries and makes `constant` required to implement. A standalone book is `{ spec: "lorebook_v3", data: <book> }`.

**Decorators** are lines starting `@@` at the top of an entry's content. An app strips them before the text is sent and ignores the ones it doesn't know:

| Decorator | What it does |
| --- | --- |
| `@@depth N`, `@@reverse_depth N`, `@@role` | Place the entry N messages back, as a given role |
| `@@position V` | before or after the description, in personality, in scenario |
| `@@activate_only_after N`, `@@activate_only_every N` | Not before message N; only every Nth message |
| `@@keep_activate_after_match`, `@@dont_activate_after_match` | Stay on once matched; fire once |
| `@@scan_depth N` | How far back this entry looks |
| `@@additional_keys`, `@@exclude_keys` | Also needs one of these; never with these |
| `@@is_greeting N`, `@@is_user_icon NAME` | Only with that greeting; only with that user picture |
| `@@activate`, `@@dont_activate` | Force on; force off |
| `@@ignore_on_max_context` | Dropped first when context is full |
| `@@disable_ui_prompt` | Turn off the app's system prompt or post-history prompt |
| `@@instruct_*` variants | The same, counted in tokens |

**Where a V3 card lives:**
- PNG: a `tEXt` chunk named `ccv3`, base64 UTF-8 JSON. If both `ccv3` and `chara` are there, `ccv3` wins.
- JSON: the card object.
- CHARX: a zip with `card.json` at the root and assets under `assets/{type}/images/` and so on, referenced as `embeded://`.

**Macros the spec makes required:** `{{char}}` (nickname first), `{{user}}`, `{{random:A,B}}`, `{{pick::A,B}}` (the same pick through one prompt), `{{roll:N}}` or `{{roll:dN}}`, `{{// comment}}` (empty), `{{hidden_key:A}}` (empty but matchable), `{{comment: A}}` (shown, not sent), `{{reverse:A}}`. Names are case-insensitive.
