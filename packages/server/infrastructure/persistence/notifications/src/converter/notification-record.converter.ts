import type {
  NotificationPersistence,
  InAppNotificationPersistence,
  NotificationDeliveryPersistence,
} from '@workspace/ports';

// Mongoose documents carry `_id`; the ports use `id`. `timestamps` is a
// @Schema() option, not a @Prop(), so Mongoose's lean() return type doesn't
// know about createdAt/updatedAt even though they're populated at runtime —
// a known gap in @nestjs/mongoose's typings. Accepting a loose record here
// (rather than fighting the lean<>Document<> generics) and trusting the
// schema's actual shape is the pragmatic way through it.
type LeanRecord = Record<string, unknown> & { _id: string };

export const NotificationRecordConverter = {
  toNotificationPersistence(row: LeanRecord): NotificationPersistence {
    const { _id, ...rest } = row;
    return { id: _id, ...rest } as NotificationPersistence;
  },

  toInAppNotificationPersistence(row: LeanRecord): InAppNotificationPersistence {
    const { _id, ...rest } = row;
    return { id: _id, ...rest } as InAppNotificationPersistence;
  },

  toNotificationDeliveryPersistence(row: LeanRecord): NotificationDeliveryPersistence {
    const { _id, ...rest } = row;
    return { id: _id, ...rest } as NotificationDeliveryPersistence;
  },
};
