import { Inject, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import {
  HTTP_PORT_TOKEN,
  HttpPort,
  InitializeGatewayPaymentInput,
  InitializeGatewayPaymentResult,
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
import { BillingErrorCodes, Currency } from '@workspace/constants';
import { BadRequestAppException } from '@workspace/utils';

interface HubtelCheckoutData {
  [key: string]: unknown;
  checkoutUrl?: string;
  checkoutDirectUrl?: string;
  checkoutId?: string;
  clientReference?: string;
}

interface HubtelEnvelope<T = Record<string, unknown>> {
  responseCode?: string;
  ResponseCode?: string;
  message?: string;
  Message?: string;
  status?: string;
  Status?: string;
  data?: T;
  Data?: T;
  checkoutUrl?: string;
  checkoutDirectUrl?: string;
  checkoutId?: string;
  clientReference?: string;
}

interface HubtelStatusData {
  [key: string]: unknown;
  status?: string;
  Status?: string;
  date?: string;
  transactionId?: string;
  externalTransactionId?: string;
  clientReference?: string;
  checkoutId?: string;
  amount?: number;
  charges?: number;
  paymentMethod?: string;
  customerPhoneNumber?: string;
  paymentDetails?: Record<string, unknown>;
}

interface HubtelRefundData {
  [key: string]: unknown;
  orderId?: string;
}

@Injectable()
export class HubtelGatewayAdapter implements PaymentGatewayPort {
  private readonly checkoutBaseUrl = 'https://payproxyapi.hubtel.com';
  private readonly statusBaseUrl = 'https://api-txnstatus.hubtel.com';
  private readonly refundBaseUrl = 'https://refund-api.hubtel.com';

  constructor(
    @Inject(HTTP_PORT_TOKEN) private readonly http: HttpPort,
    @Inject(PAYMENT_PROVIDERS_RUNTIME_CONFIG_TOKEN)
    private readonly cfg: PaymentProvidersRuntimeConfig,
  ) {}

  getProviderName(): string {
    return 'HUBTEL';
  }

  async initializePayment(
    input: InitializeGatewayPaymentInput,
  ): Promise<InitializeGatewayPaymentResult> {
    // Hubtel's checkout API has no currency field (see verifyPayment below) —
    // it always settles in GHS regardless of what's passed. Silently
    // accepting a non-GHS currency here would charge the customer in GHS
    // while every downstream record (Order/Payment) believes it charged
    // something else. Fail fast instead of mis-processing money.
    if (input.currency !== Currency.GHS) {
      throw new BadRequestAppException(
        BillingErrorCodes.GATEWAY_UNSUPPORTED_CURRENCY,
        `Hubtel only settles in ${Currency.GHS}; received ${input.currency}.`,
      );
    }

    const callbackUrl = this.resolveCallbackUrl();
    const returnUrl = this.resolveReturnUrl(callbackUrl);
    const cancelUrl = this.resolveCancelUrl(callbackUrl);

    const merchantAccountNumber = this.getMerchantAccountNumber();

    const response = await this.http.post<HubtelEnvelope<HubtelCheckoutData>>(
      `${this.checkoutBaseUrl}/items/initiate`,
      {
        totalAmount: input.amount,
        description: this.resolveDescription(input),
        callbackUrl,
        returnUrl,
        cancellationUrl: cancelUrl,
        merchantAccountNumber,
        clientReference: input.reference,
        ...(input.customerName ? { payeeName: input.customerName } : {}),
        ...(input.customerPhone ? { payeeMobileNumber: input.customerPhone } : {}),
        ...(input.customerEmail ? { payeeEmail: input.customerEmail } : {}),
      },
      this.buildConfig(),
    );

    const data = this.resolveEnvelopeData(response);
    const authorizationUrl = data.checkoutDirectUrl || data.checkoutUrl;

    if (!authorizationUrl) {
      throw new Error(this.resolveMessage(response) || 'Hubtel payment initialization failed');
    }

    return {
      authorizationUrl,
      providerReference: data.clientReference || input.reference,
      providerPaymentId: data.checkoutId,
      accessCode: data.checkoutId,
    };
  }

  async verifyPayment(input: VerifyGatewayPaymentInput): Promise<VerifyGatewayPaymentResult> {
    const merchantAccountNumber = this.getMerchantAccountNumber();
    const response = await this.http.get<HubtelEnvelope<HubtelStatusData>>(
      `${this.statusBaseUrl}/transactions/${encodeURIComponent(merchantAccountNumber)}/status?clientReference=${encodeURIComponent(input.providerReference)}`,
      this.buildConfig(),
    );

    const data = this.resolveEnvelopeData(response);
    const status = this.mapPaymentStatus(this.resolveStatus(response, data));
    const paidAt = data.date ? new Date(data.date) : undefined;
    const paymentDetails = this.asRecord(data.paymentDetails);

    return {
      status,
      providerTransactionId: this.firstString(
        data.transactionId,
        data.externalTransactionId,
        data.checkoutId,
      ),
      paidAt,
      raw: data,
      feeAmount: typeof data.charges === 'number' ? data.charges : undefined,
      paymentMethodData: {
        clientReference: this.firstString(data.clientReference, input.providerReference),
        checkoutId: data.checkoutId,
        paymentMethod: data.paymentMethod,
        paymentType: this.firstString(paymentDetails?.PaymentType, paymentDetails?.paymentType),
        channel: this.firstString(paymentDetails?.Channel, paymentDetails?.channel),
        customerPhoneNumber: data.customerPhoneNumber,
      },
      failureReason:
        status === 'FAILED' ? this.resolveMessage(response) || 'Hubtel payment failed' : undefined,
      // No separate currency field — Hubtel is GHS-only for this integration.
      amountMinor: typeof data.amount === 'number' ? data.amount : undefined,
    };
  }

  async refundPayment(input: RefundGatewayPaymentInput): Promise<RefundGatewayPaymentResult> {
    const merchantAccountNumber = this.getMerchantAccountNumber();
    const refundCallbackUrl = this.getRefundCallbackUrl();
    const response = await this.http.post<HubtelEnvelope<HubtelRefundData>>(
      `${this.refundBaseUrl}/refund/${encodeURIComponent(merchantAccountNumber)}/order/${encodeURIComponent(input.providerReference)}`,
      refundCallbackUrl ? { callbackUrl: refundCallbackUrl } : {},
      this.buildConfig(),
    );

    const responseCode = this.resolveResponseCode(response);
    const status =
      responseCode === '0000' ? 'SUCCESS' : responseCode === '0001' ? 'PENDING' : 'FAILED';

    return {
      status,
      providerRefundId: this.resolveEnvelopeData(response).orderId || input.providerReference,
      raw: response,
      failureReason: status === 'FAILED' ? this.resolveMessage(response) : undefined,
    };
  }

  /**
   * Mobile money doesn't support merchant-initiated recurring charges the
   * same way card networks do, and this repo's launch provider is Paystack
   * (doc 13) — deliberately not implemented against an unverified API shape.
   */
  async chargeAuthorization(_input: ChargeAuthorizationInput): Promise<ChargeAuthorizationResult> {
    return {
      status: 'FAILED',
      failureReason: 'Saved-method charging not supported for this provider',
    };
  }

  /**
   * Not an HMAC, unlike Paystack (verifyWebhookSignature in
   * paystack-gateway.adapter.ts, HMAC-SHA512 over the raw body) and
   * Flutterwave (HMAC-SHA256) right next to this file. This is a deliberate
   * choice, not an oversight: Hubtel's checkout-callback API has no
   * documented signing mechanism at all — there is no per-request signature
   * for us to compute and compare, only a static shared value the caller is
   * expected to present back verbatim (confirmed against Hubtel's public
   * developer docs; ingest-webhook.use-case.ts's resolveWebhookSecret()
   * already notes this and reuses HUBTEL_API_KEY as the shared value, since
   * there's no dedicated webhook-secret config field either).
   *
   * Because this value travels unbound to the request body, it is
   * functionally a bearer credential, not a signature — treat a leak of it
   * exactly as seriously as a leaked HUBTEL_API_KEY (rotate both together).
   * The reason this is still an acceptable design, not an open hole: this
   * check is only ever used to decide whether to *look at* a webhook at all
   * (modules/billing's payment-webhooks.controller.ts). The actual
   * money-crediting decision never trusts anything the webhook body claims —
   * ProcessWebhookUseCase's own doc comment states it re-verifies status/
   * amount directly against Hubtel's authoritative status API
   * (verifyPayment() below, api-txnstatus.hubtel.com, called with our own
   * merchant Basic-Auth credentials) before any settlement happens. A forged
   * webhook using a leaked secret can at best trigger a wasted re-verify
   * call against a real payment reference — it cannot fabricate a paid
   * status Hubtel itself doesn't confirm.
   */
  verifyWebhookSignature(input: VerifyWebhookSignatureInput): boolean {
    const secret = input.secret?.trim();
    if (!secret) {
      return false;
    }

    const provided =
      this.getHeader(input.headers, 'x-hubtel-signature') ||
      this.getHeader(input.headers, 'x-signature');
    if (!provided) {
      return false;
    }

    return this.safeEqual(provided, secret);
  }

  parseWebhookEvent(input: ParseWebhookEventInput): ParsedWebhookEvent {
    const parsed = this.parseJson(input.rawBody);
    const data = this.resolveEnvelopeData(parsed);
    const normalizedData = this.normalizeWebhookData(parsed, data);
    const providerEventId = this.firstString(
      normalizedData.checkoutId,
      normalizedData.transactionId,
      normalizedData.orderId,
      normalizedData.clientReference,
    );

    return {
      eventType: this.resolveWebhookEventType(parsed, normalizedData),
      providerEventId,
      paymentReference:
        typeof normalizedData.clientReference === 'string' ? normalizedData.clientReference : undefined,
      data: normalizedData,
    };
  }

  private resolveWebhookEventType(
    envelope: HubtelEnvelope<Record<string, unknown>>,
    data: Record<string, unknown>,
  ): string {
    const responseCode = this.resolveResponseCode(envelope);
    const status = this.firstString(
      data.status,
      envelope.status,
      envelope.Status,
      data.paymentStatus,
    );

    if (data.orderId && !data.clientReference && !data.checkoutId) {
      if (responseCode === '0000') return 'refund.success';
      if (responseCode === '0001' || responseCode === '0005') return 'refund.pending';
      return 'refund.failed';
    }

    if (responseCode === '0000' && this.isPaidStatus(status)) return 'payment.success';
    if (responseCode === '0001' || responseCode === '0005' || this.isPendingStatus(status)) {
      return 'payment.pending';
    }
    return 'payment.failed';
  }

  private normalizeWebhookData(
    envelope: HubtelEnvelope<Record<string, unknown>>,
    data: Record<string, unknown>,
  ): Record<string, unknown> {
    const paymentDetails = this.asRecord(data.PaymentDetails) || this.asRecord(data.paymentDetails);

    return {
      ...data,
      responseCode: this.resolveResponseCode(envelope),
      message: this.resolveMessage(envelope),
      status: this.firstString(data.Status, data.status, envelope.Status, envelope.status),
      paymentStatus: this.firstString(data.Status, data.status),
      clientReference: this.firstString(data.ClientReference, data.clientReference),
      checkoutId: this.firstString(data.CheckoutId, data.checkoutId),
      transactionId: this.firstString(data.TransactionId, data.transactionId),
      externalTransactionId: this.firstString(
        data.ExternalTransactionId,
        data.externalTransactionId,
      ),
      orderId: this.firstString(data.OrderId, data.orderId),
      customerPhoneNumber: this.firstString(data.CustomerPhoneNumber, data.customerPhoneNumber),
      paymentMethod: this.firstString(
        data.PaymentMethod,
        data.paymentMethod,
        paymentDetails?.PaymentType,
        paymentDetails?.paymentType,
      ),
      channel: this.firstString(paymentDetails?.Channel, paymentDetails?.channel),
      paymentDetails: paymentDetails || undefined,
    };
  }

  private mapPaymentStatus(status?: string): VerifyGatewayPaymentResult['status'] {
    if (this.isPaidStatus(status)) return 'SUCCESS';
    if (this.isPendingStatus(status)) return 'PENDING';
    return 'FAILED';
  }

  private isPaidStatus(status?: string): boolean {
    return (status || '').trim().toLowerCase() === 'paid';
  }

  private isPendingStatus(status?: string): boolean {
    const normalized = (status || '').trim().toLowerCase();
    return normalized === 'unpaid' || normalized === 'pending' || normalized === 'processing';
  }

  private resolveStatus(
    envelope: HubtelEnvelope<HubtelStatusData>,
    data: HubtelStatusData,
  ): string | undefined {
    return this.firstString(data.status, data.Status, envelope.status, envelope.Status);
  }

  private resolveEnvelopeData<T extends Record<string, unknown>>(envelope: HubtelEnvelope<T>): T {
    const nested = envelope.data || envelope.Data;
    if (nested && typeof nested === 'object') {
      return nested;
    }

    return envelope as unknown as T;
  }

  private resolveDescription(input: InitializeGatewayPaymentInput): string {
    const metadata = this.asRecord(input.metadata);
    return (
      this.firstString(
        metadata?.description,
        metadata?.orderNumber,
        metadata?.orderId,
        input.reference,
      ) || `Payment for ${input.reference}`
    );
  }

  private resolveResponseCode(envelope: HubtelEnvelope<unknown>): string | undefined {
    return this.firstString(envelope.responseCode, envelope.ResponseCode);
  }

  private resolveMessage(envelope: HubtelEnvelope<unknown>): string | undefined {
    return this.firstString(envelope.message, envelope.Message);
  }

  private getMerchantAccountNumber(): string {
    const merchantAccountNumber = this.cfg.hubtel.merchantAccountNumber;
    if (!merchantAccountNumber) {
      throw new Error('HUBTEL_MERCHANT_ACCOUNT_NUMBER or HUBTEL_POS_SALES_ID must be configured');
    }
    return merchantAccountNumber;
  }

  private resolveCallbackUrl(): string {
    const callbackUrl = this.cfg.hubtel.callbackUrl || this.cfg.hubtel.webhookUrl;
    if (!callbackUrl) {
      throw new Error(
        'HUBTEL callback URL is required. Set HUBTEL_CALLBACK_URL or HUBTEL_WEBHOOK_URL.',
      );
    }
    return this.validateHttpsUrl(callbackUrl, 'HUBTEL callback URL');
  }

  private resolveReturnUrl(callbackUrl: string): string {
    const returnUrl = this.cfg.hubtel.returnUrl || callbackUrl;
    return this.validateHttpsUrl(returnUrl, 'HUBTEL return URL');
  }

  private resolveCancelUrl(callbackUrl: string): string {
    const cancelUrl =
      this.cfg.hubtel.cancelUrl || this.appendQueryParam(callbackUrl, 'status', 'cancelled');
    return this.validateHttpsUrl(cancelUrl, 'HUBTEL cancellation URL');
  }

  private appendQueryParam(urlString: string, key: string, value: string): string {
    const parsed = new URL(urlString);
    parsed.searchParams.set(key, value);
    return parsed.toString();
  }

  private validateHttpsUrl(value: string, name: string): string {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'https:') {
        throw new Error(`${name} must use HTTPS`);
      }
      return parsed.toString();
    } catch (err) {
      throw new Error(`${name} is invalid: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private getRefundCallbackUrl(): string {
    const url =
      this.cfg.hubtel.refundCallbackUrl ||
      this.cfg.hubtel.webhookUrl ||
      this.cfg.hubtel.callbackUrl;
    if (!url) {
      throw new Error('HUBTEL refund callback URL is not configured (HUBTEL_REFUND_CALLBACK_URL)');
    }
    return this.validateHttpsUrl(url, 'HUBTEL refund callback URL');
  }

  private buildConfig() {
    return {
      timeout: 15_000,
      retries: 2,
      headers: {
        Authorization: `Basic ${this.getBasicAuthToken()}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    };
  }

  private getBasicAuthToken(): string {
    const apiId = this.cfg.hubtel.apiId;
    const apiKey = this.cfg.hubtel.apiKey;

    if (!apiId || !apiKey) {
      throw new Error('HUBTEL_API_ID and HUBTEL_API_KEY must be configured');
    }

    return Buffer.from(`${apiId}:${apiKey}`).toString('base64');
  }

  private parseJson(rawBody: string): HubtelEnvelope<Record<string, unknown>> {
    try {
      return JSON.parse(rawBody) as HubtelEnvelope<Record<string, unknown>>;
    } catch {
      return {};
    }
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  }

  private firstString(...values: unknown[]): string | undefined {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
    }
    return undefined;
  }

  private getHeader(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string | undefined {
    const header = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
    return Array.isArray(header) ? header[0] : header;
  }

  private safeEqual(a: string, b: string): boolean {
    const left = Buffer.from(a, 'utf8');
    const right = Buffer.from(b, 'utf8');

    if (left.length !== right.length) {
      return false;
    }

    try {
      return timingSafeEqual(left, right);
    } catch {
      return false;
    }
  }
}
