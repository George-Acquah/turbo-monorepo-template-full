// packages/server/events/src/mesh/event-partition-context.factory.ts
import { Injectable } from '@nestjs/common';
import { DomainEventEnvelope } from '@workspace/queue';
import { PartitionContext } from '@workspace/types';

@Injectable()
export class EventPartitionContextFactory {
  create(event: DomainEventEnvelope<unknown>): PartitionContext {
    return {
      userId: event.actor?.userId ?? (event.metadata?.userId as string | undefined) ?? undefined,
      key: event.aggregateId ?? undefined,
    };
  }
}
