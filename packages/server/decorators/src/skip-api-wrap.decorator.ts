import { SetMetadata } from '@nestjs/common';

// I added this decorator to skip the global api response interceptor on scraping endpoints for Prometheus
export const SKIP_API_WRAP_KEY = 'skipApiWrap';
export const SkipApiWrap = () => SetMetadata(SKIP_API_WRAP_KEY, true);
