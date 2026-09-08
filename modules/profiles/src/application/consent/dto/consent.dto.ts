import type { ConsentKind } from '@workspace/constants';

export interface RecordConsentInput {
  kind: ConsentKind;
  version: string;
  ipAddress?: string | null;
}

export interface RecordConsentForProfileInput {
  profileId: string;
  kind: ConsentKind;
  version: string;
  granted: boolean;
  ipAddress?: string | null;
}
