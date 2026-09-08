import { Controller, Get, Inject, Req, Res } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { SkipHttpResponseEnvelope, SkipRateLimit } from '@workspace/decorators';
import type { AppRequest, Response } from '@workspace/types';
import { PROMETHEUS_PORT_TOKEN, PrometheusPort } from '@workspace/ports';
import {
  OBSERVABILITY_RUNTIME_CONFIG_TOKEN,
  type ObservabilityRuntimeConfig,
} from '@workspace/ports/config';

interface MetricsUser {
  user: string;
  pass: string;
}

@Controller('metrics')
export class PrometheusController {
  private readonly auth: MetricsUser;
  constructor(
    @Inject(PROMETHEUS_PORT_TOKEN) private readonly prometheusService: PrometheusPort,
    @Inject(OBSERVABILITY_RUNTIME_CONFIG_TOKEN)
    private readonly config: ObservabilityRuntimeConfig,
  ) {
    this.auth = {
      user: this.config.metricsAuth.user ?? '',
      pass: this.config.metricsAuth.pass ?? '',
    };
  }

  // The bare, unauthenticated `@Get()` that used to live here was removed.
  //
  // On apps/api it resolved to GET /api/metrics on the public custom domain and
  // was additionally listed in ORIGIN_AUTH_EXEMPT_GET_PATHS, so origin-auth did
  // not cover it either — meaning anyone on the internet could read the full
  // Prometheus registry: per-route request counts, status distributions,
  // latency and payload-size histograms, and DB query timings. That is a free
  // endpoint inventory and live traffic dashboard for an attacker.
  //
  // Scrapers must use GET /metrics/auth with credentials. apps/worker has no
  // public domain, so it is unaffected either way.
  //
  // That Basic Auth check is only as strong as the transport in front of it:
  // credentials go over the wire as trivially-decodable base64, not a
  // hash/HMAC — a ZAP scan against this route with no TLS in front of it
  // correctly flags that as "Weak Authentication Method". This is safe in
  // real deployments ONLY because docs/infrastructure/architecture/
  // deployment-topology.md documents every link to apps/api as
  // TLS-terminated at Cloudflare's edge before it ever reaches this
  // process — this route must never be scraped directly over plain HTTP
  // (bypassing Cloudflare) or exposed on an unencrypted origin port. See
  // apps/api/src/middleware/origin-auth.middleware.ts's exemption comment
  // for this same path, which relies on this same assumption.
  //
  // Separately: GRAFANA_METRICS_USER/PASSWORD being actually set in the real
  // Railway environment is unverified as of this writing — see
  // docs/infrastructure/runbooks/security-exposure-map-2026-08-13.md.

  @Get('/auth')
  @SkipRateLimit()
  @SkipHttpResponseEnvelope()
  async getMetricsProduction(@Req() req: AppRequest, @Res() res: Response) {
    const auth = req.headers.authorization;

    if (!this.auth || !auth || !auth.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic');
      return res.status(401).send('Unauthorized');
    }

    // Refuse outright when credentials are not configured, rather than
    // comparing against ''. Both values default to '' when
    // GRAFANA_METRICS_USER/GRAFANA_METRICS_PASSWORD are unset (they are unset
    // in production), so `Authorization: Basic ` + base64(':') decoded to
    // user='' / pass='' and MATCHED — an unauthenticated bypass dressed as auth.
    if (!this.auth.user || !this.auth.pass) {
      return res.status(503).send('Metrics auth not configured');
    }

    const decoded = Buffer.from(auth.split(' ')[1] || '', 'base64').toString('utf-8');

    const separatorIndex = decoded.indexOf(':');
    const user = separatorIndex === -1 ? decoded : decoded.slice(0, separatorIndex);
    const pass = separatorIndex === -1 ? '' : decoded.slice(separatorIndex + 1);

    // Constant-time over fixed-length digests: comparing the raw strings with
    // !== short-circuits on the first differing byte. Hashing first also keeps
    // timingSafeEqual's equal-length requirement from leaking the length.
    if (!PrometheusController.secureEquals(user, this.auth.user) ||
        !PrometheusController.secureEquals(pass, this.auth.pass)) {
      return res.status(403).send('Forbidden');
    }

    const metrics = await this.prometheusService.getMetrics();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  }

  /** Constant-time string comparison via equal-length SHA-256 digests. */
  private static secureEquals(a: string, b: string): boolean {
    const ha = crypto.createHash('sha256').update(a, 'utf8').digest();
    const hb = crypto.createHash('sha256').update(b, 'utf8').digest();
    return crypto.timingSafeEqual(ha, hb);
  }
}
