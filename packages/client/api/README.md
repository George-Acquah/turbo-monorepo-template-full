# @workspace/client-api

Fully-typed API client built on [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/) over
the generated `paths` type from `@workspace/client-types`. **There is no hand-maintained
endpoint map** — every path, param, body, and response type comes from the schema, which is
regenerated from the live API:

```bash
pnpm --filter @workspace/client-types generate-openapi   # needs the API running (non-prod)
pnpm --filter @workspace/client-types build
```

## Usage

```ts
import { createApiClient, unwrap } from '@workspace/client-api';

const client = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL! });

const { data } = unwrap(await client.GET('/api/v1/programmes'));
const created = unwrap(await client.POST('/api/v1/auth/login', { body: { email, password } }));
```

- `createApiClient` — server-side/RSC use (pass an `Authorization` header).
- `createClientFetcher` — browser use (cookies travel automatically).
- `unwrap(result)` — see below.
- `mapArray` / `mapPaginated` — normalize list results.
- `ApiError` — thrown by `unwrap` on the error branch.

## Why `unwrap` exists

Every response is wrapped at runtime by the server's `HttpResponseEnvelopeInterceptor`:

```json
{ "success": true, "statusCode": 200, "data": …, "meta": …, "correlationId": …, "timestamp": … }
```

But `@nestjs/swagger` documents only each route's **inner** payload, so the generated types
describe `data`'s shape, not the envelope. `unwrap()` reconciles that in one place: it throws
`ApiError` for the error branch and returns `{ data, meta }` for the success branch. Call it
at every call site rather than reaching into the envelope by hand.

## Routes that need special handling

**Never call the payment webhook from a browser.**
`POST /api/v1/payments/webhooks/{provider}` is server-only: it is authenticated by an HMAC
signature over the **raw** request body and has no guard. It exists for payment providers
(Paystack/Flutterwave/Hubtel) to call. It is in the generated schema because it is a real
route — exclude it from both dashboard apps.

**Idempotency.** Three routes accept an optional `Idempotency-Key` header (24h TTL; the same
key with a different body returns **409 `IDEMPOTENCY_KEY_REUSED`**, and a replayed key with
the same body returns the stored response):

| Route | Key namespace |
|---|---|
| `POST /api/v1/payments/gateway/initiate` | `payments.initiate` |
| `POST /api/v1/enrolments` | `enrolments.create` |
| `POST /api/v1/admin/enrolments/{enrolmentId}/activate` | `enrolments.admin.activate` |

Send a stable, client-generated UUID per logical attempt:

```ts
await client.POST('/api/v1/enrolments', {
  body,
  headers: { 'Idempotency-Key': attemptId },
});
```

**Guest checkout / payment-link tokens.** `POST /api/v1/enrolments` returns an `accessToken`
(a `plt` token, scope `payment`). The payment routes accept **either** a member JWT **or**
that token via `PaymentLinkOrJwtGuard`, which is what lets a guest complete checkout without
an account. Send it as `Authorization: Bearer <accessToken>`.

**File uploads are presigned, not multipart.** `POST /api/v1/files/uploads` returns a
`presignedUrl`; the browser `PUT`s the bytes directly to storage, then calls
`POST /api/v1/files/uploads/{uploadId}/complete`. There is no multipart endpoint on the API.

**Date/string inconsistency.** Most response DTOs type timestamps as `Date` (ISO strings on
the wire), but `PaymentStatusResponse.paidAt` and `LessonProgressResponse.completedAt` are
typed `string`. Normalize in the consuming layer.
