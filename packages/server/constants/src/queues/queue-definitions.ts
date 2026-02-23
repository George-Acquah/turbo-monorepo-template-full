import { AuditQueueDefinitions } from './definitions/queue-definitions.audit';
import { UsersQueueDefinitions } from './definitions/queue-definitions.users';
import { EventsQueueDefinitions } from './definitions/queue-definitions.events';
import { NotificationsQueueDefinitions } from './definitions/queue-definitions.notifications';
import { PaymentsQueueDefinitions } from './definitions/queue-definitions.payments';
import { SearchQueueDefinitions } from './definitions/queue-definitions.search';

/**
 * Aggregated queue definitions for compatibility and convenience.
 *
 * Feature modules should prefer their own definition objects
 * (e.g. EventsQueueDefinitions) instead of this aggregate.
 */
export const QueueDefinitions = {
  ...EventsQueueDefinitions,
  ...UsersQueueDefinitions,
  ...AuditQueueDefinitions,
  ...NotificationsQueueDefinitions,
  ...SearchQueueDefinitions,
  ...PaymentsQueueDefinitions,
} as const;
