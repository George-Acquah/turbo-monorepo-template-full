import { NotificationErrorCodes } from '@workspace/constants';
import { ForbiddenAppException, NotFoundAppException } from '@workspace/utils';

export class NotificationNotFoundException extends NotFoundAppException {
  constructor(message = 'Notification not found') {
    super(NotificationErrorCodes.NOTIFICATION_NOT_FOUND, message);
  }
}

/**
 * IDOR guard: `InAppNotificationStorePort#markRead`/`#archive` take only an id, with no owner
 * filter, so the use-cases that call them must confirm the caller owns the row first.
 */
export class NotificationAccessDeniedException extends ForbiddenAppException {
  constructor(message = 'You do not have access to this notification') {
    super(NotificationErrorCodes.NOTIFICATION_ACCESS_DENIED, message);
  }
}
