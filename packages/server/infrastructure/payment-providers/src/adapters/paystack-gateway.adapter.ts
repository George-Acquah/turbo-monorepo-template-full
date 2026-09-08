import { Inject, Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  HTTP_PORT_TOKEN,
  HttpPort,
  InitializeGatewayPaymentInput,
  InitializeGatewayPaymentResult,
  LOGGER_TOKEN,
  LoggerPort,
  ParseWebhookEventInput,
  ParsedWebhookEvent,
  type PaymentGatewayPort,
  RefundGatewayPaymentInput,
  RefundGatewayPaymentResult,
  VerifyGatewayPaymentInput,
  VerifyGatewayPaymentResult,
  VerifyWebhookSignatureInput,
  ChargeAuthorizationInput,
  ChargeAuthorizationResult,
} from '@workspace/ports';
import {
  PAYMENT_PROVIDERS_RUNTIME_CONFIG_TOKEN,
  type PaymentProvidersRuntimeConfig,
} from '@workspace/ports/config';

interface PaystackResponse<T = unknown> {
  status: boolean;
  message?: string;
  data?: T;
}

interface PaystackInitializeData {
  authorization_url?: string;
  reference?: string;
  access_code?: string;
}

interface PaystackVerifyData {
  id?: number;
  reference?: string;
  status?: string; // success | failed | abandoned | ongoing | pending
  paid_at?: string;
  gateway_response?: string;
  fees?: number; // in kobo/pesewas
  authorization?: Record<string, unknown>;
  amount?: number; // in kobo/pesewas — the gateway-confirmed charge amount
  currency?: string;
}

interface PaystackRefundData {
  id?: number;
  status?: string; // processed | pending | failed (commonly)
}

interface PaystackChargeAuthorizationData {
  id?: number;
  reference?: string;
  status?: string; // success | failed | abandoned | ongoing | pending
  gateway_response?: string;
}

@Injectable()
export class PaystackGatewayAdapter implements PaymentGatewayPort {
  private readonly context = PaystackGatewayAdapter.name;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(
    @Inject(HTTP_PORT_TOKEN) private readonly http: HttpPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Inject(PAYMENT_PROVIDERS_RUNTIME_CONFIG_TOKEN)
    private readonly cfg: PaymentProvidersRuntimeConfig,
  ) {}

  getProviderName(): string {
    return 'PAYSTACK';
  }

  async initializePayment(
    input: InitializeGatewayPaymentInput,
  ): Promise<InitializeGatewayPaymentResult> {
    const response = await this.request<PaystackInitializeData>({
      method: 'POST',
      path: '/transaction/initialize',
      body: {
        email: input.customerEmail || 'payments@repo.local',
        // Amount arrives in lowest currency unit already (kobo/pesewas).
        amount: Math.round(input.amount),
        currency: input.currency,
        reference: input.reference,
        callback_url: this.resolveCallbackUrl(),
        ...(input.metadata ? { metadata: input.metadata } : {}),
        ...(input.channels && input.channels.length > 0 ? { channels: input.channels } : {}),
      },
    });

    if (!response.status || !response.data?.authorization_url || !response.data.reference) {
      const detail = response.message || 'Paystack payment initialization failed';
      this.logger.error(
        `Paystack initialize rejected: ${detail}`,
        JSON.stringify({ code: (response as { code?: string }).code, reference: input.reference }),
        this.context,
      );
      throw new Error(detail);
    }

    return {
      authorizationUrl: response.data.authorization_url,
      providerReference: response.data.reference,
      providerPaymentId: response.data.reference,
      accessCode: response.data.access_code,
    };
  }

  async verifyPayment(input: VerifyGatewayPaymentInput): Promise<VerifyGatewayPaymentResult> {
    const response = await this.request<PaystackVerifyData>({
      method: 'GET',
      path: `/transaction/verify/${encodeURIComponent(input.providerReference)}`, // :contentReference[oaicite:6]{index=6}
    });

    if (!response.status || !response.data) {
      return {
        status: 'FAILED',
        failureReason: response.message || 'Paystack verification failed',
        raw: response,
      };
    }

    const status = this.mapPaystackStatus(response.data.status);
    const paidAt = response.data.paid_at ? new Date(response.data.paid_at) : undefined;

    return {
      status,
      providerTransactionId: response.data.id ? String(response.data.id) : undefined,
      paidAt,
      raw: response.data,
      feeAmount: typeof response.data.fees === 'number' ? response.data.fees : undefined, // subunit
      paymentMethodData: response.data.authorization,
      failureReason: status === 'FAILED' ? response.data.gateway_response : undefined,
      amountMinor: typeof response.data.amount === 'number' ? response.data.amount : undefined,
      currency: typeof response.data.currency === 'string' ? response.data.currency : undefined,
    };
  }

  async refundPayment(input: RefundGatewayPaymentInput): Promise<RefundGatewayPaymentResult> {
    const body: Record<string, unknown> = {
      // Paystack accepts transaction reference or id for "transaction" :contentReference[oaicite:7]{index=7}
      transaction: input.providerReference,
    };

    if (typeof input.amount === 'number') {
      body.amount = Math.round(input.amount);
    }
    if (input.reason) {
      body.merchant_note = input.reason;
    }

    const response = await this.request<PaystackRefundData>({
      method: 'POST',
      path: '/refund',
      body,
    });

    if (!response.status || !response.data) {
      return {
        status: 'FAILED',
        failureReason: response.message || 'Paystack refund failed',
        raw: response,
      };
    }

    const normalizedStatus =
      (response.data.status || '').toLowerCase() === 'processed'
        ? 'SUCCESS'
        : (response.data.status || '').toLowerCase() === 'failed'
          ? 'FAILED'
          : 'PENDING';

    return {
      status: normalizedStatus,
      providerRefundId: response.data.id ? String(response.data.id) : undefined,
      raw: response.data,
    };
  }

  async chargeAuthorization(input: ChargeAuthorizationInput): Promise<ChargeAuthorizationResult> {
    const response = await this.request<PaystackChargeAuthorizationData>({
      method: 'POST',
      path: '/transaction/charge_authorization',
      body: {
        authorization_code: input.authorizationToken,
        email: input.customerEmail || 'payments@repo.local',
        amount: Math.round(input.amount),
        currency: input.currency,
        reference: input.reference,
      },
    });

    if (!response.status || !response.data) {
      return {
        status: 'FAILED',
        failureReason: response.message || 'Paystack charge-authorization failed',
        raw: response,
      };
    }

    const status = this.mapPaystackStatus(response.data.status);
    return {
      status,
      providerTransactionId: response.data.id ? String(response.data.id) : undefined,
      raw: response.data,
      failureReason: status === 'FAILED' ? response.data.gateway_response : undefined,
    };
  }

  verifyWebhookSignature(input: VerifyWebhookSignatureInput): boolean {
    // Paystack sends signature in x-paystack-signature header; verify with HMAC-SHA512(rawBody, secret) :contentReference[oaicite:9]{index=9}
    const header =
      input.headers['x-paystack-signature'] ??
      input.headers['X-Paystack-Signature'] ??
      input.headers['X-PAYSTACK-SIGNATURE'];

    const provided = Array.isArray(header) ? header[0] : header;
    if (!provided || !input.secret) return false;

    const computed = createHmac('sha512', input.secret).update(input.rawBody).digest('hex');

    // constant-time compare with length guard
    const a = Buffer.from(computed, 'utf8');
    const b = Buffer.from(provided, 'utf8');
    if (a.length !== b.length) return false;

    try {
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  parseWebhookEvent(input: ParseWebhookEventInput): ParsedWebhookEvent {
    const parsed = JSON.parse(input.rawBody) as Record<string, unknown>;
    const data = (parsed.data as Record<string, unknown>) || {};

    const providerEventId =
      (typeof data.id === 'string' ? data.id : undefined) ||
      (typeof data.id === 'number' ? String(data.id) : undefined) ||
      (typeof data.reference === 'string' ? data.reference : undefined);

    const paymentReference = typeof data.reference === 'string' ? data.reference : undefined;

    return {
      eventType: String(parsed.event || 'unknown'),
      providerEventId,
      paymentReference,
      data,
    };
  }

  private mapPaystackStatus(status?: string): VerifyGatewayPaymentResult['status'] {
    switch ((status || '').toLowerCase()) {
      case 'success':
        return 'SUCCESS';
      case 'pending':
      case 'ongoing':
        return 'PENDING';
      default:
        return 'FAILED';
    }
  }

  private resolveCallbackUrl(): string {
    const callback = this.cfg.paystack.callbackUrl;
    if (!callback) {
      throw new Error('Paystack callback URL is not configured (PAYSTACK_CALLBACK_URL)');
    }
    return this.validateHttpsUrl(callback, 'Paystack callback URL');
  }

  private validateHttpsUrl(value: string, name: string): string {
    try {
      const url = new URL(value);
      // HTTPS is required everywhere except loopback hosts. Paystack only
      // redirects a real browser to the callback URL in production; a
      // developer exercising the flow against localhost has no TLS cert and
      // shouldn't need one. This is a scheme allowance for a redirect
      // target only — it does not touch amount ownership, verification, or
      // webhook-signature checks.
      const isLoopbackHost =
        url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname === '::1' ||
        url.hostname === '[::1]';
      const schemeOk = url.protocol === 'https:' || (url.protocol === 'http:' && isLoopbackHost);
      if (!schemeOk) {
        throw new Error(`${name} must use HTTPS`);
      }
      return url.toString();
    } catch (err) {
      throw new Error(`${name} is invalid: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async request<T>(input: {
    method: 'GET' | 'POST';
    path: string;
    body?: Record<string, unknown>;
  }): Promise<PaystackResponse<T>> {
    const secret = this.cfg.paystack.secretKey;
    if (!secret) throw new Error('PAYSTACK_SECRET_KEY is not configured');

    const url = `${this.baseUrl}${input.path}`;
    const config = {
      timeout: 15_000,
      retries: 2,
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      if (input.method === 'GET') {
        return await this.http.get<PaystackResponse<T>>(url, config);
      }
      return await this.http.post<PaystackResponse<T>>(url, input.body ?? {}, config);
    } catch (err) {
      // Paystack answers validation failures with HTTP 4xx AND a JSON body
      // ({ status: false, message, code }). The HTTP client rejects on 4xx,
      // so without this the useful message ("Invalid Amount Sent",
      // "Currency not supported by merchant", …) is swallowed and every
      // caller just sees "status code 400". Surface the body so the
      // adapter's own `!response.status` branches can report it.
      const body = (err as { response?: { data?: unknown } })?.response?.data;
      if (body && typeof body === 'object' && 'status' in body) {
        return body as PaystackResponse<T>;
      }
      throw err;
    }
  }
}
