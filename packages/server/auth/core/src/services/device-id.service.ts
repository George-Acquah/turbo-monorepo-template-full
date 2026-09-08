import { Injectable } from '@nestjs/common';
import { AppRequest } from '@workspace/types';
import * as crypto from 'node:crypto';

interface DeviceIdResponse {
  deviceId: string;

  /**
   * This is a hashed details of users device information
   */
  deviceInfo?: string;
}

@Injectable()
export class DeviceIdService {
  resolve(
    req?: AppRequest,
    fallback?: {
      deviceId?: string;
      userAgent?: string;
      ip?: string;
    },
  ): DeviceIdResponse {
    const headerId = req?.headers['x-device-id'];
    if (typeof headerId === 'string' && headerId.trim()) {
      return {
        deviceId: headerId.trim(),
        deviceInfo: '',
      };
    }

    const fallbackDeviceId = fallback?.deviceId?.trim();
    if (fallbackDeviceId) {
      return {
        deviceId: fallbackDeviceId,
        deviceInfo: '',
      };
    }

    const cookieId = (req?.cookies?.did as string | undefined)?.trim();
    if (cookieId)
      return {
        deviceId: cookieId,
        deviceInfo: '',
      };

    const ua = req?.headers['user-agent'] ?? fallback?.userAgent ?? '';
    const ip = req?.ip ?? fallback?.ip ?? '';

    return {
      deviceId: crypto.createHash('sha256').update(`${ua}:${ip}`).digest('hex'),
      deviceInfo: '',
    };
  }
}
