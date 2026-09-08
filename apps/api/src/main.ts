import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  HTTP_RUNTIME_CONFIG_TOKEN,
  STORAGE_RUNTIME_CONFIG_TOKEN,
  type HttpRuntimeConfig,
  type StorageRuntimeConfig,
} from '@workspace/ports/config';
import { static as serveStatic } from 'express';
import { AppModuleWithMiddleware as AppModule } from './app.module';
import { configureHttpApp } from './app.setup';

async function bootstrap() {
  // `bodyParser: false` + `useBodyParser(...)` in `configureHttpApp` (not a
  // plain `express.json()`/`urlencoded()` via `app.use`) — Nest only installs
  // its own rawBody-capturing body parsers if it doesn't see middleware
  // named `jsonParser`/`urlencodedParser` already applied, which plain
  // express's `json()`/`urlencoded()` are (same underlying body-parser
  // functions). Without this, `rawBody: true` is silently a no-op and
  // `req.rawBody` is never populated — required for webhook signature
  // verification (exact bytes, never `JSON.stringify(req.body)`).
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
    bodyParser: false,
  });

  // Single reverse-proxy hop (Railway's edge). Without this, Express's own
  // `req.ip` resolves to the proxy's IP for every request, not the real
  // client — which silently collapses all anonymous traffic (rate-limit
  // tracking, IP logging) onto one shared bucket in production.
  //
  // Confirmed via docker/zap/probes/ratelimit_probe.py against the ZAP
  // stack: rotating X-Forwarded-For per request fully bypasses the IP-
  // tracked login rate limit there (baseline burst hits 429 after ~8
  // attempts; with a rotated XFF per request, all 15 pass) — expected there
  // specifically, since no real proxy sits in front of zap-api (unlike
  // production behind Railway).
  //
  // Whether this reproduces in real production depends on Railway's edge
  // behavior. A Railway employee ("phin") states on their own community
  // forum: "We do strip X-Forwarded-For at our edge and ensure clients
  // cannot overwrite it. The first value of the X-Forwarded-For is the real
  // connecting IP." (station.railway.com/questions/
  // security-critical-questions-on-edge-prox-8fddd775) — if accurate, an
  // attacker's own injected XFF value never survives to reach this process,
  // which would make the exploit above NOT reproduce here. NOT settled,
  // though: the SAME reply also says "You may see another hop as the
  // request is forwarded through our network" — i.e. Railway's own staff
  // describes the hop count as variable, not a fixed, guaranteed 1 — and a
  // separate user in that same thread reports a real discrepancy between
  // configured trust settings and observed behavior. So: the specific
  // rate-limit-bypass-via-forged-IP risk is probably closed in production,
  // but `trust proxy: 1` being the exactly correct hop count is not
  // confirmed with certainty. If IP-dependent behavior (rate limits, audit
  // logs) ever looks wrong in production, check the actual X-Forwarded-For
  // value arriving here before assuming this line is correct — don't
  // change it without a real request trace confirming what's actually
  // needed.
  app.set('trust proxy', 1);
  // Express sets this by default on every response, advertising the
  // framework to any caller — no reason to hand that out for free.
  app.disable('x-powered-by');

  configureHttpApp(app);

  const storageConfig = app.get<StorageRuntimeConfig>(
    STORAGE_RUNTIME_CONFIG_TOKEN,
  );
  if (storageConfig.provider === 'local') {
    const storageRoot = resolve(process.cwd(), storageConfig.local.rootPath);
    app.use('/storage', serveStatic(storageRoot));
  }

  const httpConfig = app.get<HttpRuntimeConfig>(HTTP_RUNTIME_CONFIG_TOKEN);

  await app.listen(httpConfig.port, '0.0.0.0');
}

void bootstrap();
