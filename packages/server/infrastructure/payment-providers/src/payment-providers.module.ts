import { Module } from '@nestjs/common';
import {
  FLUTTERWAVE_GATEWAY_TOKEN,
  HUBTEL_GATEWAY_TOKEN,
  PAYMENT_GATEWAY_TOKEN,
  PAYSTACK_GATEWAY_TOKEN,
  type PaymentGatewayPort,
} from '@workspace/ports';
import { FlutterwaveGatewayAdapter } from './adapters/flutterwave-gateway.adapter';
import { HubtelGatewayAdapter } from './adapters/hubtel-gateway.adapter';
import { PaystackGatewayAdapter } from './adapters/paystack-gateway.adapter';
import { HttpClientModule } from '@workspace/http';
import {
  PAYMENT_PROVIDERS_RUNTIME_CONFIG_TOKEN,
  type PaymentProvidersRuntimeConfig,
} from '@workspace/ports/config';

@Module({
  imports: [HttpClientModule],
  providers: [
    PaystackGatewayAdapter,
    FlutterwaveGatewayAdapter,
    HubtelGatewayAdapter,
    { provide: PAYSTACK_GATEWAY_TOKEN, useExisting: PaystackGatewayAdapter },
    { provide: FLUTTERWAVE_GATEWAY_TOKEN, useExisting: FlutterwaveGatewayAdapter },
    { provide: HUBTEL_GATEWAY_TOKEN, useExisting: HubtelGatewayAdapter },
    {
      provide: PAYMENT_GATEWAY_TOKEN,
      useFactory: (
        cfg: PaymentProvidersRuntimeConfig,
        paystack: PaystackGatewayAdapter,
        flutterwave: FlutterwaveGatewayAdapter,
        hubtel: HubtelGatewayAdapter,
      ): PaymentGatewayPort => {
        const selected = cfg.defaultProvider;
        if (selected === 'flutterwave') return flutterwave;
        if (selected === 'paystack') return paystack;
        return hubtel;
      },
      inject: [
        PAYMENT_PROVIDERS_RUNTIME_CONFIG_TOKEN,
        PaystackGatewayAdapter,
        FlutterwaveGatewayAdapter,
        HubtelGatewayAdapter,
      ],
    },
  ],
  exports: [
    PAYMENT_GATEWAY_TOKEN,
    PAYSTACK_GATEWAY_TOKEN,
    FLUTTERWAVE_GATEWAY_TOKEN,
    HUBTEL_GATEWAY_TOKEN,
    PaystackGatewayAdapter,
    FlutterwaveGatewayAdapter,
    HubtelGatewayAdapter,
  ],
})
export class PaymentProvidersModule {}
