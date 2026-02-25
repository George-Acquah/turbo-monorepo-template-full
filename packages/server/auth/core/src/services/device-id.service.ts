import { Injectable } from '@nestjs/common';
import { AppRequest } from '@repo/types';
import * as crypto from 'crypto';

@Injectable()
export class DeviceIdService {
  resolve(req: AppRequest): string {
    const headerId = req.headers['x-device-id'];
    if (typeof headerId === 'string' && headerId.trim()) {
      return headerId.trim();
    }

    const cookieId = (req.cookies?.did as string | undefined)?.trim();
    if (cookieId) return cookieId;

    const ua = req.headers['user-agent'] ?? '';
    const ip = req.ip ?? '';

    return crypto.createHash('sha256').update(`${ua}:${ip}`).digest('hex');
  }
}
