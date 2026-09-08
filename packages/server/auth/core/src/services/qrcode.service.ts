import { Injectable } from '@nestjs/common';
import { toDataURL } from 'qrcode';

@Injectable()
export class QrCodeService {
  async generateQrCode(data: string): Promise<string> {
    return await toDataURL(data);
  }
}
