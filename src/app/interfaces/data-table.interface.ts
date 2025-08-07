
export type types = 'text' | 'email' | 'number' | 'boolean' | 'decimal' | 'currency' | 'date';
export type DateFormat = 'dd/MM/yyyy' | 'dd-MMM-yyyy' | 'HH:mm:ss a' | 'dd-MMM-yyyy hh:mm:ss a';
export type CurrencyFormat = 'USD' | 'INR' | 'EUR'; // add more as needed
export type DecimalFormat = '1.0-0' | '1.0-2' | '1.2-2' | '1.2-3'; // Angular decimal pipe format

export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  salary: number;
  active: boolean;
  joinDate: string;
  location: string;
}

export interface FilterOption {
  key: string;
  value: any;
  count: number;
  selected: boolean;
}

export type ColumnConfig =
  | { key: keyof Employee; label: string; type: 'text', sortable?: boolean; filterable?: boolean; width?: string; format?: string; }
  | { key: keyof Employee; label: string; type: 'number', digit?: number; sortable?: boolean; filterable?: boolean; width?: string; }
  | { key: keyof Employee; label: string; type: 'boolean', sortable?: boolean; filterable?: boolean; width?: string; }
  | { key: keyof Employee; label: string; type: 'currency'; symbol?: boolean; format?: CurrencyFormat, digit?: number; sortable?: boolean; filterable?: boolean; width?: string; }
  | { key: keyof Employee; label: string; type: 'date'; format?: DateFormat, sortable?: boolean; filterable?: boolean; width?: string; };

// export interface ColumnConfig {
//   key: keyof Employee;
//   label: string;
//   type: 'text' | 'number' | 'boolean' | 'date';
//   sortable: boolean;
//   filterable: boolean;
// }

export interface SortConfig {
  column: keyof Employee;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  column: keyof Employee;
  values: any[];
  searchTerm?: string;
  filterType?: 'list' | 'text' | 'number' | 'date';
  textFilter?: {
    operator: 'equals' | 'notEquals' | 'beginsWith' | 'notBeginsWith' | 'endsWith' | 'notEndsWith' | 'contains' | 'notContains';
    value: string;
  };
  numberFilter?: {
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between' | 'top10' | 'bottom10' | 'aboveAverage' | 'belowAverage';
    value?: number;
    value2?: number; // For 'between' operator
  };
  dateFilter?: {
    operator: 'equals' | 'before' | 'after' | 'between' | 'today' | 'yesterday' | 'tomorrow' | 'thisWeek' | 'lastWeek' | 'nextWeek' | 'thisMonth' | 'lastMonth' | 'nextMonth' | 'thisQuarter' | 'lastQuarter' | 'nextQuarter' | 'thisYear' | 'lastYear' | 'nextYear' | 'yearToDate' | 'allDatesInPeriod';
    value?: string; // ISO date string
    value2?: string; // For 'between' operator
  };
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
}

export interface FilterPanelApplyEvent {
  values?: any[];
  textFilter?: {
    operator: 'equals' | 'notEquals' | 'beginsWith' | 'notBeginsWith' | 'endsWith' | 'notEndsWith' | 'contains' | 'notContains';
    value: string;
  };
  numberFilter?: {
    operator: 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between' | 'top10' | 'bottom10' | 'aboveAverage' | 'belowAverage';
    value?: number;
    value2?: number;
  };
  dateFilter?: {
    operator: 'equals' | 'before' | 'after' | 'between' | 'today' | 'yesterday' | 'tomorrow' | 'thisWeek' | 'lastWeek' | 'nextWeek' | 'thisMonth' | 'lastMonth' | 'nextMonth' | 'thisQuarter' | 'lastQuarter' | 'nextQuarter' | 'thisYear' | 'lastYear' | 'nextYear' | 'yearToDate' | 'allDatesInPeriod';
    value?: string;
    value2?: string;
  };
}