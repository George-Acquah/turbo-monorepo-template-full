export interface _IPaginationParams {
  limit?: number;
  page?: number;
  query?: string;
}

export interface _IDatesParams {
  startDate?: Date;
  endDate?: Date;
}

export interface _IFilterParams {
  sortColumn?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
}

export interface _IPaginationWithFilterParams extends _IPaginationParams, _IFilterParams {}

export interface _IPaginationWithDatesParams extends _IPaginationParams, _IDatesParams {}

export interface _IPaginationWithFilterAndDatesParams
  extends _IPaginationParams, _IFilterParams, _IDatesParams {}

export interface _IPaginationMeta {
  total: number;
  lastPage: number;
  currentPage: number;
  perPage: number;
  prev: number | null;
  next: number | null;
}
