import { createId, isCuid } from '@paralleldrive/cuid2';
import { IdPrefix } from '@workspace/constants';
import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';
import { createIdentifier } from './id';

const PREFIX_SEPARATOR = '_';

export function generateId(prefix?: IdPrefix): string {
  const id = createId();

  return prefix ? `${prefix}${PREFIX_SEPARATOR}${id}` : id;
}

/**
 * Removes the domain prefix from an ID.
 *
 * inv_xxxxxxxxx -> xxxxxxxxx
 */
export function stripIdPrefix(id: string): string {
  const separator = id.lastIndexOf(PREFIX_SEPARATOR);

  if (separator === -1) {
    return id;
  }

  return id.slice(separator + 1);
}

/**
 * Validates either:
 *
 *  abc123...
 *  inv_abc123...
 *  student_abc123...
 */
export function isValidId(id: unknown): id is string {
  if (typeof id !== 'string') {
    return false;
  }

  return isCuid(stripIdPrefix(id));
}

/**
 * class-validator decorator for a mutation-input id field whose shape we
 * already know: `<prefix>_<cuid2>` (e.g. `rol_2f8x9k3m1a0b7c6d5e4f`). Checks
 * both that it's a real cuid2 AND that it carries the expected prefix —
 * reuses `createIdentifier(prefix).is()` (`./id.ts`) rather than
 * reimplementing the prefix/cuid check here.
 *
 * @example
 * class AssignRoleToUserDto {
 *   @IsPrefixedId(IdPrefixes.ROLE)
 *   roleId!: string;
 * }
 */
export function IsPrefixedId(prefix: IdPrefix, validationOptions?: ValidationOptions) {
  return (target: object, propertyName: string) => {
    const identifier = createIdentifier(prefix);

    registerDecorator({
      name: 'isPrefixedId',
      target: target.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return identifier.is(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid ${prefix}_ id`;
        },
      },
    });
  };
}
