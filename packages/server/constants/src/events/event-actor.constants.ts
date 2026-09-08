export const EventActorType = {
  USER: 'user',
  SYSTEM: 'system',
  WORKER: 'worker',
  API: 'api',
} as const;

export type EventActorType = (typeof EventActorType)[keyof typeof EventActorType];
