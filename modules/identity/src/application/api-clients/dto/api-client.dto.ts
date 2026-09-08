export interface CreateApiClientUseCaseInput {
  name: string;
  description?: string | null;
  createdByUserId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface CreatedApiClient {
  id: string;
  clientId: string;
  /** Raw, unhashed secret — returned only once, at creation time. */
  clientSecret: string;
  name: string;
}

export interface UpdateApiClientUseCaseInput {
  name?: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}
