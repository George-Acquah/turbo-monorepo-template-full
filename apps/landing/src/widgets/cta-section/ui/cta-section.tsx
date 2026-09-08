import { Container } from '@/shared/ui/container';
import { ButtonLink } from '@/shared/ui/button';
import { SITE, isConfigured } from '@/shared/config/site';

export function CtaSection() {
  if (!isConfigured(SITE.cta.href)) return null;

  return (
    <section className="border-t border-[--color-border] py-20">
      <Container className="flex flex-col items-center rounded-[--radius-lg] bg-[--color-surface] px-6 py-14 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Ready when you are</h2>
        <p className="mt-3 max-w-md text-[--color-muted]">
          {isConfigured(SITE.description) ? SITE.description : 'Replace this from site.ts.'}
        </p>
        <ButtonLink href={SITE.cta.href} className="mt-7">
          {SITE.cta.label}
        </ButtonLink>
      </Container>
    </section>
  );
}
