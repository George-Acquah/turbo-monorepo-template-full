/**
 * Custom header metadata keys for the application
 */
export enum HeaderKey {
  DEVICE_ID = 'x-device-id',
  CLIENT_VERSION = 'x-client-version',
  REQUEST_ID = 'x-request-id',
  USER_AGENT = 'user-agent',
}

/**
 * Type mapping for header values
 */
export type HeaderValue<T extends HeaderKey> = T extends HeaderKey.DEVICE_ID
  ? string
  : T extends HeaderKey.CLIENT_VERSION
    ? string
    : T extends HeaderKey.REQUEST_ID
      ? string
      : T extends HeaderKey.USER_AGENT
        ? string
        : string;
