import { ExternalProfile } from './oauth-provider.port';

/**
 * Per-organization SAML SSO groundwork — deliberately just an interface, not
 * an implementation. See docs/global-readiness/saml-sso-design-note.md for
 * why: real SAML needs a per-organization tenant/IdP-config model that does
 * not exist today (identity.prisma is explicitly single-tenant by design,
 * "no organization/school scoping" — not an oversight to silently reverse).
 * Defining this port doesn't require or imply that decision has been made;
 * it documents the shape a future adapter would follow, mirroring
 * OAuthProviderPort's role for Google/GitHub.
 *
 * Distinct from OAuthProviderPort rather than folded into it — SAML's flow
 * is assertion-based (IdP-initiated or SP-initiated redirect + POST-back),
 * not an authorization-code exchange with PKCE, so forcing it into the OAuth
 * shape would be a leaky abstraction. Both share ExternalProfile as the
 * common "verified external identity" output.
 */

export interface SamlServiceProviderMetadata {
  entityId: string;
  /** Assertion Consumer Service URL — where the IdP POSTs the SAML response back. */
  acsUrl: string;
  /** SP signing certificate, only if the IdP requires signed AuthnRequests. */
  certificate?: string;
}

export interface SamlAssertionValidationResult {
  profile: ExternalProfile;
  /** IdP session index, for a future Single Logout (SLO) flow — not implemented yet. */
  sessionIndex?: string;
}

export abstract class SamlProviderPort {
  abstract getServiceProviderMetadata(organizationId: string): Promise<SamlServiceProviderMetadata>;

  /** Builds the redirect URL that starts SP-initiated SSO against this org's IdP. */
  abstract buildAuthnRequestUrl(params: {
    organizationId: string;
    relayState: string;
  }): Promise<string>;

  /**
   * Validates a POSTed SAML assertion from the IdP's ACS callback. A real
   * implementation MUST verify the assertion's XML signature against the
   * organization's configured IdP certificate before trusting any claim in
   * it — an unsigned or signature-unverified assertion is not a valid
   * identity proof, full stop.
   */
  abstract validateAssertion(params: {
    organizationId: string;
    samlResponse: string;
  }): Promise<SamlAssertionValidationResult>;
}

export const SAML_PROVIDER_TOKEN = Symbol('SAML_PROVIDER_TOKEN');
