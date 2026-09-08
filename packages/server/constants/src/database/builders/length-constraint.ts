import { CheckConstraintSpec } from '../constraint.types';

export interface LengthConstraintInput {
  schema: string;
  table: string;
  column: string;
  min?: number;
  max?: number;
  name?: string;
}

export function lengthConstraint(
  input: LengthConstraintInput
): CheckConstraintSpec {
  return {
    schema: input.schema,
    table: input.table,
    column: input.column,
    type: 'string',
    minLength: input.min,
    maxLength: input.max,
    name: input.name,
  };
}
