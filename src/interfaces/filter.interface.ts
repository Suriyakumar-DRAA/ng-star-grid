export interface FilterOption {
  value: any;
  label: string;
  selected: boolean;
}

export interface SortOption {
  direction: 'asc' | 'desc' | null;
  column: string;
}

export interface FilterCondition {
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'between' | 'top10' | 'bottom10' | 'aboveAverage' | 'belowAverage' | 'blanks' | 'nonBlanks';
  value?: any;
  value2?: any; // For between operator
}

export interface ColumnFilter {
  column: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  options: FilterOption[];
  searchText: string;
  showAll: boolean;
  condition?: FilterCondition;
  autoApply: boolean;
  colorFilter: string;
}

export interface TableData {
  [key: string]: any;
}

export interface TableColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  sortable?: boolean;
}