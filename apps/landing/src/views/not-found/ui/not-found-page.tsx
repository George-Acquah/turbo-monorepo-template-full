import { Container } from '@/shared/ui/container';
import { ButtonLink } from '@/shared/ui/button';

export function NotFoundPage() {
  return (
    <Container
      as="main"
      className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-center"
    >
      <p className="font-mono text-sm text-[--color-muted]">404</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-[--color-muted]">That page doesn&apos;t exist or has moved.</p>
      <ButtonLink href="/" className="mt-7">
        Back home
      </ButtonLink>
    </Container>
  );
}
