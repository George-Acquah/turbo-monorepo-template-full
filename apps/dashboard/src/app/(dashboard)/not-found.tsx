import { Compass } from 'lucide-react';
import { buttonVariants, cn } from '@workspace/client-ui-primitives';
import { Link } from '@/shared/lib/transition-link';
import { Panel } from '@/widgets/panel';
import { EmptyState } from '@/widgets/empty-state';

/**
 * 404 inside the dashboard shell — a `notFound()` from a detail route
 * (`/courses/[slug]`, `/events/[slug]`, …) or a mistyped in-app link.
 */
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Panel className="max-w-md">
        <EmptyState
          icon={Compass}
          title="Not found"
          description="We couldn't find that page. It may have moved, or you may not have access to it."
          action={
            <Link href="/" className={cn(buttonVariants({ size: 'sm' }))}>
              Back to your desk
            </Link>
          }
        />
      </Panel>
    </div>
  );
}
