/**
 * The resolved identity for a payment-link-token (`plt`) caller — guest
 * checkout, no User account backing it. Distinct from `UserContext`: forcing
 * a `profileId` through `UserContext`'s User-shaped fields would be a
 * semantic lie. Populated by `PaymentLinkOrJwtGuard` (`@workspace/auth-core`) when
 * the caller authenticates via a payment-link token rather than a JWT.
 */
export interface PaymentLinkIdentity {
  profileId: string;
  orderId?: string;
  enrolmentId?: string;
  source: 'payment-link';
}
