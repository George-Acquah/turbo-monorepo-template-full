import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { HeaderKey, HeaderValue } from './types/header.types';

/**
 * Typed decorator to extract specific headers from the request
 *
 * @example
 * ```typescript
 * @Get()
 * async getUser(@HeaderMeta(HeaderKey.DEVICE_ID) deviceId: string) {
 *   // deviceId is typed as string
 * }
 *
 * @Post()
 * async createItem(
 *   @HeaderMeta(HeaderKey.COMPANY_ID) companyId: string,
 *   @HeaderMeta(HeaderKey.DEVICE_ID) deviceId: string,
 * ) {
 *   // Both headers are properly typed
 * }
 * ```
 */
export const HeaderMeta = createParamDecorator(
  <T extends HeaderKey>(headerKey: T, ctx: ExecutionContext): HeaderValue<T> | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const headerValue = request.headers[headerKey];

    // Handle array values (should not happen with standard headers, but be safe)
    if (Array.isArray(headerValue)) {
      return headerValue[0] as HeaderValue<T>;
    }

    return headerValue as HeaderValue<T> | undefined;
  },
);

/**
 * Decorator to extract multiple headers at once
 * Returns an object with all requested headers
 *
 * @example
 * ```typescript
 * @Post()
 * async createItem(@Headers() headers: Record<HeaderKey, string | undefined>) {
 *   const deviceId = headers[HeaderKey.DEVICE_ID];
 *   const companyId = headers[HeaderKey.COMPANY_ID];
 * }
 * ```
 */
export const HeadersMeta = createParamDecorator(
  (headerKeys: HeaderKey[] | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();

    if (!headerKeys) {
      // Return all defined headers
      return Object.values(HeaderKey).reduce(
        (acc, key) => {
          const value = request.headers[key];
          acc[key] = Array.isArray(value) ? value[0] : value;
          return acc;
        },
        {} as Record<HeaderKey, string | undefined>,
      );
    }

    // Return only requested headers
    return headerKeys.reduce(
      (acc, key) => {
        const value = request.headers[key];
        acc[key] = Array.isArray(value) ? value[0] : value;
        return acc;
      },
      {} as Record<HeaderKey, string | undefined>,
    );
  },
);
