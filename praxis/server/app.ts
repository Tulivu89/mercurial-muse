// The Praxis server is deliberately thin. It serves the built interface and relays narration
// requests to the providers it knows, with the player's own key. It holds no play state: saves
// live in the browser.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { providersFrom, type ProviderInfo } from '../src/narration/providers.js';
import { publicProviders, relayChat, relayModels } from './narration-relay.js';

export interface AppOptions {
  production?: boolean;
  // Injected in tests so no request leaves the machine.
  fetch?: typeof fetch;
  // The providers to relay to; by default the built-in ones and any in PRAXIS_PROVIDERS.
  providers?: ProviderInfo[];
}

// The player's key for the provider: X-Provider-Key, or the older X-NovelAI-Token.
const keyOf = (request: Request) => request.get('x-provider-key') ?? request.get('x-novelai-token');

export function createApp(options: AppOptions = {}) {
  const app = express();
  const fetchImpl = options.fetch ?? fetch;
  const providers = options.providers ?? providersFrom(process.env.PRAXIS_PROVIDERS, (message) => console.warn(`[praxis] ${message}`));
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'praxis-api' }));

  app.get('/api/narration/providers', (_request, response) => response.json({ providers: publicProviders(providers) }));

  app.get('/api/narration/models', async (request, response, next) => {
    try {
      const provider = typeof request.query.provider === 'string' ? request.query.provider : undefined;
      const result = await relayModels(fetchImpl, providers, provider, keyOf(request));
      response.status(result.status).json(result.body);
    } catch (error) { next(error); }
  });

  app.post('/api/narration/chat', async (request, response, next) => {
    try {
      const result = await relayChat(fetchImpl, providers, keyOf(request), request.body);
      response.status(result.status).json(result.body);
    } catch (error) { next(error); }
  });

  if (options.production) {
    const directory = path.dirname(fileURLToPath(import.meta.url));
    const webRoot = path.resolve(directory, '../../dist');
    app.use(express.static(webRoot, { index: false, maxAge: '1h' }));
    app.get('*splat', (_request, response) => response.sendFile(path.join(webRoot, 'index.html')));
  }

  // Never echoes request details, so a token cannot leak through an error.
  app.use((_error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    response.status(500).json({ error: 'Praxis request failed.' });
  });
  return app;
}
