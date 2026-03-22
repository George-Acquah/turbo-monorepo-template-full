import { SetMetadata } from '@nestjs/common';

export const SKIP_HTTP_RESPONSE_ENVELOPE_KEY = 'skipHttpResponseEnvelope';
export const SkipHttpResponseEnvelope = () =>
  SetMetadata(SKIP_HTTP_RESPONSE_ENVELOPE_KEY, true);
