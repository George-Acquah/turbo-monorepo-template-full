/**
 * Onboarding sits outside the dashboard shell — no sidebar, no topbar. The
 * `(dashboard)` layout redirects first-run members into `/welcome`; this
 * group keeps that flow full-bleed. Route groups don't affect URLs, so the
 * route is `/welcome`.
 */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
