import { Inject, Injectable } from '@nestjs/common';
import {
  AUDIT_COMMAND_PORT,
  WorkspaceEventHandlerPort,
  type AuditCommandPort,
} from '@workspace/ports';
import type { EventType, StrictlyTypedWorkspaceEvent } from '@workspace/types';

/**
 * REACTS to every event in the catalog — the one legitimate wildcard
 * consumer (see `@workspace/types` `contracts/subscription.ts`: "Global
 * catch: '*' (use sparingly — audit is the canonical use case)"). It reads
 * each event purely as a fact from the shared envelope; it has no idea which
 * module produced it and imports nothing from any producing module.
 *
 * Records the raw envelope directly rather than forcing `eventType`/
 * `aggregateType` into the closed `AuditActionType`/`AuditEntityType`
 * vocabularies — those enums remain available for a producing use-case doing
 * a deliberate inline audit write (e.g. an admin manual action with a
 * `reason`), but a generic catch-all consumer has no per-event knowledge to
 * pick a specific action/entity bucket, and the underlying Prisma columns
 * are unconstrained free text anyway (see audit.types.ts).
 *
 * Failures are NOT swallowed here — an audit write failing should retry via
 * the queue processor's normal idempotency/retry mechanism (compliance data,
 * not a best-effort side channel), unlike notifications' per-channel
 * isolation.
 */
@Injectable()
export class RecordAuditLogHandler extends WorkspaceEventHandlerPort<EventType> {
  constructor(@Inject(AUDIT_COMMAND_PORT) private readonly auditCommand: AuditCommandPort) {
    super();
  }

  supports(_eventType: EventType): boolean {
    return true;
  }

  async handle(event: StrictlyTypedWorkspaceEvent<EventType>): Promise<void> {
    await this.auditCommand.createAuditLog({
      entityType: event.aggregateType,
      entityId: event.aggregateId,
      action: event.eventType,
      actorId: event.actor?.userId,
      actorType: event.actor?.type,
      newValues: (event.payload as unknown as Record<string, unknown> | undefined) ?? undefined,
      ipAddress: event.actor?.ipAddress,
      userAgent: event.actor?.userAgent,
      requestId: event.trace?.requestId,
      correlationId: event.trace?.correlationId,
      description: `${event.eventType} recorded`,
      metadata: {
        eventId: event.eventId,
        schemaVersion: event.schemaVersion,
        causationId: event.causationId,
        retryCount: event.retryCount,
      },
      occurredAt: new Date(event.occurredAt),
    });
  }
}
