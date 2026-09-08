# Unit Testing in workspace

## Scope and current reality

Use this skill when adding or changing tests for `packages/server/*` packages in this pnpm/Turborepo
monorepo.

**There is currently no working test harness wired into any package in the repo.** No
`packages/server/*` package has a `test` script (every one of them has exactly four scripts: `build`,
`dev`, `lint`, `check-types`), and there is no Jest or Vitest config anywhere in the repo yet. Two
spec files exist but are fully commented out and orphaned:

- `packages/server/events/test/event-publisher.service.spec.ts`
- `packages/server/infrastructure/queue/test/queue-processor.base.spec.ts`

There is also no `modules/<domain>/` DDD layer, no `@workspace/testing` package, no
`@workspace/finance`, and no multi-tenant/organization concept in this repo — if you see instructions
referencing those, they're stale from an earlier "schools platform" pivot.

This skill is written as **recommended guidance for when a test harness is added** to a package — not
a description of an existing multi-package testing system. If you're asked to add tests to a package
that has no harness yet, say so explicitly and treat wiring the harness (Jest config, `test` script,
`@types/jest`, etc.) as part of the task rather than assuming it already works.

---

## Recommended ownership model (once a harness exists)

- Each `packages/server/*` package should own its own unit tests, mocks, and fixtures, colocated
  under that package (e.g. `src/test/` or alongside the file under test as `<name>.spec.ts`).
- Don't invent a shared cross-package testing package to hold domain-specific fixtures/mocks — that
  encodes business knowledge that belongs to the owning package. If enough truly generic testing
  infrastructure accumulates across packages (e.g. a `createMock<T>()` helper, `flushPromises()`), it
  would be reasonable to propose a new shared package for it, but none exists today — don't assume one
  will be added without being asked.

---

## Explicit Jest imports (once Jest is wired)

Always import Jest APIs explicitly rather than relying on implicit globals:

```typescript
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
```

Explicit imports improve type safety, ESM compatibility, IDE inference, and keep the option open for a
future Vitest migration.

---

## Unit test style

For services/use cases and event handlers, prefer direct class instantiation over booting a NestJS
testing module:

```typescript
const service = new MyService(repo, publisher);
```

Do not use `@nestjs/testing` for simple unit tests — `@Inject()` decorators only attach DI metadata
and don't affect runtime constructor behavior, so a plain `new` is simpler and faster.

Keep domain-specific mock/fixture factories local to the package that owns the behavior being tested:

```typescript
import { jest } from '@jest/globals';
import type { SomeRepositoryPort } from '@workspace/ports';

export function mockSomeRepo(): jest.Mocked<SomeRepositoryPort> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<SomeRepositoryPort>;
}
```

---

## Recommended package-local test layout (once a harness exists)

```text
packages/server/<package>/src/
  <area>/
  test/
    fixtures/
    mocks/
    helpers/
```

Guidelines:

- Keep port/repository mocks in `src/test/mocks/`.
- Keep object fixtures in `src/test/fixtures/`.
- Export stable helpers through a `src/test/index.ts` barrel when it improves imports.

---

## Suggested test config shape (once a harness is added to a package)

A package's `tsconfig.test.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "noEmit": true
  },
  "include": ["src/**/*", "test/**/*"]
}
```

A package's `jest.config.ts` — map only the `@workspace/*` packages this package actually imports
(check its `package.json` dependencies first rather than copying a fixed list):

```typescript
import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/../tsconfig.test.json' }],
  },
  testEnvironment: 'node',
  collectCoverageFrom: ['**/*.(t|j)s', '!**/*.module.ts'],
  coverageDirectory: '../coverage',
};

export default config;
```

Recommended package scripts once this is added:

```json
{
  "scripts": {
    "test": "jest --config jest.config.ts",
    "test:cov": "jest --config jest.config.ts --coverage"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "jest": "^29.7.0",
    "ts-jest": "^29.4.0"
  }
}
```

Adding these files/scripts to a package is itself a real, in-scope change if a task asks for tests in
a package that lacks a harness — just call it out explicitly rather than silently assuming Jest is
already wired.

---

## Service/use-case test checklist

For every `execute()`-style method, test:

- [ ] Throws the expected exception when a required record/aggregate is missing.
- [ ] Calls the expected repository/port method with the exact arguments.
- [ ] Persists (or otherwise completes its primary side effect) before publishing any domain event.
- [ ] Publishes event type constants from `packages/server/constants/src/events/event-type.constants.ts`,
      never raw event strings.
- [ ] Returns the expected value or void result.
- [ ] Every distinct branch of a nullable/ternary fallback (`a ?? b`, `x ? y : z`) has its own test
      case, not just the happy path.

This repo has no multi-tenant/organization concept, so don't add tenant-isolation test cases
(e.g. "rejects data from another organization") unless the domain you're testing genuinely has that
concept — it doesn't exist in `@workspace/ports`' `ContextPort` today.

---

## Event handler test checklist

For every handler, test:

- [ ] `supports()` returns true for intended event types and false for unrelated types.
- [ ] Missing required payload fields cause an early return (or documented error) rather than a crash.
- [ ] Valid events produce the expected side effects.
- [ ] Partial failures are handled without blocking otherwise-successful work, where that's the
      intended behavior.
- [ ] Published follow-up events use constants from `packages/server/constants/src/events/event-type.constants.ts`.
- [ ] External service/queue calls are mocked or faked; unit tests don't hit real infrastructure.

---

## App tests (once apps exist)

`apps/api`, `apps/members`, and `apps/worker` are all still placeholders with no code. Once they're
scaffolded, app-level tests (controller/HTTP integration tests, worker/bootstrap tests) belong in
those app packages, not inside `packages/server/*`.

---

## Database-backed tests

If a package adds database-backed tests, keep the database adapter/reset strategy explicit and
injected rather than hardcoded, and keep such tests isolated and package-owned. Prefer serial
execution per shared database/schema, or allocate isolated test databases/schemas for parallel CI.
Never hardcode real database credentials in a test file or config — read them from an env var.

---

## Turborepo execution

Prefer package-level execution while developing, using the package's real name:

```bash
pnpm --filter @workspace/<package-name> test        # once the package has a working test script
pnpm --filter @workspace/<package-name> check-types
pnpm --filter @workspace/<package-name> lint
```

Do not run root `pnpm test`/`pnpm test:ci`/`pnpm test:affected` by default — see the low-RAM rule in
root `CLAUDE.md`. Test outputs should remain package-local (e.g. `coverage/**`) so Turbo caching stays
granular, once caching is relevant.

---

## Naming conventions

- Test files: `<unit-under-test>.spec.ts`
- Integration tests: `<feature>.integration.spec.ts`
- Fixtures: `<entity>.fixture.ts`
- Mocks: `mock-<port-or-repository>.ts`
- Generic shared utilities: no business/domain nouns in filenames

---

## Anti-patterns to avoid

- Assuming a test harness or `test` script already works without checking the package's
  `package.json` first.
- Inventing tenant/organization-scoped test cases that don't apply to this domain.
- Referencing `modules/<domain>/`, `@workspace/testing`, `@workspace/finance`, or other packages
  that don't exist in this repo.
- Implicit Jest globals.
- Unit tests that require live databases, queues, Redis, email, or payment providers.
- Root-only validation (`pnpm test`) as the normal development workflow.

---

## Troubleshooting

### Jest cannot resolve `@workspace/*`

Add the package to `moduleNameMapper` in the package's `jest.config.ts`, pointing at the actual
dependency's `src/index.ts`.

### TypeScript cannot resolve local test aliases

Prefer relative imports, or add matching `paths` entries to the package's `tsconfig`. Don't rely on
Jest-only aliases for files that TypeScript also checks.

### Tests are slow or flaky

Check for real infrastructure calls, timers not properly restored, missing `await`, and shared
mutable fixtures.
