import { Injectable } from '@nestjs/common';
import { AuthRepositoryPort, type AuthUser, type ProviderIdentity } from '@repo/ports';
import { PrismaService } from '../../prisma.service';
import { generateId } from '../../utils/generate-id';

/**
 * Prisma adapter for AuthRepositoryPort.
 *
 * Boundaries:
 * - No Prisma types leak outside this adapter.
 * - Maps Auth ports to users schema:
 *   - users.User
 *   - users.UserAuthProvider (provider, providerId)
 *   - users.UserSession (token used as refreshTokenHash for now)
 */
@Injectable()
export class AuthRepositoryPrismaAdapter implements AuthRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------
  // Users
  // ----------------------------

  async findUserById(id: string): Promise<AuthUser | null> {
    const u = await this.prisma.db.user.findUnique({
      where: { id },
      select: this.userSelect(),
    });

    return u ? this.mapUser(u) : null;
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const u = await this.prisma.db.user.findFirst({
      where: { email },
      select: this.userSelect(),
    });

    return u ? this.mapUser(u) : null;
  }

  // ----------------------------
  // Provider identities
  // ----------------------------

  async findUserByProviderIdentity(identity: ProviderIdentity): Promise<AuthUser | null> {
    const link = await this.prisma.db.userAuthProvider.findFirst({
      where: {
        provider: identity.provider, // enum AuthProvider
        providerId: identity.providerId, // schema field name
      },
      select: {
        user: { select: this.userSelect() },
      },
    });

    return link?.user ? this.mapUser(link.user) : null;
  }

  async linkProviderIdentity(params: {
    userId: string;
    identity: ProviderIdentity;
  }): Promise<void> {
    const { userId, identity } = params;

    // schema has @@unique([provider, providerId])
    await this.prisma.db.userAuthProvider.upsert({
      where: {
        provider_providerId: {
          provider: identity.provider,
          providerId: identity.providerId,
        },
      },
      create: {
        id: generateId('uap'),
        userId,
        provider: identity.provider,
        providerId: identity.providerId,
        // NOTE: store tokenData/accessToken only if you *really* need it.
        // tokenData: identity.tokenData ?? undefined,
      },
      update: {
        userId,
      },
    });
  }

  // ----------------------------
  // Refresh sessions (rotation)
  // ----------------------------

  /**
   * Your current schema's UserSession has:
   * - token (String @unique)
   * - deviceInfo, ipAddress, userAgent, expiresAt
   *
   * For proper rotation you WANT:
   * - deviceId (unique per user)
   * - refreshTokenHash (not raw)
   * - jti
   *
   * Until we migrate, we store refreshTokenHash in `token`
   * and store deviceId inside deviceInfo (or derive a stable deviceId)
   * so you can ship the template now without scanning Redis keys.
   */
  async upsertRefreshSession(params: {
    userId: string;
    deviceId: string;
    refreshTokenHash: string;
    jti: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    const { userId, deviceId, refreshTokenHash, jti, expiresAt, ipAddress, userAgent } = params;

    // TEMP COMPAT:
    // - token = refreshTokenHash (unique)
    // - deviceInfo stores deviceId + jti (so we can find by userId+deviceId)
    // After migration, this becomes a clean @@unique([userId, deviceId]) upsert.
    const deviceInfo = this.encodeDeviceInfo({ deviceId, jti });

    // delete any prior session for same user+deviceId (no unique constraint yet)
    // This keeps 1 active refresh session per device.
    await this.prisma.db.userSession.deleteMany({
      where: {
        userId,
        deviceInfo: { startsWith: `device:${deviceId}|` },
      },
    });

    await this.prisma.db.userSession.create({
      data: {
        id: generateId('uss'),
        userId,
        refreshTokenHash: refreshTokenHash,
        deviceInfo,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        expiresAt,
        lastActiveAt: new Date(),
        jti,
        deviceId,
      },
    });
  }

  async getRefreshSession(params: {
    userId: string;
    deviceId: string;
  }): Promise<{ refreshTokenHash: string; jti: string; expiresAt: Date } | null> {
    const { userId, deviceId } = params;

    const s = await this.prisma.db.userSession.findFirst({
      where: {
        userId,
        deviceInfo: { startsWith: `device:${deviceId}|` },
      },
      select: {
        refreshTokenHash: true,
        deviceInfo: true,
        expiresAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!s) return null;

    const decoded = this.decodeDeviceInfo(s.deviceInfo ?? '');
    return {
      refreshTokenHash: s.refreshTokenHash, // token stores hash for now
      jti: decoded?.jti ?? '',
      expiresAt: s.expiresAt,
    };
  }

  async revokeRefreshSession(params: { userId: string; deviceId: string }): Promise<void> {
    const { userId, deviceId } = params;

    await this.prisma.db.userSession.deleteMany({
      where: {
        userId,
        deviceInfo: { startsWith: `device:${deviceId}|` },
      },
    });
  }

  // ----------------------------
  // Login tracking (optional but in your schema)
  // ----------------------------

  async recordLoginSuccess(params: { userId: string; ipAddress?: string | null }): Promise<void> {
    await this.prisma.db.user.update({
      where: { id: params.userId },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: params.ipAddress ?? null,
        failedLoginCount: 0,
        lockedUntil: null,
        status: 'ACTIVE',
      },
    });
  }

  async recordLoginFailure(params: { userId: string }): Promise<void> {
    // basic increment; lockout policy will live in core
    await this.prisma.db.user.update({
      where: { id: params.userId },
      data: {
        failedLoginCount: { increment: 1 },
      },
    });
  }

  // ----------------------------
  // Internals
  // ----------------------------

  private userSelect() {
    return {
      id: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      passwordHash: true,
      emailVerified: true,
      lockedUntil: true,
      failedLoginCount: true,
    } as const;
  }

  private mapUser(u: {
    id: string;
    email: string | null;
    phone: string | null;
    role: unknown;
    status: unknown;
    passwordHash: string | null;
    emailVerified: boolean;
    lockedUntil: Date | null;
    failedLoginCount: number;
  }): AuthUser {
    return {
      id: u.id,
      email: u.email,
      phone: u.phone,
      role: String(u.role),
      status: String(u.status),
      passwordHash: u.passwordHash,
      emailVerified: u.emailVerified,
      //   lockedUntil: u.lockedUntil,
      //   failedLoginCount: u.failedLoginCount,
    };
  }

  /**
   * TEMP: encode deviceId + jti into deviceInfo.
   * After schema migration, remove this and store as proper columns.
   */
  private encodeDeviceInfo(params: { deviceId: string; jti: string }): string {
    // stable prefix so we can query by startsWith without regex
    return `device:${params.deviceId}|jti:${params.jti}`;
  }

  private decodeDeviceInfo(deviceInfo: string): { deviceId: string; jti: string } | null {
    const m = /^device:([^|]+)\|jti:(.+)$/.exec(deviceInfo);
    if (!m) return null;
    return { deviceId: m[1] || '', jti: m[2] || '' };
  }
}
