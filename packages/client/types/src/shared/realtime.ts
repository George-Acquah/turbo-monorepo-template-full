/**
 * SSE frame delivered on `realtime:user:<userId>` and forwarded verbatim by
 * `SseService` as the frame `data` that `client-hooks`'s `useRealtimeStream`
 * consumes.
 *
 * Two producers publish to this channel and they do NOT emit identical shapes:
 *
 * - `DomainEventDispatchService.publishRealtime`
 *   (packages/server/events/src/services/domain-event-dispatch.service.ts)
 *   emits all fields, including `correlationId`.
 * - `NotificationDispatchService`
 *   (modules/notifications/src/application/services/notification-dispatch.service.ts)
 *   emits in-app notification frames **without** `correlationId`, with
 *   `aggregateType: 'NOTIFICATION'` and a bespoke `payload`.
 *
 * Hence `correlationId` is optional as well as nullable — discriminate on
 * `aggregateType === 'NOTIFICATION'` when you need the notification shape.
 *
 * Note also that `publishRealtime` early-returns when the event has no actor
 * userId, so purely system/worker-initiated events (e.g. the subscription
 * renewal scan) never reach a member's stream directly — they only surface if
 * `modules/notifications` turns them into an in-app notification.
 */
export interface RealtimeEvent<T = unknown> {
  eventId: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  correlationId?: string | null;
  payload: T;
  timestamp: string;
}

/** Payload shape used by in-app notification frames (`aggregateType === 'NOTIFICATION'`). */
export interface RealtimeNotificationPayload {
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
}
