import { SetMetadata } from '@nestjs/common';
import { DecoratorKeys } from '@workspace/constants';

export const RequireModule = (featureKey: string) =>
  SetMetadata(DecoratorKeys.REQUIRED_MODULE, featureKey);
