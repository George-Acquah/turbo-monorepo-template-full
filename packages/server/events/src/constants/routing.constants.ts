import {
  NotificationEvents,
  AuthEvents,
  AuditEvents,
  PaymentEvents,
  SearchEvents,
  QueueNames,
} from '@repo/constants';

const AUTH_ANALYTICS_FANOUT_EVENTS = new Set<string>([AuthEvents.USER_CREATED]);

const SEARCH_ANALYTICS_FANOUT_EVENTS = new Set<string>([
  SearchEvents.SEARCH_QUERY_EXECUTED,
  SearchEvents.SEARCH_CLICKED,
]);

export const EVENT_ROUTE_MAP: Record<string, string[]> = {
  // Wildcards first (fallbacks)
  'notifications.*': [QueueNames.NOTIFICATION_EVENTS],
  'notification.*': [QueueNames.NOTIFICATION_EVENTS],
  'email.*': [QueueNames.NOTIFICATION_EVENTS],
  'users.*': [QueueNames.USER_EVENTS],

  // Exact event routes (override wildcards if same key)
  ...Object.values(NotificationEvents).reduce<Record<string, string[]>>((acc, ev) => {
    acc[ev] = [QueueNames.NOTIFICATION_EVENTS];
    return acc;
  }, {}),

  ...Object.values(AuthEvents).reduce<Record<string, string[]>>((acc, ev) => {
    acc[ev] = AUTH_ANALYTICS_FANOUT_EVENTS.has(ev)
      ? [QueueNames.USER_EVENTS]
      : [QueueNames.USER_EVENTS];
    return acc;
  }, {}),

  ...Object.values(AuditEvents).reduce<Record<string, string[]>>((acc, ev) => {
    acc[ev] = [QueueNames.AUDIT_EVENTS];
    return acc;
  }, {}),

  ...Object.values(PaymentEvents).reduce<Record<string, string[]>>((acc, ev) => {
    acc[ev] = [QueueNames.PAYMENT_EVENTS];
    return acc;
  }, {}),

  ...Object.values(SearchEvents).reduce<Record<string, string[]>>((acc, ev) => {
    acc[ev] = SEARCH_ANALYTICS_FANOUT_EVENTS.has(ev)
      ? [QueueNames.SEARCH_INDEXING]
      : [QueueNames.SEARCH_INDEXING];
    return acc;
  }, {}),
};
