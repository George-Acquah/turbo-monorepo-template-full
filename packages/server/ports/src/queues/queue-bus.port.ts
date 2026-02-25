export type EnqueueJob<T> = {
  name: string;
  data: T;
  opts?: unknown;
};

export abstract class QueueBusPort {
  abstract enqueue<T>(
    queueName: string,
    jobName: string,
    payload: T,
    opts?: unknown,
  ): Promise<string>;

  abstract enqueueMany<T>(queueName: string, jobs: Array<EnqueueJob<T>>): Promise<string[]>;

  abstract enqueuePartitioned<T>(
    baseQueueName: string,
    partitionKey: string,
    jobName: string,
    payload: T,
    opts?: unknown,
  ): Promise<string>;
}

export const QUEUE_BUS_TOKEN = Symbol('QUEUE_BUS_TOKEN');
