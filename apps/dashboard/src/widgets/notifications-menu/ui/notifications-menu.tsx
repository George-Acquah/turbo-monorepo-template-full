'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { Button, Skeleton } from '@workspace/client-ui-primitives';
import { unwrap } from '@workspace/client-api';
import type { components, RealtimeEvent, RealtimeNotificationPayload } from '@workspace/client-types';
import { ResponsiveMenu } from '@/widgets/responsive-menu';
import { apiClient } from '@/shared/api/client';
import { useRealtimeEvent } from '@/app/providers/realtime-provider';
// Import directly from the leaf module, not the `@/shared/lib` barrel — that
// barrel also re-exports `./cookies` (server-only, imports `next/headers`),
// so importing anything from it in a client component drags the whole
// server-only module graph into the client bundle and fails the build.
import { formatRelativeTime } from '@/shared/lib/format';

type NotificationItem = components['schemas']['NotificationResponse'];
type NotificationRealtimeEvent = RealtimeEvent<RealtimeNotificationPayload>;

function isNotificationPayload(value: unknown): value is RealtimeNotificationPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'title' in value &&
    'body' in value
  );
}

function isNotificationEvent(
  event: RealtimeEvent<unknown> | null,
): event is NotificationRealtimeEvent {
  return Boolean(
    event &&
      event.aggregateType === 'NOTIFICATION' &&
      event.aggregateId &&
      isNotificationPayload(event.payload),
  );
}

/**
 * Notification bell — dropdown on desktop, bottom sheet on mobile. Fetches an
 * initial page + unread count on mount, then stays live via the SSE stream:
 * a matching frame (`aggregateType === 'NOTIFICATION'`) increments the badge
 * and prepends the item locally, no refetch needed — the frame already
 * carries the id (as `aggregateId`) and the full display payload.
 */
export function NotificationsMenu() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const processedEventIds = useRef(new Set<string>());
  const knownNotificationIds = useRef(new Set<string>());

  const load = useCallback(async () => {
    const [list, count] = await Promise.all([
      unwrap(await apiClient.GET('/api/v1/notifications', { params: { query: { take: 10 } } })),
      unwrap(await apiClient.GET('/api/v1/notifications/unread-count')),
    ]);
    for (const item of list.data.items) {
      knownNotificationIds.current.add(item.id);
    }
    setItems(list.data.items);
    setUnreadCount(count.data.count);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Consume the single shared SSE stream from RealtimeProvider instead of
  // opening a second stream here — SseService caps concurrent streams per user,
  // and opening one in both the provider and this widget hit the cap immediately.
  const realtimeEvent = useRealtimeEvent();
  useEffect(() => {
    if (!isNotificationEvent(realtimeEvent)) return;
    const eventKey = realtimeEvent.eventId || realtimeEvent.aggregateId;
    if (
      processedEventIds.current.has(eventKey) ||
      knownNotificationIds.current.has(realtimeEvent.aggregateId)
    ) {
      return;
    }

    processedEventIds.current.add(eventKey);
    knownNotificationIds.current.add(realtimeEvent.aggregateId);
    setUnreadCount((count) => count + 1);
    setItems((current) => [
      {
        id: realtimeEvent.aggregateId,
        type: realtimeEvent.payload.type,
        title: realtimeEvent.payload.title,
        body: realtimeEvent.payload.body,
        actionUrl: realtimeEvent.payload.actionUrl ?? null,
        icon: null,
        read: false,
        readAt: null,
        archived: false,
        metadata: null,
        createdAt: realtimeEvent.timestamp,
      },
      ...current,
    ]);
  }, [realtimeEvent]);

  const markRead = useCallback(async (item: NotificationItem) => {
    if (item.read) return;
    setItems((current) => current.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
    setUnreadCount((count) => Math.max(0, count - 1));
    await apiClient.PATCH('/api/v1/notifications/{id}/read', { params: { path: { id: item.id } } });
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((current) => current.map((i) => ({ ...i, read: true })));
    setUnreadCount(0);
    await apiClient.PATCH('/api/v1/notifications/read-all');
  }, []);

  return (
    <ResponsiveMenu
      title="Notifications"
      className="w-80"
      trigger={
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          className="relative"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span
              aria-hidden
              className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary"
            />
          )}
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-2 px-3 py-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="px-3 py-8 text-center text-sm text-muted-foreground">
          You&apos;re all caught up.
        </p>
      ) : (
        <div className="flex max-h-80 flex-col overflow-y-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                void markRead(item);
                if (item.actionUrl) router.push(item.actionUrl);
              }}
              className="flex flex-col gap-0.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-sidebar-accent/50"
            >
              <span className="flex items-center gap-2">
                {!item.read && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-primary" />}
                <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
              </span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{item.body}</span>
              <span className="text-[10px] text-muted-foreground/70">
                {formatRelativeTime(item.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </ResponsiveMenu>
  );
}
