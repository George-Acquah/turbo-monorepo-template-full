import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
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

interface FlutterwaveResponse<T = unknown> {
  status: string; // "success" | "error"
  message?: string;
  data?: T;
}

interface FlutterwaveInitializeData {
  link?: string;
}

interface FlutterwaveVerifyData {
  id?: number;
  tx_ref?: string;
  flw_ref?: string;
  status?: string; // "successful" | "failed" | "pending" ...
  amount?: number;
  charged_amount?: number;
  currency?: string;
  payment_type?: string;
  created_at?: string;
  app_fee?: number;
}

interface FlutterwaveRefundData {
  id?: number;
  status?: string; // "successful" | "pending" | ...
}

@Injectable()
export class FlutterwaveGatewayAdapter implements PaymentGatewayPort {
  private readonly context = FlutterwaveGatewayAdapter.name;
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  constructor(
    @Inject(HTTP_PORT_TOKEN) private readonly http: HttpPort,
    @Inject(LOGGER_TOKEN) private readonly logger: LoggerPort,
    @Inject(PAYMENT_PROVIDERS_RUNTIME_CONFIG_TOKEN)
    private readonly cfg: PaymentProvidersRuntimeConfig,
  ) {}

  getProviderName(): string {
    return 'FLUTTERWAVE';
  }

  async initializePayment(
    input: InitializeGatewayPaymentInput,
  ): Promise<InitializeGatewayPaymentResult> {
    const body: Record<string, unknown> = {
      tx_ref: input.reference,
      amount: input.amount,
      currency: input.currency,
      customer: { email: input.customerEmail || 'payments@repo.local' },
      meta: input.metadata,
      payment_options:
        input.channels && input.channels.length > 0
          ? input.channels.join(',')
          : 'card,mobilemoneyghana,banktransfer',
    };

    body.redirect_url = this.resolveCallbackUrl();

    const response = await this.request<FlutterwaveInitializeData>({
      method: 'POST',
      path: '/payments',
      body,
    });

    if (!this.isSuccess(response) || !response.data?.link) {
      throw new Error(response.message || 'Flutterwave payment initialization failed');
    }

    return {
      authorizationUrl: response.data.link,
      providerReference: input.reference, // tx_ref
      providerPaymentId: input.reference,
    };
  }

  async verifyPayment(input: VerifyGatewayPaymentInput): Promise<VerifyGatewayPaymentResult> {
    const verified = await this.fetchTransaction(input.providerReference);

    if (!verified) {
      return { status: 'FAILED', failureReason: 'Flutterwave verification failed' };
    }

    const status = this.mapStatus(verified.status);

    return {
      status,
      providerTransactionId: verified.id != null ? String(verified.id) : undefined,
      paidAt: verified.created_at ? new Date(verified.created_at) : undefined,
      raw: verified,
      feeAmount: typeof verified.app_fee === 'number' ? verified.app_fee : undefined,
      paymentMethodData: {
        paymentType: verified.payment_type,
        flwRef: verified.flw_ref,
        txRef: verified.tx_ref,
      },
      failureReason: status === 'FAILED' ? 'Payment not successful' : undefined,
      amountMinor: typeof verified.amount === 'number' ? verified.amount : undefined,
      currency: typeof verified.currency === 'string' ? verified.currency : undefined,
    };
  }

  async refundPayment(input: RefundGatewayPaymentInput): Promise<RefundGatewayPaymentResult> {
    const txId = await this.resolveTransactionId(input.providerReference);
    if (!txId) {
      return { status: 'FAILED', failureReason: 'Unable to resolve Flutterwave transaction id' };
    }

    const body: Record<string, unknown> = {};
    if (typeof input.amount === 'number') body.amount = input.amount;
    if (input.reason) body.comments = input.reason;

    const response = await this.request<FlutterwaveRefundData>({
      method: 'POST',
      path: `/transactions/${encodeURIComponent(txId)}/refund`,
      body,
    });

    if (!this.isSuccess(response) || !response.data) {
      return {
        status: 'FAILED',
        failureReason: response.message || 'Flutterwave refund failed',
        raw: response,
      };
    }

    return {
      status: (response.data.status || '').toLowerCase() === 'successful' ? 'SUCCESS' : 'PENDING',
      providerRefundId: response.data.id != null ? String(response.data.id) : undefined,
      raw: response.data,
    };
  }

  /**
   * Flutterwave's tokenized-charge flow (a `card.type=tokenize` charge, then
   * a separate `/tokenized-charges` call) is a materially different
   * integration from Paystack's single reusable `authorization_code`, and
   * this repo's launch provider is Paystack (doc 13) — deliberately not
   * implemented against an unverified API shape rather than guessing.
   */
  async chargeAuthorization(_input: ChargeAuthorizationInput): Promise<ChargeAuthorizationResult> {
    return {
      status: 'FAILED',
      failureReason: 'Saved-method charging not supported for this provider',
    };
  }

  /**
   * Webhook signature verification
   *
   * Flutterwave sends a signature header. Depending on configuration/version,
   * you may see `flutterwave-signature` or `verif-hash`.
   *
   * We support:
   * 1) HMAC-SHA256(rawBody, secret) == header
   * 2) header == secret (legacy "secret hash" style)
   */
  verifyWebhookSignature(input: VerifyWebhookSignatureInput): boolean {
    const provided =
      this.getHeader(input.headers, 'flutterwave-signature') ??
      this.getHeader(input.headers, 'verif-hash');

    // Fail closed on a missing secret, matching the Paystack and Hubtel
    // adapters. Without this guard the whole check was forgeable whenever
    // FLUTTERWAVE_SECRET_KEY was unset — it defaults to '' — because
    // HMAC-SHA256(body, '') is a well-defined value anyone can compute, so an
    // attacker could sign an arbitrary body and pass verification.
    if (!provided || !input.secret) return false;

    // HMAC over the exact raw bytes.
    const computedHex = crypto
      .createHmac('sha256', input.secret)
      .update(input.rawBody, 'utf8')
      .digest('hex');

    return this.safeEqual(provided, computedHex);

    // The legacy `header === secret` fallback was removed deliberately. Beyond
    // being weaker than an HMAC, it meant a single echoed header value
    // asserted — and on a timing-unsafe path could leak — the live API secret.
    // Flutterwave's current signature scheme is the HMAC above; if a legacy
    // integration genuinely still needs the plain-hash style, reintroduce it
    // behind an explicit opt-in config flag rather than as a silent fallback.
  }

  parseWebhookEvent(input: ParseWebhookEventInput): ParsedWebhookEvent {
    const parsed = JSON.parse(input.rawBody) as Record<string, unknown>;
    const data = (parsed.data as Record<string, unknown>) || {};

    // Flutterwave payloads vary: sometimes `event`, sometimes `type`, sometimes nested
    const eventType =
      (typeof parsed.event === 'string' && parsed.event) ||
      (typeof parsed.type === 'string' && parsed.type) ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (typeof (parsed as any)?.event?.type === 'string' && (parsed as any).event.type) ||
      'unknown';

    const providerEventId =
      (typeof parsed.id === 'string' ? parsed.id : undefined) ||
      (typeof parsed.id === 'number' ? String(parsed.id) : undefined) ||
      (typeof data.id === 'string' ? data.id : undefined) ||
      (typeof data.id === 'number' ? String(data.id) : undefined) ||
      (typeof data.tx_ref === 'string' ? data.tx_ref : undefined) ||
      (typeof data.reference === 'string' ? data.reference : undefined);

    const paymentReference =
      (typeof data.tx_ref === 'string' ? data.tx_ref : undefined) ||
      (typeof data.reference === 'string' ? data.reference : undefined);

    return { eventType, providerEventId, paymentReference, data };
  }

  // ────────────────────────────────────────────────────────────
  // Internals
  // ────────────────────────────────────────────────────────────

  private resolveCallbackUrl(): string {
    const callback = this.cfg.flutterwave.callbackUrl;
    if (!callback) {
      throw new Error('Flutterwave callback URL is not configured (FLUTTERWAVE_CALLBACK_URL)');
    }

    try {
      const url = new URL(callback);
      if (url.protocol !== 'https:') {
        throw new Error('Flutterwave callback URL must use HTTPS');
      }
      return url.toString();
    } catch (err) {
      throw new Error(
        `Flutterwave callback URL is invalid: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private async fetchTransaction(reference: string): Promise<FlutterwaveVerifyData | undefined> {
    // If numeric, try verify by id first
    if (/^\d+$/.test(reference)) {
      const byId = await this.verifyById(reference);
      if (byId) return byId;
    }

    // Otherwise verify by tx_ref
    const byRef = await this.verifyByReference(reference);
    if (byRef) return byRef;

    // Last resort
    if (/^\d+$/.test(reference)) return this.verifyById(reference);
    return undefined;
  }

  private async verifyByReference(txRef: string): Promise<FlutterwaveVerifyData | undefined> {
    const response = await this.request<FlutterwaveVerifyData>({
      method: 'GET',
      path: `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
    });

    return this.isSuccess(response) ? response.data : undefined;
  }

  private async verifyById(id: string): Promise<FlutterwaveVerifyData | undefined> {
    const response = await this.request<FlutterwaveVerifyData>({
      method: 'GET',
      path: `/transactions/${encodeURIComponent(id)}/verify`,
    });

    return this.isSuccess(response) ? response.data : undefined;
  }

  private async resolveTransactionId(reference: string): Promise<string | undefined> {
    if (/^\d+$/.test(reference)) return reference;
    const verified = await this.verifyByReference(reference);
    return verified?.id != null ? String(verified.id) : undefined;
  }

  private mapStatus(status?: string): VerifyGatewayPaymentResult['status'] {
    switch ((status || '').toLowerCase()) {
      case 'successful':
      case 'success':
      case 'completed':
        return 'SUCCESS';
      case 'pending':
        return 'PENDING';
      default:
        return 'FAILED';
    }
  }

  private isSuccess<T>(res: FlutterwaveResponse<T>): boolean {
    return (res.status || '').toLowerCase() === 'success';
  }

  private getHeader(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string | undefined {
    const needle = name.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() !== needle) continue;
      return Array.isArray(v) ? v[0] : v;
    }
    return undefined;
  }

  private safeEqual(a: string, b: string): boolean {
    try {
      const aa = Buffer.from(a);
      const bb = Buffer.from(b);
      if (aa.length !== bb.length) return false;
      return crypto.timingSafeEqual(aa, bb);
    } catch {
      return false;
    }
  }

  private async request<T>(input: {
    method: 'GET' | 'POST';
    path: string;
    body?: Record<string, unknown>;
  }): Promise<FlutterwaveResponse<T>> {
    const secretKey = this.cfg.flutterwave.secretKey;
    if (!secretKey) throw new Error('FLW_SECRET_KEY/FLUTTERWAVE_SECRET_KEY is not configured');

    const url = `${this.baseUrl}${input.path}`;
    const config = {
      timeout: 15000,
      retries: 2,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };

    if (input.method === 'GET') {
      return this.http.get<FlutterwaveResponse<T>>(url, config);
    }
    return this.http.post<FlutterwaveResponse<T>>(url, input.body ?? {}, config);
  }
}
