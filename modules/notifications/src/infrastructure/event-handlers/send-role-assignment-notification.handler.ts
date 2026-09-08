import { Injectable } from '@nestjs/common';
import { WorkspaceEventHandlerPort } from '@workspace/ports';
import {
  IdentityEvents,
  PushTemplate,
  type EventType,
  type StrictlyTypedWorkspaceEvent,
} from '@workspace/types';
import { NOTIFICATION_TO_EMAIL_CATEGORY, NotificationCategory } from '@workspace/constants';
import { NotificationDispatchService } from '../../application/services/notification-dispatch.service';

type RoleAssignedV2 = typeof IdentityEvents.ROLE_ASSIGNED_V2;
type RoleRevokedV2 = typeof IdentityEvents.ROLE_REVOKED_V2;

/**
 * REACTS to `workspace.identity.role.assigned.v2`/`.revoked.v2`. Reads them
 * as facts from the shared catalog — imports nothing from `modules/identity`.
 *
 * Fans out to push (always, when a device/userId is known — the recipient
 * is userId-keyed, not profileId-keyed: identity is staff/admin RBAC, not
 * member data, see modules/CLAUDE.md's identity doc), email (when the V2
 * payload carries an address — two separate templates,
 * `role-assignment-assigned`/`role-assignment-revoked`, deliberately not
 * one template with a status variable: "granted a role" and "role revoked"
 * have meaningfully different tone/urgency for a staff/admin audience), and
 * in-app. Migrated off the V1 events (no contact info at all) — see the
 * event constants' own doc comments.
 */
@Injectable()
export class SendRoleAssignmentNotificationHandler extends WorkspaceEventHandlerPort<
  RoleAssignedV2 | RoleRevokedV2
> {
  constructor(private readonly dispatch: NotificationDispatchService) {
    super();
  }

  supports(eventType: EventType): boolean {
    return eventType === IdentityEvents.ROLE_ASSIGNED_V2 || eventType === IdentityEvents.ROLE_REVOKED_V2;
  }

  async handle(event: StrictlyTypedWorkspaceEvent<RoleAssignedV2 | RoleRevokedV2>): Promise<void> {
    const { payload } = event;
    const assigned = event.eventType === IdentityEvents.ROLE_ASSIGNED_V2;
    const title = assigned ? 'Role assigned' : 'Role revoked';
    const body = assigned
      ? `You have been granted the "${payload.roleKey}" role.`
      : `Your "${payload.roleKey}" role has been revoked.`;
    const context = { roleId: payload.roleId, roleKey: payload.roleKey };

    await this.dispatch.dispatch({
      userId: payload.userId,
      category: NotificationCategory.IDENTITY,
      eventType: event.eventType,
      email: payload.email
        ? {
            to: payload.email,
            subject: title,
            template: assigned ? 'role-assignment-assigned' : 'role-assignment-revoked',
            context,
            category: NOTIFICATION_TO_EMAIL_CATEGORY[NotificationCategory.IDENTITY],
          }
        : undefined,
      push: {
        template: assigned ? PushTemplate.ROLE_ASSIGNED : PushTemplate.ROLE_REVOKED,
        title,
        body,
        context,
      },
      inApp: assigned
        ? {
            type: 'identity.role_assigned',
            title,
            body,
            metadata: context,
          }
        : {
            type: 'identity.role_revoked',
            title,
            body,
            metadata: context,
          },
    });
  }
}
