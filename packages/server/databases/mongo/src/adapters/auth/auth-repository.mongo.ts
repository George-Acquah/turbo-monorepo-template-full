import { Inject, Injectable } from '@nestjs/common';
import { AuthRepositoryPort, type AuthUser, type ProviderIdentity } from '@repo/ports';
import { type MongoDbClient } from '../../mongo-db-client.provider';
import { MONGO_DB_CLIENT_TOKEN } from '../../tokens/mongo.tokens';
import { generateId } from '../../utils/generate-id';

@Injectable()
export class AuthRepositoryMongoAdapter implements AuthRepositoryPort {
  constructor(@Inject(MONGO_DB_CLIENT_TOKEN) private readonly mongoDb: MongoDbClient) {}

  async findUserById(id: string): Promise<AuthUser | null> {
    const user = await this.mongoDb.users.user.findById(id).lean();
    return user ? this.mapUser(user) : null;
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.mongoDb.users.user.findOne({ email }).lean();
    return user ? this.mapUser(user) : null;
  }

  async findUserByProviderIdentity(identity: ProviderIdentity): Promise<AuthUser | null> {
    const link = await this.mongoDb.users.userAuthProvider
      .findOne({
        provider: identity.provider,
        provider_id: identity.providerId,
      })
      .lean();

    if (!link) return null;

    const user = await this.mongoDb.users.user.findById(link.user_id).lean();
    return user ? this.mapUser(user) : null;
  }

  async linkProviderIdentity(params: { userId: string; identity: ProviderIdentity }): Promise<void> {
    const { userId, identity } = params;

    await this.mongoDb.users.userAuthProvider.updateOne(
      {
        provider: identity.provider,
        provider_id: identity.providerId,
      },
      {
        $set: {
          user_id: userId,
          updated_at: new Date(),
        },
        $setOnInsert: {
          _id: generateId('uap'),
          provider: identity.provider,
          provider_id: identity.providerId,
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async upsertRefreshSession(params: {
    userId: string;
    deviceId: string;
    refreshTokenHash: string;
    jti: string;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void> {
    await this.mongoDb.users.userSession.updateOne(
      {
        user_id: params.userId,
        device_id: params.deviceId,
      },
      {
        $set: {
          refresh_token_hash: params.refreshTokenHash,
          jti: params.jti,
          expires_at: params.expiresAt,
          ip_address: params.ipAddress ?? null,
          user_agent: params.userAgent ?? null,
          device_info: `device:${params.deviceId}|jti:${params.jti}`,
          last_active_at: new Date(),
        },
        $setOnInsert: {
          _id: generateId('uss'),
          created_at: new Date(),
        },
      },
      { upsert: true },
    );
  }

  async getRefreshSession(params: {
    userId: string;
    deviceId: string;
  }): Promise<{ refreshTokenHash: string; jti: string; expiresAt: Date } | null> {
    const session = await this.mongoDb.users.userSession
      .findOne({
        user_id: params.userId,
        device_id: params.deviceId,
      })
      .lean();

    if (!session) return null;

    return {
      refreshTokenHash: session.refresh_token_hash,
      jti: session.jti,
      expiresAt: session.expires_at,
    };
  }

  async revokeRefreshSession(params: { userId: string; deviceId: string }): Promise<void> {
    await this.mongoDb.users.userSession.deleteOne({
      user_id: params.userId,
      device_id: params.deviceId,
    });
  }

  async recordLoginSuccess(params: { userId: string; ipAddress?: string | null }): Promise<void> {
    await this.mongoDb.users.user.updateOne(
      { _id: params.userId },
      {
        $set: {
          last_login_at: new Date(),
          last_login_ip: params.ipAddress ?? null,
          failed_login_count: 0,
          locked_until: null,
          status: 'ACTIVE',
          updated_at: new Date(),
        },
      },
    );
  }

  async recordLoginFailure(params: { userId: string }): Promise<void> {
    await this.mongoDb.users.user.updateOne(
      { _id: params.userId },
      {
        $inc: { failed_login_count: 1 },
        $set: { updated_at: new Date() },
      },
    );
  }

  private mapUser(u: {
    _id: string;
    email?: string | null;
    phone?: string | null;
    role: string;
    status: string;
    password_hash?: string | null;
    email_verified: boolean;
  }): AuthUser {
    return {
      id: u._id,
      email: u.email ?? null,
      phone: u.phone ?? null,
      role: String(u.role),
      status: String(u.status),
      passwordHash: u.password_hash ?? null,
      emailVerified: Boolean(u.email_verified),
    };
  }
}
