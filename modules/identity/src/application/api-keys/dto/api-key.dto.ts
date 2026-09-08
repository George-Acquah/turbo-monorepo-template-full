export interface CreateApiKeyUseCaseInput {
  apiClientId: string;
  name: string;
  scopes: string[];
  expiresAt?: Date | null;
}

export interface CreatedApiKey {
  id: string;
  apiClientId: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  /** Raw, unhashed key — returned only once, at creation time. */
  apiKey: string;
}
