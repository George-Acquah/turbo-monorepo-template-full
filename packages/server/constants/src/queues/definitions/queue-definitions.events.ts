import { QueueNames } from '../queue-names';
import { DefaultJobOptions } from '../queue-options';

export const EventsQueueDefinitions = {
  DOMAIN_EVENTS: {
    name: QueueNames.DOMAIN_EVENTS,
    options: DefaultJobOptions.STANDARD,
  },
  OUTBOX_PROCESSOR: {
    name: QueueNames.OUTBOX_PROCESSOR,
    options: DefaultJobOptions.STANDARD,
  },
  DEAD_LETTER: {
    name: QueueNames.DEAD_LETTER,
    options: DefaultJobOptions.BACKGROUND,
  },
} as const;
