/**
 * Event schema version numbers.
 *
 * Numeric to match `WorkspaceEvent.schemaVersion: number` and the outbox
 * `event_version Int @default(1)` column. Bump when a payload shape changes in
 * a breaking way (payloads are otherwise additive-only).
 */
export const EventSchemaVersion = {
  V1: 1,
  V2: 2,
} as const;

export type EventSchemaVersion = (typeof EventSchemaVersion)[keyof typeof EventSchemaVersion];
