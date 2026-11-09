// The Praxis server is deliberately thin. It serves the built interface and relays narration
// requests to the providers it knows, with the player's own key. It holds no play state: saves
// live in the browser.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { type NextFunction, type Request, type Response } from 'express';
import { providersFrom, type ProviderInfo } from '../../core/narration/providers.js';
import { publicProviders, relayChat, relayModels, relayStream } from './narration-relay.js';

export interface AppOptions {
  production?: boolean;
  // Injected in tests so no request leaves the machine.
  fetch?: typeof fetch;
  // The providers to relay to; by default the built-in ones and any in NARRATION_PROVIDERS
  // (PRAXIS_PROVIDERS, its name before 0.22.0, is still read).
  providers?: ProviderInfo[];
}

// The player's key for the provider: X-Provider-Key, or the older X-NovelAI-Token.
const keyOf = (request: Request) => request.get('x-provider-key') ?? request.get('x-novelai-token');

export function createApp(options: AppOptions = {}) {
  const app = express();
  const fetchImpl = options.fetch ?? fetch;
  const providers = options.providers ?? providersFrom(process.env.NARRATION_PROVIDERS ?? process.env.PRAXIS_PROVIDERS, (message) => console.warn(`[narration] ${message}`));
  app.disable('x-powered-by');
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_request, response) => response.json({ ok: true, service: 'inkwyrm' }));

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

  // The same request, answered as server-sent events so a reply shows as it is written.
  app.post('/api/narration/stream', async (request, response) => {
    const gone = new AbortController();
    response.on('close', () => { if (!response.writableEnded) gone.abort(); });
    response.status(200).set({ 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no', Connection: 'keep-alive' });
    response.flushHeaders();
    try {
      await relayStream(fetchImpl, providers, keyOf(request), request.body, ({ event, data }) => {
        if (!response.writableEnded) response.write(`event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`);
      }, gone.signal);
    } catch {
      // Never echoes request details, so a token cannot leak through an error.
      if (!response.writableEnded) response.write(`event: error\ndata: ${JSON.stringify({ type: 'error', status: 500, error: 'The request failed.' })}\n\n`);
    }
    response.end();
  });

  if (options.production) {
    const directory = path.dirname(fileURLToPath(import.meta.url));
    const webRoot = path.resolve(directory, '../../../dist');
    // The Studio is its own build, served under /studio/ (built from studio/ at the repository root).
    const studioRoot = path.resolve(directory, '../../../../studio/dist');
    if (existsSync(studioRoot)) {
      app.use('/studio', express.static(studioRoot, { index: false, maxAge: '1h' }));
      app.get(['/studio', '/studio/*splat'], (_request, response) => response.sendFile(path.join(studioRoot, 'index.html')));
    }
    // Chat is its own build too, served under /chat/ (built from chat/ at the repository root).
    const chatRoot = path.resolve(directory, '../../../../chat/dist');
    if (existsSync(chatRoot)) {
      app.use('/chat', express.static(chatRoot, { index: false, maxAge: '1h' }));
      app.get(['/chat', '/chat/*splat'], (_request, response) => response.sendFile(path.join(chatRoot, 'index.html')));
    }
    app.use(express.static(webRoot, { index: false, maxAge: '1h' }));
    app.get('*splat', (_request, response) => response.sendFile(path.join(webRoot, 'index.html')));
  }

  // Never echoes request details, so a token cannot leak through an error.
  app.use((_error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    response.status(500).json({ error: 'The request failed.' });
  });
  return app;
}
