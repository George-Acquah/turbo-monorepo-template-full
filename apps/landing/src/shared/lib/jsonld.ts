import { env } from '@/shared/config/env';
import { SITE, isConfigured } from '@/shared/config/site';

type JsonLd = Record<string, unknown>;

/** Organization + WebSite graph for the home page's `<script type="application/ld+json">`. */
export function siteGraph(): JsonLd {
  const name = isConfigured(SITE.name) ? SITE.name : 'Website';
  const sameAs = SITE.meta.sameAs.filter(isConfigured);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${env.siteUrl}/#organization`,
        name,
        url: env.siteUrl,
        ...(sameAs.length ? { sameAs } : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${env.siteUrl}/#website`,
        name,
        url: env.siteUrl,
        publisher: { '@id': `${env.siteUrl}/#organization` },
        ...(isConfigured(SITE.description) ? { description: SITE.description } : {}),
      },
    ],
  };
}
