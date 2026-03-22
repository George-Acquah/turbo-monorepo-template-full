import { Prisma } from '../../generated/prisma/client';

export function toInputJson(
  value?: Record<string, unknown> | null,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  return value as Prisma.InputJsonValue;
}

export function toRecord(
  value: Prisma.JsonValue | null | undefined,
): Record<string, unknown> | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function toNumber(
  value:
    | {
        toNumber(): number;
      }
    | number
    | null
    | undefined,
): number | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  return typeof value === 'number' ? value : value.toNumber();
}
