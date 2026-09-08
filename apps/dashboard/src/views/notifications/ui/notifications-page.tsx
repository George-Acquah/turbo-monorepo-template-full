import { Suspense } from 'react';
import { unwrap } from '@workspace/client-api';
import { getServerApiClient } from '@/shared/api';
import { PageHeader } from '@/widgets/page-header';
import { Panel } from '@/widgets/panel';
import { NotificationsList, NotificationsListSkeleton } from '@/widgets/notifications-list';
import { Reveal } from '@/shared/lib/motion';

export function NotificationsPage() {
  return (
    <Reveal className="space-y-6">
      <PageHeader title="Notifications" description="Updates about your programmes and sessions." />
      <Suspense fallback={<Panel flush><NotificationsListSkeleton /></Panel>}>
        <NotificationsListSection />
      </Suspense>
    </Reveal>
  );
}

async function NotificationsListSection() {
  const client = await getServerApiClient();
  const { data } = await client.GET('/api/v1/notifications', { params: { query: { take: 30 } } }).then(unwrap);

  return (
    <Panel flush>
      <NotificationsList initialItems={data.items} />
    </Panel>
  );
}
