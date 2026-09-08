// import { TwoFactorMethod } from '@workspace/constants';
import { AccessTokenClaims } from '@workspace/types/contracts';

type TwoFactorMethod = 'email' | 'phone' | 'totp';

export interface MfaTokenClaims {
  userId: string;
  methods: TwoFactorMethod[];
}
export abstract class TokenPort {
  abstract signAccess(claims: AccessTokenClaims): Promise<string>;
  abstract signRefresh(claims: AccessTokenClaims): Promise<string>;
  abstract verifyAccess(token: string): Promise<AccessTokenClaims>;
  abstract decodeToken(token: string): Promise<AccessTokenClaims>;
  abstract verifyRefresh(token: string): Promise<AccessTokenClaims>;
  abstract signMfa(claims: MfaTokenClaims, ttlMs: number): Promise<string>;
  abstract verifyMfa(token: string): Promise<MfaTokenClaims>;
}

export const TOKEN_PORT_TOKEN = Symbol('TOKEN_PORT_TOKEN');
