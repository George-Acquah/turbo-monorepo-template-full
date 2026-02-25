export abstract class HashPort {
  abstract hashPassword(pw: string): Promise<string>;
  abstract comparePassword(pw: string, hash: string): Promise<boolean>;
  abstract hashToken(token: string): Promise<string>;
}
export const HASH_PORT_TOKEN = Symbol('HASH_PORT_TOKEN');
