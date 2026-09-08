# Review

Review the current changes or requested target: $ARGUMENTS

Focus on:

- Bugs, regressions, security issues, payment/auth/paywall risks, and missing tests.
- Ghana/business-context mismatches, stale UK assumptions, or unsupported trading/legal claims.
- Frontend layout/accessibility issues when UI is touched.
- Boundary violations between apps, packages, ports, adapters, and constants.

Process:

1. Read the relevant `CLAUDE.md` files.
2. Inspect `git status --short` and the focused diff.
3. Lead with findings ordered by severity and include file/line references.
4. Keep summary secondary and concise.
5. Do not edit files unless the user explicitly asks for fixes.
