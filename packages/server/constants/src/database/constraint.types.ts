export interface CheckConstraintSpec<
  TValue extends string = string,
> {
  schema: string;
  table: string;
  /**
   * Required unless using a raw SQL expression.
   */
  column?: string;
  /**
   * Enum/value constraint.
   */
  values?: readonly TValue[];
  /**
   * Numeric vs string comparisons.
   */
  type?: 'string' | 'number';
  /**
   * String length or numeric minimum.
   */
  minLength?: number;
  /**
   * String length or numeric maximum.
   */
  maxLength?: number;
  /**
   * Raw SQL expression.
   * Overrides values/min/max.
   */
  expression?: string;
  /**
   * Override generated constraint name.
   */
  name?: string;
}
