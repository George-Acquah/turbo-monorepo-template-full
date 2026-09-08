import { CaptchaVerifyRequest, CaptchaVerifyResult } from './captcha.interface';

export abstract class CaptchaVerifierPort {
  abstract verify(request: CaptchaVerifyRequest): Promise<CaptchaVerifyResult>;
}

export const CAPTCHA_VERIFIER_TOKEN = Symbol('CAPTCHA_VERIFIER_TOKEN');
