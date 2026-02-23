import { QueueNames } from '../queue-names';
import { DefaultJobOptions } from '../queue-options';

export const UsersQueueDefinitions = {
  USER_EVENTS: {
    name: QueueNames.USER_EVENTS,
    options: DefaultJobOptions.STANDARD,
  },
} as const;
