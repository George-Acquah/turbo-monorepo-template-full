import { Inject, Injectable, Optional } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import {
  AUDIT_COMMAND_PORT,
  AuditCommandPort,
  CONTEXT_TOKEN,
  ContextPort,
  HASH_PORT_TOKEN,
  USER_REPOSITORY_TOKEN,
  UserRepositoryPort,
  type HashPort,
} from '@workspace/ports';
import { AccountNotActiveException, InvalidCredentialsException } from '../constants/auth.errors';

@Injectable()
export class EmailPasswordStrategy extends PassportStrategy(Strategy, 'email-password') {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly repo: UserRepositoryPort,
    @Inject(HASH_PORT_TOKEN)
    private readonly hash: HashPort,
    @Inject(CONTEXT_TOKEN)
    private readonly context: ContextPort,
    // Generic auth infra has no natural import path into one bounded
    // context's module tree — @Optional() against AuditPersistenceModule's
    // @Global() AUDIT_COMMAND_PORT, no-ops if that module isn't in this
    // process. LocalAuthGuard rejects a bad attempt before the
    // controller/LoginUseCase ever runs, so LoginAttempt recording has to
    // live here or every failed login is invisible to the audit trail.
    @Optional()
    @Inject(AUDIT_COMMAND_PORT)
    private readonly auditCommand?: AuditCommandPort,
  ) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string) {
    const user = await this.repo.findByEmail(email);
    if (!user?.passwordHash) {
      this.recordAttempt(email, false, 'INVALID_CREDENTIALS');
      throw new InvalidCredentialsException();
    }

    const isValid = await this.hash.comparePassword(password, user.passwordHash);
    if (!isValid) {
      this.recordAttempt(email, false, 'INVALID_CREDENTIALS');
      throw new InvalidCredentialsException();
    }

    if (user.status !== 'ACTIVE') {
      this.recordAttempt(email, false, 'ACCOUNT_NOT_ACTIVE', user.id);
      throw new AccountNotActiveException();
    }

    // Populate the request context so downstream (the auth controller/use-case)
    // reads the authenticated principal from ContextPort, never from `req`.
    this.context.setUser({ id: user.id, email: user.email ?? '' });

    this.recordAttempt(email, true, undefined, user.id);

    return user;
  }

  /**
   * Fire-and-forget LoginAttempt write. workspace_audit.login_attempts is
   * create-only (see AuditPersistenceModule's doc comment). Never awaited
   * into the throw/return path above: a failed audit write must never turn a
   * successful login into a failed one, and must never delay the auth
   * response.
   */
  private recordAttempt(
    identifier: string,
    isSuccessful: boolean,
    failureReason?: string,
    userId?: string,
  ): void {
    void this.auditCommand
      ?.createLoginAttempt({
        identifier,
        isSuccessful,
        failureReason,
        userId,
        ipAddress: this.context.getIp(),
        userAgent: this.context.getUserAgent(),
        attemptedAt: new Date(),
      })
      .catch(() => undefined); // never let audit recording affect the auth flow
  }
}
