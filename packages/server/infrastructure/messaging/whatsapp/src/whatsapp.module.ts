import { Global, Module } from '@nestjs/common';
import { HttpClientModule } from '@workspace/http';
import { TemplateModule } from '@workspace/templates';
import { WHATSAPP_RUNTIME_CONFIG_TOKEN, type WhatsAppRuntimeConfig } from '@workspace/ports/config';
import {
  WHATSAPP_DELIVERY_PORT,
  WHATSAPP_PROVIDER_TOKEN,
  type WhatsAppProviderPort,
} from '@workspace/ports';
import { TwilioWhatsAppService } from './providers/twilio-whatsapp.service';
import { MetaCloudWhatsAppService } from './providers/meta-cloud-whatsapp.service';
import { WhatsAppTemplateRenderingService } from './services/whatsapp-template-rendering.service';
import { WhatsAppDeliveryAdapter } from './adapters/whatsapp-delivery.adapter';

@Global()
@Module({
  imports: [HttpClientModule, TemplateModule],
  providers: [
    TwilioWhatsAppService,
    MetaCloudWhatsAppService,
    {
      provide: WHATSAPP_PROVIDER_TOKEN,
      useFactory: (
        config: WhatsAppRuntimeConfig,
        twilio: TwilioWhatsAppService,
        meta: MetaCloudWhatsAppService,
      ): WhatsAppProviderPort => (config.provider === 'meta' ? meta : twilio),
      inject: [WHATSAPP_RUNTIME_CONFIG_TOKEN, TwilioWhatsAppService, MetaCloudWhatsAppService],
    },
    WhatsAppTemplateRenderingService,
    WhatsAppDeliveryAdapter,
    { provide: WHATSAPP_DELIVERY_PORT, useExisting: WhatsAppDeliveryAdapter },
  ],
  exports: [WHATSAPP_PROVIDER_TOKEN, WHATSAPP_DELIVERY_PORT],
})
export class WhatsAppModule {}
