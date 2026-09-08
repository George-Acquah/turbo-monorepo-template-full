import { enumConstraint } from '../builders';
import { Schemas, Tables } from '../postgres.constants';
import {
  NotificationTemplateChannel,
  NotificationPreferenceChannel,
  CommunicationPreferenceOverrideReason,
  NotificationProviderChannel,
  PushDevicePlatform,
} from '../../notification';

// workspace_notifications is CONFIG only (templates, preferences, channel
// config, overrides, push devices) — notification RECORDS and delivery logs
// live in MongoDB (see @workspace/mongo), so there is no
// NotificationCampaign/NotificationRecipient coverage here.
export const NotificationsConstraints = [
  enumConstraint({
    schema: Schemas.NOTIFICATIONS,
    table: Tables.NOTIFICATION_TEMPLATES,
    column: 'channel',
    values: NotificationTemplateChannel,
  }),
  enumConstraint({
    schema: Schemas.NOTIFICATIONS,
    table: Tables.NOTIFICATION_PREFERENCES,
    column: 'channel',
    values: NotificationPreferenceChannel,
  }),
  enumConstraint({
    schema: Schemas.NOTIFICATIONS,
    table: Tables.COMMUNICATION_PREFERENCE_OVERRIDES,
    column: 'reason',
    values: CommunicationPreferenceOverrideReason,
  }),
  enumConstraint({
    schema: Schemas.NOTIFICATIONS,
    table: Tables.NOTIFICATION_CHANNEL_CONFIGS,
    column: 'channel',
    values: NotificationProviderChannel,
  }),
  enumConstraint({
    schema: Schemas.NOTIFICATIONS,
    table: Tables.PUSH_DEVICES,
    column: 'platform',
    values: PushDevicePlatform,
  }),
] as const;
