import type { INestApplication } from '@nestjs/common';
import {
  CORS_RUNTIME_CONFIG_TOKEN,
  type CorsRuntimeConfig,
} from '@workspace/ports/config';

export function configureCors(app: INestApplication): void {
  const { allowedOrigins, allowedHeaders } = app.get<CorsRuntimeConfig>(
    CORS_RUNTIME_CONFIG_TOKEN,
  );

  app.enableCors({
    origin(
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ): void {
      // Server-to-server requests (e.g. Paystack webhooks) send no Origin header — allow them.
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      // Empty whitelist → open during local development; all browser origins are allowed.
      if (
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(requestOrigin)
      ) {
        callback(null, true);
      } else {
        // Deny by returning allow=false, NOT by passing an Error.
        //
        // An Error here is forwarded to next(err) by the cors middleware, and
        // the global filter normalises any non-HttpException to 500 — so an
        // ordinary policy denial was reported as "the server broke". That
        // polluted 5xx alerting and, for two days, masked the fact that the
        // realtime SSE route was itself broken. With allow=false the CORS
        // headers are simply omitted and the browser blocks the response,
        // which is the correct semantics.
        callback(null, false);
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders,
    credentials: true,
    // Return HTTP 200 for preflight OPTIONS requests (some clients reject 204).
    optionsSuccessStatus: 200,
  });
}
