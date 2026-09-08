---
name: implement-backend-feature
description: Add backend logic to a packages/server/* package following the workspace ports/adapters pattern.
---

# Implement a Backend Feature

## Reality check — read this before anything else

There is no `modules/<domain>/` DDD layer in this repo, and `apps/api` is still a placeholder (no
`package.json`, no controllers, no DTOs). Backend logic today lives in the shared
`packages/server/*` packages, in a ports/adapters style — see `packages/server/CLAUDE.md` for the
canonical conventions. When `apps/api` is eventually scaffolded, controller/DTO/use-case layering will
be built on top of these same shared packages, not as a separate invented architecture. Don't add a
controller, DTO, or a `modules/<domain>/` directory for this task unless the task explicitly says
`apps/api` has been scaffolded and asks you to add to it.

## Applicable packages

Real `packages/server/*` subpackages (check `pnpm-workspace.yaml` / each `package.json` if unsure
which one currently owns the concept you're touching):

- `ports`, `types`, `constants`, `config`, `context`, `decorators`, `filters`, `http`, `interceptor`,
  `observability`, `cache`, `utils`
- `auth/core`, `auth/providers/{google,github}`
- `events` (dispatch/mesh/sagas/processors/publisher)
- `infrastructure/databases/{prisma,mongo,core}`, `infrastructure/{redis,queue,email,storage}`,
  `infrastructure/persistence/auth`

## Investigation phase

Before writing any code:

1. **Read `packages/server/CLAUDE.md`** for the conventions that apply repo-wide (ports over concrete
   adapters, no imports from `apps/**`, strict TS, structured config via `@workspace/config`).
2. **Read a comparable existing service/provider in the target package** and match its pattern —
   don't invent a new layering style for one package when the rest of the package follows another.
3. **Check `packages/server/ports/src/`** for the port interface(s) you should depend on instead of a
   concrete adapter (Prisma client, Redis client, an HTTP SDK, etc.).
4. **Check `packages/server/constants/src/`** for existing event type / queue / job name constants
   before adding new ones — the subdirectories are `queue/`, `events/`, `auth/`, `payments/`,
   `identity/`, `notification/`, `workflow/`, `scheduling/`, `database/`, `security/`, `validation/`,
   `transport/`, `shared/`, `errors/`, `ids/`.

---

## Service structure

```typescript
// packages/server/<package>/src/<area>/<verb>-<entity>.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { SOME_REPO_TOKEN, type SomeRepositoryPort } from '@workspace/ports';
import { EVENT_PUBLISHER_TOKEN, type EventPublisherPort } from '@workspace/ports';
import { SomeEvents } from '@workspace/constants';

@Injectable()
export class VerbEntityService {
  constructor(
    @Inject(SOME_REPO_TOKEN) private readonly repo: SomeRepositoryPort,
    @Inject(EVENT_PUBLISHER_TOKEN) private readonly publisher: EventPublisherPort,
  ) {}

  async execute(input: VerbEntityInput): Promise<EntityRecord> {
    // 1. Business logic / validation
    // ...

    // 2. Persist via the repository port — never a concrete Prisma/Redis client directly
    const result = await this.repo.verbEntity(input);

    // 3. Publish a domain event using a typed constant, never an inline string
    await this.publisher.publish({
      eventType: SomeEvents.ENTITY_VERBED,
      aggregateType: 'ENTITY',
      aggregateId: result.id,
      payload: result,
    });

    return result;
  }
}
```

### Rules

- `@Injectable()` on every service class — NestJS DI requires it.
- Never inject a concrete adapter (`PrismaService`, an ioredis client, etc.) directly — inject the
  port token from `@workspace/ports`.
- Event types and queue/job names must use constants from `@workspace/constants` — never inline
  strings.
- This business domain has no multi-tenant/organization concept — don't invent a
  `getOrganizationIdOrFail()`-style tenant-scoping call. `packages/server/ports/src/shared/context.port.ts`
  exists for request/user context (current user, session, request metadata), not tenant scoping.
- Add only the ports genuinely needed; keep constructors minimal.

---

## Registration checklist

After creating the service, register it in the owning package's Nest module (the module file that
already lists that package's providers — read it first rather than assuming a file name), and export
it from the package's `src/index.ts` if other packages/apps need to consume it.

---

## Comment policy

Comments exist to answer **why**, not **what**. This applies to every file type — services, adapters,
event handlers, and (once it exists) controllers/DTOs/spec files.

### When to comment

Write a comment when a reader would reasonably stop and ask "why is this done this way?" without one:

- **Business rules / domain invariants** — guard logic or validation that isn't obvious from the type
  system.
- **Architectural decisions** — why an outbox pattern is used, why a port exists instead of a direct
  call, why a transaction is or isn't used here.
- **Non-obvious persistence quirks** — a Prisma `upsert` on a composite key, a soft-delete filter that
  must be applied manually, a raw query that bypasses the ORM for performance reasons.
- **Divergence from domain language** — when a DTO/record field name doesn't match the domain term,
  explain the mapping.
- **Error-handling intent** — when a `try/catch` deliberately swallows an error or continues a loop
  (partial-success pattern), explain why.
- **Spec-only: ordering assertions** — a `callOrder` array trick or other call-sequencing technique
  that isn't self-documenting.
- **Spec-only: non-obvious mock values** — when `null` means "not found", or a specific shape matters
  for the assertion.

### Do not comment

- Every line — the code should be readable without prose narration.
- Things that restate the variable or function name.
- Standard NestJS/Prisma/Jest API usage unless there is a subtle gotcha.
- Things that repeat the test description in a spec file.

### Format

- **Inline** (`// reason`) — single-line clarification right of or above the relevant line.
- **Block above** — multi-line context before a method, block, or section.
- **Section divider** (`// ── Section name ─────────`) — logical groups inside long services or large
  `describe` blocks.

### Examples

```typescript
// ✅ Explains why a guard runs before a downstream lookup
// Check enrolment status first: an unenrolled user has no member record, so a
// later lookup would throw a confusing NotFoundException instead of this one.
if (!user || user.status !== 'ENROLLED') {
  throw new ForbiddenException('Only enrolled members can access this resource.');
}

// ✅ Explains partial-success intent
} catch {
  // Record the failed id and continue — partial success is preferable to
  // aborting the whole batch.
  failedIds.push(record.id);
}

// ❌ Restates code
const id = result.id; // get the id
```

---

## Unit tests

**Current state**: no `packages/server/*` package has a working `test` script yet, and there is no
Jest/Vitest config anywhere in the repo, despite two orphaned spec files
(`packages/server/events/test/event-publisher.service.spec.ts`,
`packages/server/infrastructure/queue/test/queue-processor.base.spec.ts` — both fully commented out).
Don't assume tests run; check the target package's `package.json` first, and say clearly if a test
harness is missing rather than inventing one as part of an unrelated feature change.

If the package/task you're working on already has (or you've been asked to add) a working test
harness, the recommended pattern once one exists:

- Prefer direct class instantiation over `@nestjs/testing` for simple unit tests — `@Inject()`
  decorators only attach DI metadata and don't affect runtime constructor behavior:
  ```typescript
  const service = new VerbEntityService(repo, publisher);
  ```
- Import Jest APIs explicitly from `@jest/globals` rather than relying on implicit globals:
  ```typescript
  import { beforeEach, describe, expect, it, jest } from '@jest/globals';
  ```
- Keep test support (fixtures, mock factories) local to the package that owns the behavior being
  tested, in a `src/test/` (or similar) directory, rather than centralizing cross-package test
  fixtures in a shared package that doesn't currently exist.
- Cover: not-found/error paths, the happy path with correct arguments passed to the repo/port, the
  return value, and — for anything that publishes an event — that the event fires with the correct
  typed constant and only after the persistence step succeeds.
- Cover every distinct branch of nullable/ternary fallbacks (`a ?? b`, `x ? y : z`) with a dedicated
  test case per branch, not just the happy path.

---

## Verification steps

Use the **narrowest** valid command for the package(s) you touched:

```bash
pnpm --filter @workspace/<package-name> check-types
pnpm --filter @workspace/<package-name> lint
```

**Do not run** root `pnpm check-types`, `pnpm lint`, or `pnpm build` (repo-wide) for a single-package
change — this machine has limited RAM; see the low-RAM rule in root `CLAUDE.md`.

If the change affects a port interface that other packages depend on
(`@workspace/ports`/`@workspace/types`/`@workspace/constants` are the most likely to have many
consumers), grep for real consumers before assuming which other packages need re-checking:

```bash
grep -rl "@workspace/ports" --include="*.ts" packages apps | xargs dirname | sort -u
```
