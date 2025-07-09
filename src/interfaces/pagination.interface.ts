export interface PaginationRequest {
  page: number;
  pageSize: number;
  filters: ServerFilter[];
  sort?: ServerSort;
}

export interface PaginationResponse<T> {
  data: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ServerFilter {
  column: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 
           'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 
           'between' | 'in' | 'notIn' | 'isNull' | 'isNotNull';
  value?: any;
  value2?: any; // For between operator
  values?: any[]; // For in/notIn operators
}

export interface ServerSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface FilterMetadata {
  column: string;
  distinctValues: any[];
  totalCount: number;
}