import { QueueNames } from '../queue-names';
import { DefaultJobOptions, RateLimiterConfigs } from '../queue-options';

export const SearchQueueDefinitions = {
  SEARCH_INDEXING: {
    name: QueueNames.SEARCH_INDEXING,
    options: DefaultJobOptions.BACKGROUND,
    limiter: RateLimiterConfigs.SEARCH,
  },
} as const;
