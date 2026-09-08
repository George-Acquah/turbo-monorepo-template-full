import { AuthErrorCodes } from '@workspace/constants';
import { UnauthorizedAppException } from '@workspace/utils';

export class PaymentLinkInvalidException extends UnauthorizedAppException {
  constructor(message = 'Invalid, expired, or wrongly-scoped payment link') {
    super(AuthErrorCodes.AUTH_UNAUTHORIZED, message);
  }
}
