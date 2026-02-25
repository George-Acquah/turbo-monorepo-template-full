import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { PrismaService } from '@repo/database';

@Injectable()
export class EmailPasswordStrategy extends PassportStrategy(Strategy, 'email-password') {
  constructor(private readonly prisma: PrismaService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, _password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // const isValid = await this.hashingService.comparePassword(password, user.passwordHash);
    // if (!isValid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }
}
