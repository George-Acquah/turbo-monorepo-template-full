import type { Provider } from '@nestjs/common';
import type { WorkspaceEventHandlerPort } from '@workspace/ports';
import { SendRoleAssignmentNotificationHandler } from './send-role-assignment-notification.handler';
import { SendWelcomeNotificationOnProfileLinkedHandler } from './send-welcome-notification-on-profile-linked.handler';
import { SendWelcomeNotificationOnUserRegisteredHandler } from './send-welcome-notification-on-user-registered.handler';

/**
 * Module-local DI token — not a shared port. Each handler is listed once
 * here; the generated `createDomainEventConsumer` consumer injects the
 * aggregated array and never changes as handlers are added or removed.
 *
 * TEMPLATE NOTE: ships with three example reactions (welcome on registration,
 * welcome on account-claim link, role-assignment notice). Add a handler by
 * (1) creating it here, (2) adding it to both arrays below, (3) adding its
 * event to `notifications.subscriptions.ts`.
 */
export const NOTIFICATIONS_EVENT_HANDLERS = Symbol('NOTIFICATIONS_EVENT_HANDLERS');

export const notificationsEventHandlerProviders: Provider[] = [
  SendRoleAssignmentNotificationHandler,
  SendWelcomeNotificationOnProfileLinkedHandler,
  SendWelcomeNotificationOnUserRegisteredHandler,
  {
    provide: NOTIFICATIONS_EVENT_HANDLERS,
    useFactory: (
      roleAssignment: SendRoleAssignmentNotificationHandler,
      welcomeOnProfileLinked: SendWelcomeNotificationOnProfileLinkedHandler,
      welcomeOnUserRegistered: SendWelcomeNotificationOnUserRegisteredHandler,
    ): WorkspaceEventHandlerPort[] => [
      roleAssignment,
      welcomeOnProfileLinked,
      welcomeOnUserRegistered,
    ],
    inject: [
      SendRoleAssignmentNotificationHandler,
      SendWelcomeNotificationOnProfileLinkedHandler,
      SendWelcomeNotificationOnUserRegisteredHandler,
    ],
  },
];
