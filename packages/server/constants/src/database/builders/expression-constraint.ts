import { CheckConstraintSpec } from '../constraint.types';

export interface ExpressionConstraintInput {
  schema: string;
  table: string;
  expression: string;
  name: string;
}

export function expressionConstraint(
  input: ExpressionConstraintInput
): CheckConstraintSpec {
  return {
    schema: input.schema,
    table: input.table,
    expression: input.expression,
    name: input.name,
  };
}
