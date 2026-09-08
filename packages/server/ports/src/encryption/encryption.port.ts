/**
 * Secret/payload-at-rest encryption — deliberately no key/algorithm
 * parameters on the interface itself, so a future swap to a KMS-backed
 * implementation (AWS KMS envelope encryption, Vault, ...) is one new
 * adapter class, never a caller change. Today's only implementation is
 * `AesGcmEncryptionAdapter` (`@workspace/encryption`).
 */
export abstract class EncryptionPort {
  abstract encrypt(plaintext: string): string;
  abstract decrypt(ciphertext: string): string;
}
