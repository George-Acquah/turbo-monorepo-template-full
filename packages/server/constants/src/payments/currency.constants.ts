import { GatewayProvider } from './gateway.constants';

// ISO 4217 codes Workspace can price/charge in today. Deliberately a small,
// explicit set rather than "any 3-letter string" (see
// docs/global-readiness/evaluation-2026-08-12.md §1.1) — extend this list
// only when a real market/gateway need exists, not speculatively.
export const Currency = {
  GHS: 'GHS',
  USD: 'USD',
  GBP: 'GBP',
  EUR: 'EUR',
  NGN: 'NGN',
  ZAR: 'ZAR',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export const DEFAULT_CURRENCY: Currency = Currency.GHS;

// Hubtel has no currency field in its verify response
// (packages/server/ports/src/payments/payment-gateway.port.ts:38-40,
// hubtel-gateway.adapter.ts:157) — it is structurally GHS-only, not a
// configuration choice, and that part is verified against the adapter code.
//
// Paystack/Flutterwave's lists below are NOT verified against the actual
// merchant account — a Ghana-registered Paystack business is often
// GHS-only regardless of what the API generically accepts, and this can
// only be confirmed in the Paystack/Flutterwave dashboard for this specific
// account, not from the codebase. Treat USD/GBP/EUR/NGN/ZAR here as "the
// gateway's API doesn't reject these," not "this merchant account can
// actually settle in them" — confirm in each dashboard before relying on
// this list for a real non-GHS charge.
// MANUAL/OTHER/mobile-money rails are Ghana-only in practice today, so they
// stay GHS-only until a real non-Ghana rail is integrated.
export const GATEWAY_SUPPORTED_CURRENCIES: Record<GatewayProvider, readonly Currency[]> = {
  [GatewayProvider.PAYSTACK]: [Currency.GHS, Currency.USD, Currency.NGN, Currency.ZAR],
  [GatewayProvider.FLUTTERWAVE]: [Currency.GHS, Currency.USD, Currency.GBP, Currency.EUR, Currency.NGN, Currency.ZAR],
  [GatewayProvider.HUBTEL]: [Currency.GHS],
  [GatewayProvider.MTN_MOMO]: [Currency.GHS],
  [GatewayProvider.VODAFONE_CASH]: [Currency.GHS],
  [GatewayProvider.AIRTEL_TIGO]: [Currency.GHS],
  [GatewayProvider.MANUAL]: Object.values(Currency),
  [GatewayProvider.OTHER]: Object.values(Currency),
};

export function isCurrencySupportedByGateway(currency: Currency, gateway: GatewayProvider): boolean {
  return GATEWAY_SUPPORTED_CURRENCIES[gateway].includes(currency);
}
