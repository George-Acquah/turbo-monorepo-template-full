/**
 * Site configuration — a single frozen object of `[PLACEHOLDER]` tokens.
 *
 * Fill these in for your product. `isConfigured(value)` returns false for any
 * value still in `[BRACKET]` form, so UI can hide a link / skip a meta tag
 * rather than render a placeholder.
 */
export const SITE = Object.freeze({
  name: '[PRODUCT NAME]',
  /** One short line under the logo / in the hero eyebrow. */
  tagline: '[SHORT TAGLINE]',
  /** One sentence — used as the default meta description. */
  description: '[ONE-SENTENCE PRODUCT DESCRIPTION]',

  nav: [
    { label: 'Features', href: '/#features' },
    { label: 'Terms', href: '/terms' },
  ],

  /** Primary call to action, reused by the hero and the closing CTA. */
  cta: {
    label: 'Get started',
    href: '[APP SIGN-UP URL]',
  },

  social: {
    x: '[X URL]',
    github: '[GITHUB URL]',
    linkedin: '[LINKEDIN URL]',
  },

  meta: {
    /** `%s | <siteName>` — the per-page title template. */
    titleTemplate: '%s | [PRODUCT NAME]',
    /** The home page's absolute title. */
    defaultTitle: '[PRODUCT NAME] — [TAGLINE]',
    twitterHandle: '[@handle]',
    /** For the Organization JSON-LD `sameAs`. */
    sameAs: ['[X URL]', '[GITHUB URL]', '[LINKEDIN URL]'],
  },

  /** The three feature cards on the home page. */
  features: [
    { title: '[Feature one]', body: '[What it does and why it matters, in one or two lines.]' },
    { title: '[Feature two]', body: '[What it does and why it matters, in one or two lines.]' },
    { title: '[Feature three]', body: '[What it does and why it matters, in one or two lines.]' },
  ],
} as const);

/** True when a config value has actually been filled in (not a `[PLACEHOLDER]`). */
export function isConfigured(value: string | undefined | null): value is string {
  return Boolean(value) && !/^\[.*\]$/.test(value!.trim());
}
