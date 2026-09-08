// packages/server/events/src/mesh/transport.adapter.ts
import { DomainEventEnvelope } from '@workspace/queue';
import { CompiledRoute } from '@workspace/types';

export interface DispatchTarget {
  queueName: string;
  route: CompiledRoute;
}

export interface TransportAdapter {
  dispatch(target: DispatchTarget, event: DomainEventEnvelope<unknown>): Promise<void>;
  dispatchMany(targets: DispatchTarget[], event: DomainEventEnvelope<unknown>): Promise<void>;
}
