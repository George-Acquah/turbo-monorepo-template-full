import type { Metadata } from 'next';
import { env } from '@/shared/config/env';
import { SITE, isConfigured } from '@/shared/config/site';

/**
 * Base metadata for the root layout. Per-page metadata should spread a small
 * override on top — see each `views` slice's page component.
 */
export const baseMetadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: SITE.meta.defaultTitle,
    template: SITE.meta.titleTemplate,
  },
  description: SITE.description,
  applicationName: isConfigured(SITE.name) ? SITE.name : undefined,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: env.siteUrl,
    siteName: isConfigured(SITE.name) ? SITE.name : undefined,
    title: SITE.meta.defaultTitle,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.meta.defaultTitle,
    description: SITE.description,
    ...(isConfigured(SITE.meta.twitterHandle) ? { site: SITE.meta.twitterHandle } : {}),
  },
  robots: { index: true, follow: true },
};

/** Build a per-page `Metadata` object from a title + description. */
export function pageMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description: description ?? SITE.description,
    openGraph: { title, description: description ?? SITE.description },
    twitter: { title, description: description ?? SITE.description },
  };
}
