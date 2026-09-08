import { jest } from '@jest/globals';
import { createMock } from '../jest/create-mock';

/**
 * Options for the generic request/context mock.
 *
 * The testing package deliberately does not import workspace's ContextPort from
 * `@workspace/ports`. That package also exports domain repository ports, so importing
 * it here would weaken the dependency boundary. Callers can request their own
 * structural type with `mockContext<ContextPort>()`.
 */
export interface MockContextOptions {
  readonly tenantId?: string;
  readonly organizationId?: string;
  readonly orgId?: string;
  readonly schoolId?: string;
  readonly userId?: string;
  readonly requestId?: string;
  readonly isSuperAdmin?: boolean;
}

/**
 * Structural shape for the cross-cutting context methods commonly used by
 * tenant-scoped tests. Method signatures stay intentionally generic so this
 * helper remains infrastructure-only and compatible with app-specific context
 * interfaces.
 */
export interface ContextMockShape {
  getUser(): unknown;
  setUser(user: unknown): void;
  setAuthMetadata(metadata: unknown): void;
  getAuthMetadata(): unknown;
  setRawRefreshToken(token: string): void;
  getRawRefreshToken(): string | undefined;
  setSessionId(sessionId: string): void;
  getSessionIdOptional(): string | undefined;
  getUserId(): string;
  getUserIdOptional(): string | undefined;
  getRequestId(): string;
  getMethod(): string | undefined;
  getUserAgent(): string | undefined;
  getDeviceId(): string | undefined;
  getRequest(): unknown;
  getIp(): string | undefined;
  getRoutePath(): string | undefined;
  getTenantId(): string | undefined;
  getTenantIdOrFail(): string;
  setTenantId(tenantId: string): void;
  getOrgId(): string | undefined;
  getOrgIdOrFail(): string;
  setOrgId(orgId: string): void;
  getOrganizationId(): string | undefined;
  getOrganizationIdOrFail(): string;
  setOrganizationId(organizationId: string): void;
  getSchoolId(): string | undefined;
  setSchoolId(schoolId: string): void;
  getTenantRecord(): unknown;
  setTenantRecord(tenant: unknown): void;
  getTenantContext(): unknown;
  setTenantContext(context: unknown): void;
  getTenantContextOrFail(): unknown;
  isTenancySkipped(): boolean;
  setSkipTenancy(skip: boolean): void;
  getActor(): unknown;
  setActor(actor: unknown): void;
  getTrace(): unknown;
  setTrace(trace: unknown): void;
  getClassRoomId(): string | undefined;
  setClassRoomId(classRoomId: string): void;
  isSuperAdmin(): boolean;
  getHierarchyFilter(): unknown;
  setHierarchyFilter(filter: unknown): void;
  getEffectiveOrganizationId(): string | undefined;
  setTransaction(engine: unknown, transaction: unknown): void;
  getTransaction(engine: unknown): unknown;
  clearTransaction(engine: unknown): void;
  isInContext(): boolean;
}

const DEFAULT_ORGANIZATION_ID = 'org-test-001';
const DEFAULT_USER_ID = 'user-test-001';
const DEFAULT_REQUEST_ID = 'req-test-001';

const CONTEXT_METHODS = [
  'getUser',
  'setUser',
  'setAuthMetadata',
  'getAuthMetadata',
  'setRawRefreshToken',
  'getRawRefreshToken',
  'setSessionId',
  'getSessionIdOptional',
  'getUserId',
  'getUserIdOptional',
  'getRequestId',
  'getMethod',
  'getUserAgent',
  'getDeviceId',
  'getRequest',
  'getIp',
  'getRoutePath',
  'getTenantId',
  'getTenantIdOrFail',
  'setTenantId',
  'getOrgId',
  'getOrgIdOrFail',
  'setOrgId',
  'getOrganizationId',
  'getOrganizationIdOrFail',
  'setOrganizationId',
  'getSchoolId',
  'setSchoolId',
  'getTenantRecord',
  'setTenantRecord',
  'getTenantContext',
  'setTenantContext',
  'getTenantContextOrFail',
  'isTenancySkipped',
  'setSkipTenancy',
  'getActor',
  'setActor',
  'getTrace',
  'setTrace',
  'getClassRoomId',
  'setClassRoomId',
  'isSuperAdmin',
  'getHierarchyFilter',
  'setHierarchyFilter',
  'getEffectiveOrganizationId',
  'setTransaction',
  'getTransaction',
  'clearTransaction',
  'isInContext',
] as const;

/**
 * Creates a pre-wired context mock with tenant/user defaults.
 *
 * Use the generic parameter in domain packages for precise typing:
 * `const context = mockContext<ContextPort>({ organizationId: 'org-1' });`
 */
export function mockContext<TContext extends ContextMockShape = ContextMockShape>(
  options: MockContextOptions = {},
): jest.Mocked<TContext> {
  const organizationId =
    options.tenantId ?? options.orgId ?? options.organizationId ?? DEFAULT_ORGANIZATION_ID;
  const schoolId = options.schoolId;
  const userId = options.userId ?? DEFAULT_USER_ID;
  const requestId = options.requestId ?? DEFAULT_REQUEST_ID;
  const superAdmin = options.isSuperAdmin ?? false;

  const mock = createMock<ContextMockShape>(CONTEXT_METHODS);

  mock.getTenantIdOrFail.mockReturnValue(organizationId);
  mock.getTenantId.mockReturnValue(organizationId);
  mock.getOrgIdOrFail.mockReturnValue(organizationId);
  mock.getOrgId.mockReturnValue(organizationId);
  mock.getOrganizationIdOrFail.mockReturnValue(organizationId);
  mock.getOrganizationId.mockReturnValue(organizationId);
  mock.getEffectiveOrganizationId.mockReturnValue(organizationId);
  mock.getSchoolId.mockReturnValue(schoolId);
  mock.getUserId.mockReturnValue(userId);
  mock.getUserIdOptional.mockReturnValue(userId);
  mock.getRequestId.mockReturnValue(requestId);
  mock.isInContext.mockReturnValue(true);
  mock.isSuperAdmin.mockReturnValue(superAdmin);
  mock.isTenancySkipped.mockReturnValue(false);
  mock.getActor.mockReturnValue({ type: 'user', userId });
  mock.getTrace.mockReturnValue({ requestId, correlationId: requestId });
  mock.getTenantContext.mockReturnValue({
    tenantId: organizationId,
    orgId: organizationId,
    organizationId,
    schoolId,
    userId,
    planTier: 'starter',
    dbStrategy: 'shared',
    region: 'test',
    featureFlags: {},
    requestId,
    correlationId: requestId,
    actor: { type: 'user', userId },
    trace: { requestId, correlationId: requestId },
  });
  mock.getTenantContextOrFail.mockReturnValue(mock.getTenantContext());

  return mock as unknown as jest.Mocked<TContext>;
}
