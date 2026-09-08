import Link from 'next/link';
import { Container } from '@/shared/ui/container';
import { ButtonLink } from '@/shared/ui/button';
import { SITE, isConfigured } from '@/shared/config/site';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[--color-border] bg-[--color-bg]/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">
          {isConfigured(SITE.name) ? SITE.name : 'Your product'}
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-[--color-muted] sm:flex">
          {SITE.nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-[--color-fg]">
              {item.label}
            </Link>
          ))}
        </nav>

        {isConfigured(SITE.cta.href) && (
          <ButtonLink href={SITE.cta.href} size="sm">
            {SITE.cta.label}
          </ButtonLink>
        )}
      </Container>
    </header>
  );
}
