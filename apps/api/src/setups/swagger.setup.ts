import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  APP_RUNTIME_CONFIG_TOKEN,
  type AppRuntimeConfig,
} from '@workspace/ports/config';
import type { AppRequest as Request, Response, NextFunction } from '@workspace/types';

// Mirrors origin-auth.middleware.ts's ORIGIN_AUTH_EXEMPT_GET_PATHS set — Swagger
// mounts bare at these paths, not under the API's global prefix.
const DOCS_PATHS = new Set(['/docs', '/docs-json', '/docs-yaml']);
function isDocsRequest(path: string): boolean {
  return DOCS_PATHS.has(path) || path.startsWith('/docs/');
}

export function configureSwagger(app: INestApplication): void {
  const { enableSwagger, baseUrl, nodeEnv } = app.get<AppRuntimeConfig>(
    APP_RUNTIME_CONFIG_TOKEN,
  );
  if (!enableSwagger) {
    return;
  }

  // SwaggerModule.setup() below registers its routes directly on the
  // underlying HTTP adapter, bypassing ContextMiddleware entirely (Swagger's
  // routes are never wired through Nest's module-based middleware consumer
  // system, only Nest-routed controller paths are) — so /docs*, unlike every
  // other route, never got ContextMiddleware's production-only security
  // headers (X-Content-Type-Options, X-Frame-Options, etc). Confirmed by a
  // ZAP scan finding X-Content-Type-Options missing only on /docs-json,
  // nowhere else. An earlier attempt to fix this by reordering `app.init()`
  // ahead of `configureSwagger()` broke Swagger's routes entirely (404s) —
  // reverted. This narrower fix just sets the same headers directly for
  // docs routes, independent of Nest's middleware/init lifecycle.
  if (nodeEnv === 'production') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (!isDocsRequest(req.path)) return next();
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      res.setHeader(
        'Permissions-Policy',
        'geolocation=(), camera=(), microphone=(), interest-cohort=()',
      );
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      next();
    });
  }

  const config = new DocumentBuilder()
    .setTitle('Workspace API')
    .setDescription(
      `## Workspace API\n\n` +
        `The template's HTTP surface — auth, identity/RBAC, audit, notifications, ` +
        `profiles, and files.\n\n` +
        `### Authentication\n` +
        `Most endpoints require a **Bearer JWT** access token. ` +
        `Obtain one via \`POST /api/v1/auth/login\`, then click **Authorize** above and paste the token.`,
    )
    .setVersion('1.0')
    // Without an explicit server, Swagger UI fires "Try it out" requests at
    // `window.location.origin` — fine when docs are viewed at the API's own
    // origin, but wrong (and CORS-blocked) whenever the deployed docs page is
    // reached through a different host/subdomain than the API itself (a
    // proxy, gateway, or custom domain split). Pinning it to `baseUrl` makes
    // every request target the real API origin regardless of how the docs
    // page was reached.
    .addServer(baseUrl)
    .setContact(
      'Workspace Support',
      'https://example.com',
      'support@example.com',
    )
    // No custom scheme name → defaults to 'bearer', which matches all existing
    // @ApiBearerAuth() decorators (no-arg form also defaults to 'bearer').
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Paste the access token returned by POST /api/v1/auth/login',
    })
    // ── Tag groups (order controls sidebar order in the UI) ─────────────────
    .addTag('System', 'Health checks and infrastructure status')
    .addTag('Auth', 'Registration, login, token refresh, and password reset flows')
    .addTag('Profiles', 'Member profile management (guest-checkout aware)')
    .addTag('Catalog', 'Programmes, price plans, cohorts, and masterclasses')
    .addTag('Enrolments', 'Enrol into programmes, cohorts, and masterclasses')
    .addTag('Billing', 'Orders, invoices, payments, refunds, and webhooks')
    .addTag('Memberships', 'Subscriptions, access grants, and community links')
    .addTag('Learning', 'Courses, lessons, resources, and progress tracking')
    .addTag('Events', 'Live events, registrations, and replays')
    .addTag('Notifications', 'In-app, email, SMS, and push notification delivery')
    .addTag('Files', 'Upload, list, stream, and delete file attachments')
    .addTag('Audit', 'Tamper-evident audit trail of all mutating actions')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Workspace API Docs',
  });

  console.log(`Swagger running at ${baseUrl}/docs`);
}
