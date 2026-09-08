import Link from 'next/link';
import { Container } from '@/shared/ui/container';
import { SITE, isConfigured } from '@/shared/config/site';

const SOCIAL_LABELS: Record<keyof typeof SITE.social, string> = {
  x: 'X',
  github: 'GitHub',
  linkedin: 'LinkedIn',
};

export function SiteFooter() {
  const socials = (Object.keys(SITE.social) as (keyof typeof SITE.social)[]).filter((k) =>
    isConfigured(SITE.social[k]),
  );

  return (
    <footer className="border-t border-[--color-border] py-10 text-sm text-[--color-muted]">
      <Container className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {isConfigured(SITE.name) ? SITE.name : 'Your product'}.
        </p>

        <nav className="flex flex-wrap gap-4">
          <Link href="/terms" className="hover:text-[--color-fg]">
            Terms
          </Link>
          {socials.map((k) => (
            <a
              key={k}
              href={SITE.social[k]}
              target="_blank"
              rel="noreferrer"
              className="hover:text-[--color-fg]"
            >
              {SOCIAL_LABELS[k]}
            </a>
          ))}
        </nav>
      </Container>
    </footer>
  );
}
