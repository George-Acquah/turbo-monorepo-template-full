import type { Metadata } from 'next';
import { SITE } from '@/shared/config/site';
import { siteGraph } from '@/shared/lib/jsonld';
import { Hero } from '@/widgets/hero';
import { FeatureGrid } from '@/widgets/feature-grid';
import { CtaSection } from '@/widgets/cta-section';

export const metadata: Metadata = {
  title: { absolute: SITE.meta.defaultTitle },
  alternates: { canonical: '/' },
};

export function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteGraph()) }}
      />
      <Hero />
      <FeatureGrid />
      <CtaSection />
    </>
  );
}
