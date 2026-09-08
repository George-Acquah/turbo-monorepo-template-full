import { ArrowRight, Bell, KeyRound, Rocket, Users } from 'lucide-react';
import { buttonVariants, cn } from '@workspace/client-ui-primitives';
import { Link } from '@/shared/lib/transition-link';
import { PageHeader } from '@/widgets/page-header';
import { StatTile } from '@/widgets/stat-tile';
import { Panel } from '@/widgets/panel';
import { EmptyState } from '@/widgets/empty-state';
import { Reveal } from '@/shared/lib/motion';

/**
 * Dashboard home — a deliberately generic starting point. Static content only,
 * so it paints without any API call.
 *
 * TEMPLATE NOTE: replace the tiles and panels with your product's real
 * surfaces. Stream data-heavy areas through their own `<Suspense>` boundary
 * and read via `getServerApiClient()` (see `src/shared/api`).
 */
export function DashboardPage() {
  return (
    <Reveal className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your starting point. Wire this screen to your product's data."
        actions={
          <Link href="/account" className={cn(buttonVariants({ size: 'sm' }))}>
            <ArrowRight className="size-4" />
            Account
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile label="Notifications" value={0} icon={Bell} href="/notifications" hint="Nothing yet" />
        <StatTile label="Access grants" value={0} icon={KeyRound} hint="Wire to your API" />
        <StatTile label="Team members" value={1} icon={Users} hint="Just you for now" />
      </div>

      <Panel title="Getting started" description="This app is a template shell">
        <EmptyState
          icon={Rocket}
          title="Build your first screen"
          description="Add a slice under src/views, a route under src/app, and a nav item in src/shared/config/navigation.ts."
          action={
            <Link href="/account" className={cn(buttonVariants({ size: 'sm' }))}>
              Go to account
            </Link>
          }
        />
      </Panel>
    </Reveal>
  );
}
