import { Global, Module } from '@nestjs/common';
import { PUSH_DELIVERY_PORT, PUSH_PROVIDER_TOKEN } from '@workspace/ports';
import { FcmPushService } from './providers/fcm-push.service';
import { PushDeliveryAdapter } from './adapters/push-delivery.adapter';

/**
 * FCM-only — covers iOS/Android/Web through one API (an APNs key configured
 * inside the Firebase project bridges iOS), so a separate raw-APNs client
 * isn't needed.
 */
@Global()
@Module({
  providers: [
    FcmPushService,
    { provide: PUSH_PROVIDER_TOKEN, useExisting: FcmPushService },
    PushDeliveryAdapter,
    { provide: PUSH_DELIVERY_PORT, useExisting: PushDeliveryAdapter },
  ],
  exports: [PUSH_PROVIDER_TOKEN, PUSH_DELIVERY_PORT],
})
export class PushModule {}
