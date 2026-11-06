# Praxis

Praxis is a single-player chat RPG for The Howling Whispers: text-adventure roleplay with optional dice-driven mechanics, modeled on Character Engine. It loads a world module whose starting records come from Orbis, and keeps the live records in the player's own save.

The scope, architecture and release plan are in *Praxis — Charter* in the Howling Whispers dev project.

## Status

`0.19.0`. The engine has the state primitive, the clock and calendar, places and travel, scene presence, dossiers, schedules that hold while you are with someone, followers, relationships with bond tiers, growth through experience, coin and goods with bribes and bargains, making things with Focus, authored scene actions, checks on the Four Approaches and Genesys dice against every person, thing and place, the standard `four-approaches/1` ruleset, the save with its ledger, turns with reroll and undo, the journal, local records, and a context compiler sized to the model's window. The first module, *Abernys: Port Covenant*, is in `modules/`. The interface plays it with narration through NovelAI on the player's own key; saves stay in the browser and can be exported and imported. The Java prototype that preceded this is in the history at `d3b13ee`.

## Layout

```text
src/engine   rules: pure TypeScript, no DOM or network
src/ui       the interface
modules      playable modules (praxis-module/1)
server       thin API: health, and a NovelAI relay that forwards the player's key per request
tests        Vitest
```

## Try a branch without deploying

Open the repository on GitHub, switch to the branch you want (a pull request names its branch), then **Code → Codespaces → Create codespace on …**. The first start installs and builds, which takes a few minutes. When **Praxis** (port 8791) appears in the **Ports** tab, click the globe beside it. Narration works there with your own NovelAI token.

A terminal opens and shows the build; the app is ready when it says so. If it doesn't start, run `bash praxis/scripts/codespace-start.sh` in a terminal and read what it prints. Stop the codespace from **Code → Codespaces** when you're done; it also stops on its own after 30 idle minutes.

## Develop

```bash
npm install
npm run dev:api
npm run dev
```

Open `http://localhost:5176`.

Before committing:

```bash
npm test
npm run lint
npm run build
```

## Narration

Players choose where narration comes from in Settings: NovelAI, OpenRouter, Featherless, ArliAI, Infermatic, NanoGPT, DeepSeek or Z.ai, or a server of their own.

- **A listed provider** goes through the Praxis server: `/api/narration/providers`, `/api/narration/models?provider=…` and `/api/narration/chat`, with the player's key in the `X-Provider-Key` header. The server relays only to the providers in its list (`src/narration/providers.ts`), never stores, logs or echoes a key, and has no key of its own.
- **The player's own server** (koboldcpp, llama.cpp, LM Studio, Ollama, TabbyAPI, vLLM, anything OpenAI-compatible) is called from the browser directly with the same request, so the relay can never be pointed at an arbitrary address. That server has to allow the site's requests (CORS); from an https page, plain http works only for localhost.

By default Praxis writes the conversation out as one prompt in the model's own format (GLM, ChatML, Qwen 3, Llama 3, Mistral, Gemma or DeepSeek, guessed from the model's name or chosen in Settings) and sends it to the completions endpoint, so the model continues the reply Praxis has started. Providers without a completions endpoint get chat messages.

A server operator can add providers, such as a partner's endpoint, with `PRAXIS_PROVIDERS`, a JSON list in the shape of `providerSchema`:

```
Environment='PRAXIS_PROVIDERS=[{"id":"partner","name":"Partner","base":"https://api.partner.example/v1","chatPrefill":"assistant"}]'
```

This relay stays until Orbis's generation gateway can carry Praxis.

## Deploy

**A new server from a phone, no terminal** (Hetzner, or any host with a cloud-config or "user data" box): create an Ubuntu 24.04 server with public IPv4 and paste all of `deploy/cloud-config.yaml` into its Cloud config box. Two minutes after it starts, open `http://<its IPv4>`: the page there gives the deploy key to add on GitHub, with a link to the right page, then shows the install's progress, then sends you on to `https://<ip>.sslip.io`. If setup stops, the page shows the end of the log (`/var/log/muse-setup.log`). It runs `deploy/setup-server.sh` from `main`, without questions.

**A new server from a terminal** (Ubuntu 24.04 on Hetzner, DigitalOcean or similar): copy the repository's `deploy/setup-server.sh` to it and run `bash setup-server.sh` as root. It asks for the repository, the address (until there is a domain, `<your-ip>.sslip.io` gets real HTTPS) and an optional email, then installs Node 22, nginx and certbot, makes a `praxis` account that owns the repository in `/srv/muse` (Praxis in `/srv/muse/praxis`), clones with a deploy key it shows you to add on GitHub, builds, runs the `praxis` service on 127.0.0.1:8791 behind nginx with HTTPS, and turns on the firewall. Optional settings such as `PRAXIS_PROVIDERS` go in `/etc/praxis.env`.

**Updates:** as root on the server,

```
bash /srv/muse/deploy/deploy.sh
```

It fetches `main`, shows what is running and what is new, pulls, installs dependencies if the lockfile changed, runs the tests, type checks and build as the `praxis` account, restarts the service, and checks that it answers. It stops at the first failure, before the running service is touched. `--force` rebuilds and restarts even when nothing is new.

## License

Not yet chosen.
