# @workspace/members

Authenticated dashboard app — dashboard, programmes/courses/events, enrolments, billing,
access, community, and account settings. Next.js App Router, **strict Feature-Sliced Design**
(see the `feature-sliced-design` skill), composing `packages/client/*` as the shared layer.

## Structure

```
src/
├── app/        routing only — each route re-exports its views/ slice
├── views/      per-route compositions (server components) — this repo's name for
│               FSD's "pages" layer (not to be confused with Next's app/ routing)
├── widgets/    reusable composed blocks (shell, sidebar, tables, panels)
├── features/   one user action each (login, update-account, register-for-event, ...)
├── entities/   domain nouns narrowing @workspace/client-types schemas
└── shared/     app-local glue ONLY (configured api clients, env, nav, query config)
```

Everything reusable across apps lives in `packages/client/*`, not `shared/`.

## Data layer

Hybrid: RSC reads via `@/shared/api/server`, mutations via server actions, TanStack Query
only inside interactive client islands (tables, realtime). Keep `'use client'` boundaries
small — pages/widgets are server components; only interactive leaves are client.

## Commands

- `pnpm --filter @workspace/members dev`
- `pnpm --filter @workspace/members check-types`
- `pnpm --filter @workspace/members lint`

## Status

See `CLAUDE.md`'s Status section for what's real vs. stub as of the current commit.

## Backend gaps

Capabilities this app's routes either can't reach yet, or can only reach through a documented
workaround. Update this list as gaps close — don't let it go stale the way the old "structural
skeleton" framing did.

**No backend surface at all — routes stay stubbed:**

- **Notification *history* still has no HTTP surface — but preferences now do.** Correction to
  what this section said before: `modules/notifications` wasn't fully worker-only, it was two
  separate gaps that looked like one. `NotificationPreference`/`CommunicationPreferenceOverride`
  had real persistence and were already enforced at send time
  (`NotificationDispatchService`) — they just had no controller wired into `apps/api`. That's
  fixed: `GET/PATCH /v1/notification-preferences` is real (see `/account/preferences`'s
  "Notifications" panel), and `GET/PATCH /v1/preferences` (theme/language/timezone) shipped
  alongside it, replacing the old cookie-only theme with an account-level source of truth. What's
  *still* genuinely worker-only is the notification feed itself — no controller reads back past
  notifications or in-app delivery records, so `/notifications` and the topbar bell's
  `unreadCount = 0` correctly stay stubbed.
- **`indicators` — CLOSED.** `IndicatorsModule` is wired into `apps/api` now, so `/indicators`
  is a real page: `GET /v1/indicators/me` + `POST/PUT/DELETE /v1/indicators/me/tv-link`
  (`entities/indicator`, `features/link-tradingview` + `unlink-tradingview`,
  `widgets/indicator-access-panel`), and it's in `memberNav`. `/bots` (a different module,
  still unrouted) stays stubbed.
- **No saved payment methods surface.** Card details are captured server-side (Paystack
  authorization reuse for subscription auto-renewal) but never exposed to the member to view or
  manage.
- **No referral system, no wishlist/favorites.** Neither has any backend data model at all.
- **`upload-file`, `initiate-payment`, `verify-payment` stay stubbed on purpose.** Real backend
  routes exist for all three, but no current page has a concrete need for them — the enrolment
  flow already covers the primary Paystack path end-to-end via `create-enrolment`. Building UI for
  a capability with no consuming page would be speculative scope.
- **`grant-consent`/`withdraw-consent` stay stubbed — no established consent-versioning
  convention exists yet.** `POST /consents` / `POST /consents/withdraw` are real, but their
  `RecordConsentDto` requires a `version: string` alongside `kind`, and nothing in this codebase
  (including registration) calls this endpoint today or defines what a "current" version string
  should be for any of the four `kind`s (`TERMS_OF_SERVICE`, `PRIVACY_POLICY`, `MARKETING_EMAIL`,
  `RISK_DISCLAIMER`). Fabricating one here would produce a legally-meaningless audit record.
  The one real, reachable need — letting a member toggle marketing-email opt-in — is served
  instead by the already-real `PATCH /account`'s `marketingOptIn` field (`AccountForm`'s
  checkbox, and `ConsentsPanel`'s `MarketingConsentToggle`), which doesn't touch this DTO at all.
  Wire `grant-consent`/`withdraw-consent` for real once product defines a version scheme for the
  three formal legal-consent kinds.

**Built, but worth knowing the shape of:**

- **`GET /access/community-link` has no "join URL" field.** `CommunityLinkResponse` is
  `{ platform: "DISCORD", status, inviteCode?, linkedAt? }` — no direct clickable invite link. The
  `/community` and `/access` pages both show `inviteCode` as plain text (while `status ===
  'INVITED'`) rather than constructing a `discord.gg/...` URL, since no such construction is
  established anywhere in the codebase and guessing one risks generating a broken or wrong link.
- **`GET /courses` (no `programmeId`) returns "the caller's own courses,"** with no ordering or
  "most recently active" signal. The dashboard's "Continue learning" panel picks `courses[0]` as
  its best-effort "active course" — correct today (members are enrolled in at most one course in
  practice) but worth revisiting if that assumption stops holding.
