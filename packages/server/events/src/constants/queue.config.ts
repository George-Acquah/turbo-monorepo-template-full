import { EventsQueueDefinitions } from '@repo/constants';
import { QueueConfig } from '@repo/queue';

export const eventProducerQueueConfigs: QueueConfig[] = [
  {
    name: EventsQueueDefinitions.DOMAIN_EVENTS.name,
    defaultJobOptions: EventsQueueDefinitions.DOMAIN_EVENTS.options,
  },
];

export const eventWorkerQueueConfigs: QueueConfig[] = Object.values(EventsQueueDefinitions).map(
  (definition) => ({
    name: definition.name,
    defaultJobOptions: definition.options,
  }),
);
