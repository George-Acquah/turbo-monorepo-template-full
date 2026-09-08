import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validateSync } from 'class-validator';

export interface SchemaValidationResult<T> {
  schema: T;
  errors: string[];
}

export function validateSchema<T extends object>(
  cls: ClassConstructor<T>,
  rawEnv: NodeJS.ProcessEnv,
): SchemaValidationResult<T> {
  const schema = plainToInstance(cls, rawEnv, {
    enableImplicitConversion: false,
    exposeDefaultValues: true,
  }) as T;

  const errors = validateSync(schema as object, {
    skipMissingProperties: false,
    whitelist: false,
    forbidUnknownValues: true,
  }).flatMap((error) =>
    Object.values(error.constraints ?? {}).map((message) => `${error.property}: ${message}`),
  );

  return {
    schema,
    errors,
  };
}
