export type DatabaseTx = unknown;

export interface DatabasePagination {
  skip?: number;
  take?: number;
}

export interface DatabaseTimeRange {
  startDate?: Date;
  endDate?: Date;
}
