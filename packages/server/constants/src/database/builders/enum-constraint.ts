import { CheckConstraintSpec } from '../constraint.types';

export interface EnumConstraintInput<TValue extends string> {
  schema: string;
  table: string;
  column: string;
  values: readonly TValue[] | Record<string, TValue>;
  name?: string;
}

export function enumConstraint<TValue extends string>(
  input: EnumConstraintInput<TValue>
): CheckConstraintSpec<TValue> {
  const values = Array.isArray(input.values)
    ? input.values
    : (Object.values(input.values) as readonly TValue[]);

  return {
    schema: input.schema,
    table: input.table,
    column: input.column,
    values,
    name: input.name,
  };
}
