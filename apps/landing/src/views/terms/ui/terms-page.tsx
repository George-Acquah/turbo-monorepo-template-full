import type { Metadata } from 'next';
import { Container } from '@/shared/ui/container';
import { pageMetadata } from '@/shared/lib/metadata';

export const metadata: Metadata = pageMetadata('Terms', 'Terms of service.');

/**
 * A deliberately minimal legal-page skeleton. Replace the sections with your
 * real, reviewed terms — do not ship this placeholder text.
 */
const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Placeholder',
    body: 'This page is a template skeleton. Replace it with terms drafted and reviewed for your product before going live.',
  },
  {
    heading: '2. Placeholder',
    body: 'Add the clauses your product needs — acceptable use, accounts, payment, liability, termination, governing law.',
  },
];

export function TermsPage() {
  return (
    <Container as="main" className="prose-neutral py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Terms</h1>
      <p className="mt-2 text-sm text-[--color-muted]">
        Last updated: [DATE] — this is placeholder content.
      </p>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg font-medium">{section.heading}</h2>
            <p className="mt-2 text-sm leading-6 text-[--color-muted]">{section.body}</p>
          </section>
        ))}
      </div>
    </Container>
  );
}
