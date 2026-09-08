'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { Skeleton } from '@workspace/client-ui-primitives';
import type { components } from '@workspace/client-types';
import { EmptyState } from '@/widgets/empty-state';
import { apiClient } from '@/shared/api/client';
// Import directly from the leaf module, not the `@/shared/lib` barrel — that
// barrel also re-exports `./cookies` (server-only, imports `next/headers`),
// so importing anything from it in a client component drags the whole
// server-only module graph into the client bundle and fails the build.
import { formatRelativeTime } from '@/shared/lib/format';

type NotificationItem = components['schemas']['NotificationResponse'];

export function NotificationsList({ initialItems }: { initialItems: NotificationItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const unreadCount = items.filter((item) => !item.read).length;

  const markRead = useCallback(async (item: NotificationItem) => {
    if (item.read) return;
    setItems((current) => current.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
    await apiClient.PATCH('/api/v1/notifications/{id}/read', { params: { path: { id: item.id } } });
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((current) => current.map((i) => ({ ...i, read: true })));
    await apiClient.PATCH('/api/v1/notifications/read-all');
  }, []);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="You're all caught up"
        description="Updates about your programmes and sessions will show up here."
      />
    );
  }

  return (
    <div className="divide-y divide-glass-border">
      {unreadCount > 0 && (
        <div className="flex justify-end px-4 py-2">
          <button
            type="button"
            onClick={() => void markAllRead()}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <CheckCheck className="size-3.5" />
            Mark all read ({unreadCount})
          </button>
        </div>
      )}
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            void markRead(item);
            if (item.actionUrl) router.push(item.actionUrl);
          }}
          className="flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-sidebar-accent/50"
        >
          <span className="flex items-center gap-2">
            {!item.read && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />}
            <span className="text-sm font-medium text-foreground">{item.title}</span>
          </span>
          <span className="text-xs text-muted-foreground">{item.body}</span>
          <span className="text-[10px] text-muted-foreground/70">
            {formatRelativeTime(item.createdAt)}
          </span>
        </button>
      ))}
    </div>
  );
}

export function NotificationsListSkeleton() {
  return (
    <div className="divide-y divide-glass-border">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-4 py-3">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64 max-w-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}
