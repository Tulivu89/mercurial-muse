# Live prompt tests

The Studio's helper prompts, tested by how a real model behaves with them rather than by their wording (`docs/Prompt Engineering Principles.md`; `docs/bids/worldbuilding/decision.md`, *Testing the prompts*). CI never runs these: they cost calls and need a key.

## What they cost

They're sized to be worth running, and to stop as soon as running more wouldn't tell you anything new:

- **Four checks**, one per prompt that matters:
  - **line**: a Line draft is one sentence under 25 words.
  - **section**: a visible section is two to six sentences, never states what the record keeps back, and names no one new.
  - **names**: name ideas give at least three names not already in use.
  - **round**: a round gives two to four answers to each question, none of them "other".
- **A quick pass by default:** five runs of each check. That's about 25 calls in all, a few more if some answers are sent back. On NovelAI or a local model it takes a few minutes.
- **A rate, not perfection:** a check passes when no more than one run in five fails (`PROMPTS_ALLOW=0.2`). A check stops as soon as it can't pass any more, so a broken prompt costs two or three calls, not twenty.
- **A cap:** the whole run never makes more than 60 calls (`PROMPTS_MAX_CALLS`).
- **A memory:** each result is kept in `studio/live/results.json` on your machine (git ignores it), and the next run prints the last result on the same model beside the new one.

A **full pass** of twenty runs is for one prompt you're changing, never for all four: `PROMPTS_ONLY=section PROMPTS_RUNS=20`.

## Running them

From the repository root, with your own model:

```bash
PROMPTS_BASE=https://text.novelai.net/oa/v1 PROMPTS_KEY=your-key PROMPTS_MODEL=glm-4-6 npm run prompts:live
```

| Setting | What it is |
| --- | --- |
| `PROMPTS_BASE` | The provider's OpenAI-style address, ending before `/completions` or `/chat/completions`. A local server works too, such as `http://localhost:8080/v1`. |
| `PROMPTS_KEY` | Your key, if the provider needs one. It goes only to that address. |
| `PROMPTS_MODEL` | The model's name as the provider lists it. |
| `PROMPTS_MODE` | `prompt` (the default: the model's own format, with the start of the reply written for it) or `chat`. |
| `PROMPTS_FORMAT` | The prompt format, if the model's name doesn't give it away: `glm`, `chatml`, `qwen3`, `llama3`, `mistral`, `mistral-legacy`, `gemma` or `deepseek`. |
| `PROMPTS_RUNS` | Runs per check: 5 unless set. |
| `PROMPTS_ONLY` | Only these checks, by name, separated by commas: `line`, `section`, `names`, `round`. |
| `PROMPTS_ALLOW` | The share of runs allowed to fail: 0.2 unless set. |
| `PROMPTS_MAX_CALLS` | The most calls in the whole run: 60 unless set. |
| `PROMPTS_DEBUG` | Set to 1 to print every raw reply. |

## When to run them

- **Once per model you'll actually use,** to see where it stands.
- **Before and after changing a prompt,** on the same model, with only that prompt's check. A change that fails more often doesn't ship.
- **Not on every change to the Studio.** The canned-reply tests in `studio/tests/` cover the code on every commit, for free.
