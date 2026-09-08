import * as argon2 from 'argon2';

/**
 * Hash a plaintext password using argon2id, matching the exact options
 * Argon2IdHashService (packages/server/auth/core) uses at login — so
 * seeded credentials work with the real auth flow.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}
