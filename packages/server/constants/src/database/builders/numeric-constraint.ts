import { CheckConstraintSpec } from '../constraint.types';

export interface NumericConstraintInput {
  schema: string;
  table: string;
  column: string;
  min?: number;
  max?: number;
  name?: string;
}

export function numericConstraint(
  input: NumericConstraintInput
): CheckConstraintSpec {
  return {
    schema: input.schema,
    table: input.table,
    column: input.column,
    type: 'number',
    minLength: input.min,
    maxLength: input.max,
    name: input.name,
  };
}
