/**
 * Hand-authored line-art for the onboarding steps. Geometric, token-driven
 * (`currentColor` for strokes on a `text-primary` wrapper; fills use theme
 * surface tokens) so they read the same in light and dark. Deliberately
 * simple — no illustration library in this repo.
 */

const wrap = 'mx-auto w-full max-w-[220px] text-primary';

export function DeskIllustration() {
  return (
    <svg className={wrap} viewBox="0 0 220 150" fill="none" role="img" aria-label="A trading desk">
      <rect x="24" y="20" width="120" height="72" rx="6" className="fill-surface-2/60" stroke="currentColor" strokeWidth="2" />
      <path d="M36 78l20-26 16 14 22-34 20 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="56" cy="52" r="3" fill="currentColor" />
      <circle cx="94" cy="32" r="3" fill="currentColor" />
      <rect x="60" y="100" width="48" height="6" rx="3" className="fill-surface-2" />
      <rect x="150" y="44" width="46" height="48" rx="6" className="fill-surface-2/60" stroke="currentColor" strokeWidth="2" />
      <path d="M158 82v-10M168 82v-20M178 82v-8M188 82v-16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="18" y="118" width="184" height="4" rx="2" className="fill-border" />
    </svg>
  );
}

export function QuestionsIllustration() {
  return (
    <svg className={wrap} viewBox="0 0 220 150" fill="none" role="img" aria-label="A few questions">
      <rect x="34" y="24" width="152" height="102" rx="10" className="fill-surface-2/60" stroke="currentColor" strokeWidth="2" />
      <rect x="50" y="44" width="120" height="10" rx="5" className="fill-surface-2" />
      <rect x="50" y="66" width="88" height="8" rx="4" className="fill-border" />
      <circle cx="158" cy="70" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M154.5 68a3.5 3.5 0 116 2.5c-1.2 1-2.5 1.6-2.5 3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="158" cy="80" r="1.4" fill="currentColor" />
      <rect x="50" y="92" width="120" height="8" rx="4" className="fill-border" />
      <rect x="50" y="108" width="70" height="8" rx="4" className="fill-border" />
    </svg>
  );
}

export function ProgrammeIllustration() {
  return (
    <svg className={wrap} viewBox="0 0 220 150" fill="none" role="img" aria-label="Your programme">
      <path d="M40 40h140M40 40v72a6 6 0 006 6h128a6 6 0 006-6V40" stroke="currentColor" strokeWidth="2" />
      <path d="M52 40V30a6 6 0 016-6h104a6 6 0 016 6v10" stroke="currentColor" strokeWidth="2" />
      <rect x="58" y="58" width="46" height="34" rx="5" className="fill-surface-2/60" stroke="currentColor" strokeWidth="2" />
      <path d="M116 62h46M116 74h38M116 86h46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M70 76l7 7 12-14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TradingViewIllustration() {
  return (
    <svg className={wrap} viewBox="0 0 220 150" fill="none" role="img" aria-label="Link your TradingView account">
      <rect x="30" y="30" width="86" height="60" rx="8" className="fill-surface-2/60" stroke="currentColor" strokeWidth="2" />
      <path d="M40 78l14-16 10 8 14-22 14 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="128" y="46" width="62" height="62" rx="10" className="fill-surface-2/60" stroke="currentColor" strokeWidth="2" />
      <path d="M150 77l7 7 15-16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M112 66h20M120 58l-8 8 8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="73" cy="112" r="4" fill="currentColor" />
      <circle cx="159" cy="120" r="4" fill="currentColor" />
      <path d="M73 112h86" stroke="currentColor" strokeWidth="2" strokeDasharray="3 5" />
    </svg>
  );
}
