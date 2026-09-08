export interface CaptchaVerifyRequest {
  token: string;
  /** Client IP, forwarded to the provider's verify call when available. */
  remoteIp?: string;
}

export interface CaptchaVerifyResult {
  success: boolean;
  errorCodes?: string[];
}
