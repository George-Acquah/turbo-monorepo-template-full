import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import {
  AUTH_REPO_TOKEN,
  HASH_PORT_TOKEN,
  type AuthRepositoryPort,
  type HashPort,
} from '@repo/ports';

@Injectable()
export class EmailPasswordStrategy extends PassportStrategy(Strategy, 'email-password') {
  constructor(
    @Inject(AUTH_REPO_TOKEN)
    private readonly repo: AuthRepositoryPort,
    @Inject(HASH_PORT_TOKEN)
    private readonly hash: HashPort,
  ) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string) {
    const user = await this.repo.findUserByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const isValid = await this.hash.comparePassword(password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }
}
