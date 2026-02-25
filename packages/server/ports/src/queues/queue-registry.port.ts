export abstract class QueueRegistryPort {
  abstract getOrCreateQueue(queueName: string): Promise<unknown>;
  abstract getOrCreatePartitionedQueue(
    baseQueueName: string,
    partitionKey: string,
  ): Promise<unknown>;
  abstract closeAll(): Promise<void>;
}
export const QUEUE_REGISTRY_TOKEN = Symbol('QUEUE_REGISTRY_TOKEN');
