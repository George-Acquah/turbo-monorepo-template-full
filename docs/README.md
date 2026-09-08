# Docs

- [`architecture/layers.md`](architecture/layers.md) — how `apps/`, `modules/`,
  `packages/server/*` and `packages/client/*` fit together.
- [`client-foundation/`](client-foundation/README.md) — rationale and roadmap for the
  `packages/client/*` layered UI + typed-API foundation, plus its ADRs.

The bounded-context rules live in [`../modules/CLAUDE.md`](../modules/CLAUDE.md); the shared
server building blocks in [`../packages/server/CLAUDE.md`](../packages/server/CLAUDE.md); the
client foundation conventions in [`../packages/client/CLAUDE.md`](../packages/client/CLAUDE.md).

Per-context documentation sets (one folder per domain, each with a `README.md` +
`architecture/` / `decisions/` / `design/` / `runbooks/`) are a convention worth keeping — add
`docs/<your-context>/` as you build.
