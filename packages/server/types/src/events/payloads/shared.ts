// ─────────────────────────────────────────────────────────────────────────────
// Shared payload sub-shapes
//
// Payloads are immutable facts captured at the moment of the transition — all
// fields are `readonly`. They carry point-in-time values (amountMinor,
// pricePlanId, programmeSlug, ...), never just IDs a consumer would re-read
// later and get a different answer from. They MUST NOT duplicate what the
// WorkspaceEvent envelope already carries (eventId, aggregateType/Id,
// occurredAt, actor, trace.correlationId, schemaVersion, causationId).
//
// PII rule: permitted = ids, enums, amountMinor+currency, ISO timestamps,
// booleans, and `email` only where delivery requires it. Forbidden =
// phone/name, joinUrl, any token, any *Encrypted column, raw webhook/attempt
// payloads, card data.
// ─────────────────────────────────────────────────────────────────────────────

/** All monetary values are minor units (pesewas) + ISO-4217 currency (GHS). */
export interface Money {
  readonly amountMinor: number;
  readonly currency: string;
}

/** Generic "what changed" shape for `*.updated` events. */
export interface ChangeSet {
  readonly changes: Readonly<Record<string, unknown>>;
}
