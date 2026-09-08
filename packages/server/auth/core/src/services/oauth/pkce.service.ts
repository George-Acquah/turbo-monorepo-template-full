import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PkceService {
  generateVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  generateChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }
}
