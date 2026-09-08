// Components
export * from './components/pagination';
export * from './components/infinite-scroll-trigger';

// Headless hook — unified page-number / infinite-scroll abstraction
export { usePagination } from './hooks/use-pagination';
export type {
  UsePaginationOptions,
  UsePaginationResult,
  UsePagePaginationOptions,
  UsePagePaginationResult,
  UseInfinitePaginationOptions,
  UseInfinitePaginationResult,
} from './hooks/use-pagination';

// Framework-agnostic utility, reusable outside this package's own components
export { getPageWindow } from './utils/page-window';
export type { PageWindowItem } from './utils/page-window';
