# Live prompt tests

The Studio's drafting prompts, tested by how a real model behaves with them rather than by their wording (`docs/Prompt Engineering Principles.md`; `docs/bids/worldbuilding/decision.md`, *Testing the prompts*). CI never runs these: they cost calls and need a key.

Each contract runs 20 times at the temperature the Studio uses, and the result is how many runs failed, such as *a Line draft is one sentence under 25 words: 1 failing run of 20; sent back once on 3*. A test fails if any run fails, and the first few failures are printed.

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
| `PROMPTS_RUNS` | How many runs per contract, if not 20. |

## Changing a prompt

Run the tests before the change and after it, on the same models, and put the counts side by side. A prompt that scores worse doesn't ship. The decision asks for three kinds of model: a small local one, Xialong on NovelAI, and a strong one.
