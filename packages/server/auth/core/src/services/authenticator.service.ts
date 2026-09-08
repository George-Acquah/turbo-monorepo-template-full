import { Injectable } from '@nestjs/common';
import { AuthenticatorPort } from '@workspace/ports';
import { OTP } from 'otplib';

@Injectable()
export class AuthenticatorService implements AuthenticatorPort {
  private readonly otp;

  constructor() {
    this.otp = new OTP();
  }
  generateSecret(length = 32): string {
    return this.otp.generateSecret(length);
  }

  async verifyToken(token: string, secret: string): Promise<boolean> {
    const result = await this.otp.verify({ token, secret });

    return result.valid;
  }
  keyuri(email: string, secret: string, issuer?: string): string {
    const resolvedIssuer = issuer || 'workspace';
    return this.otp.generateURI({
      secret,
      label: email,
      issuer: resolvedIssuer,
    });
  }
  // This service will handle TOTP generation and verification using otplib
  // It will be used by the SetupTwoFactorUseCase and VerifyAndEnableTwoFactorUseCase
}
