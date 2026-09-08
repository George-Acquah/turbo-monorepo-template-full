# Focused Checks

Run the smallest useful checks for the current work: $ARGUMENTS

Rules:

- Do not run repo-wide `pnpm build`, `pnpm check-types`, `pnpm lint`, `pnpm test`, or `pnpm -r`.
- Inspect `git diff --name-only` and map changed files to workspace packages.
- Prefer package-local commands such as:
  - `pnpm --filter @workspace/landing check-types`
  - `pnpm --filter @workspace/landing lint`
  - `pnpm --filter @workspace/<package-name> check-types`
  - `pnpm --filter @workspace/<package-name> build`
  - `pnpm --filter @workspace/<package-name> lint`
- If no focused test command exists, report that instead of inventing a repo-wide run.
- Stop and explain if a check would require migration/reset/deploy or significant RAM.
