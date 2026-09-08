import { Container } from '@/shared/ui/container';
import { ButtonLink } from '@/shared/ui/button';
import { SITE, isConfigured } from '@/shared/config/site';

export function Hero() {
  return (
    <section className="py-20 sm:py-28">
      <Container className="flex flex-col items-center text-center">
        {isConfigured(SITE.tagline) && (
          <p className="mb-4 rounded-full border border-[--color-border] bg-[--color-surface] px-3 py-1 text-xs font-medium text-[--color-muted]">
            {SITE.tagline}
          </p>
        )}

        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          {isConfigured(SITE.meta.defaultTitle)
            ? SITE.meta.defaultTitle
            : 'A headline that says what this is'}
        </h1>

        <p className="mt-5 max-w-xl text-pretty text-lg text-[--color-muted]">
          {isConfigured(SITE.description)
            ? SITE.description
            : 'One sentence explaining the value. Replace this from src/shared/config/site.ts.'}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isConfigured(SITE.cta.href) && (
            <ButtonLink href={SITE.cta.href}>{SITE.cta.label}</ButtonLink>
          )}
          <ButtonLink href="/#features" variant="ghost">
            Learn more
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
