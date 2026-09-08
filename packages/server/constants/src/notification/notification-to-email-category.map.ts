import { NotificationCategory } from './notification-category.constants';
import { EmailCategory } from '../email/email-category.constants';

/**
 * `NotificationCategory` (member preference gating) and `EmailCategory`
 * (provider routing) are deliberately separate enums — see each constant's
 * own doc comment. This is the explicit bridge between them: every handler
 * in `modules/notifications` that sends email should pass
 * `NOTIFICATION_TO_EMAIL_CATEGORY[input.category]` rather than relying on
 * `EmailProviderRouter`'s template-name fallback, which only happens to be
 * correct for templates already listed in `EMAIL_TEMPLATE_CATEGORY_MAP`.
 */
export const NOTIFICATION_TO_EMAIL_CATEGORY: Record<NotificationCategory, EmailCategory> = {
  [NotificationCategory.BILLING]: EmailCategory.PAYMENTS,
  [NotificationCategory.IDENTITY]: EmailCategory.SECURITY,
  [NotificationCategory.EVENTS]: EmailCategory.EVENTS,
  [NotificationCategory.PROFILES]: EmailCategory.DEFAULT,
  [NotificationCategory.LEARNING]: EmailCategory.EVENTS,
  // Not sent by email today (the catalog-creation broadcast is in-app only)
  // — mapped for Record exhaustiveness/future use, same category email would
  // route through if that ever changes.
  [NotificationCategory.CATALOG]: EmailCategory.EVENTS,
};
