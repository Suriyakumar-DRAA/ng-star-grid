import { TemplateRef } from "@angular/core";

export type types = 'text' | 'email' | 'number' | 'boolean' | 'decimal' | 'currency' | 'date';
export type DateFormat = 'dd/MM/yyyy' | 'dd-MMM-yyyy' | 'HH:mm:ss a' | 'dd-MMM-yyyy hh:mm:ss a';
export type CurrencyFormat = 'USD' | 'INR' | 'EUR'; // add more as needed
export type DecimalFormat = '1.0-0' | '1.0-2' | '1.2-2' | '1.2-3'; // Angular decimal pipe format
export interface LinkFormat {
  hrefKey: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
}

export interface HighlightColumn {
  type?: 'badge' | 'text';
  classMap?: { [key: string]: string }; // optional static map
  getClassFn?: (value: any, row?: any) => ('badge bg-success' | 'badge bg-warning text-dark' | 'badge bg-danger'); // dynamic class generator
}
export interface DataItem {
  [key: string]: any;
}

export interface TextFilter {
  operator: 'equals' | 'notEquals' | 'beginsWith' | 'notBeginsWith' | 'endsWith' | 'notEndsWith' | 'contains' | 'notContains';
  value: string;
}

export interface NumberFilter {
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between' | 'top10' | 'bottom10' | 'aboveAverage' | 'belowAverage';
  value?: number;
  value2?: number;
}

export interface DateFilter {
  operator: 'equals' | 'before' | 'after' | 'between' | 'today' | 'yesterday' | 'tomorrow' | 'thisWeek' | 'lastWeek' | 'nextWeek' | 'thisMonth' | 'lastMonth' | 'nextMonth' | 'thisQuarter' | 'lastQuarter' | 'nextQuarter' | 'thisYear' | 'lastYear' | 'nextYear' | 'yearToDate' | 'allDatesInPeriod';
  value?: string;
  value2?: string;
}

export interface FilterOption {
  key: string;
  value: any;
  count: number;
  selected: boolean;
}

interface BaseColumnConfig {
  key: string;
  label: string;
  class?: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  link?: LinkFormat;
  highlightColumn?: HighlightColumn;
  template?: TemplateRef<any>;
  displayDataFn?: (value: any, row?: any) => string;
}

interface TextColumnConfig extends BaseColumnConfig {
  type: 'text';
  format?: string;
}

interface NumberColumnConfig extends BaseColumnConfig {
  type: 'number';
  digit?: number;
}

interface BooleanColumnConfig extends BaseColumnConfig {
  type: 'boolean';
}

interface CurrencyColumnConfig extends BaseColumnConfig {
  type: 'currency';
  symbol?: boolean;
  format?: CurrencyFormat;
  digit?: number;
}

interface DateColumnConfig extends BaseColumnConfig {
  type: 'date';
  format?: DateFormat;
}

export type ColumnConfig =
  | TextColumnConfig
  | NumberColumnConfig
  | BooleanColumnConfig
  | CurrencyColumnConfig
  | DateColumnConfig;

export interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  column: string;
  values: any[];
  searchTerm?: string;
  filterType?: 'list' | 'text' | 'number' | 'date';
  textFilter?: TextFilter;
  numberFilter?: NumberFilter;
  dateFilter?: DateFilter;
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