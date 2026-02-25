import { AccessTokenClaims } from "@repo/types/interfaces";

export abstract class TokenPort {
  abstract signAccess(claims: AccessTokenClaims): Promise<string>;
  abstract signRefresh(claims: AccessTokenClaims & { jti: string }): Promise<string>;
  abstract verifyAccess(token: string): Promise<AccessTokenClaims>;
  abstract verifyRefresh(token: string): Promise<AccessTokenClaims & { jti?: string }>;
}

export const TOKEN_PORT_TOKEN = Symbol('TOKEN_PORT_TOKEN');
