
export type types = 'text' | 'email' | 'number' | 'boolean' | 'decimal' | 'currency' | 'date';
export type DateFormat = 'dd/MM/yyyy' | 'dd-MMM-yyyy' | 'HH:mm:ss a' | 'dd-MMM-yyyy hh:mm:ss a';
export type CurrencyFormat = 'USD' | 'INR' | 'EUR'; // add more as needed
export type DecimalFormat = '1.0-0' | '1.0-2' | '1.2-2' | '1.2-3'; // Angular decimal pipe format

export type ColumnConfig =
  | { key: string; label: string; type: 'text', sortable?: boolean; width?: string; }
  | { key: string; label: string; type: 'email', sortable?: boolean; width?: string; }
  | { key: string; label: string; type: 'number', sortable?: boolean; width?: string; }
  | { key: string; label: string; type: 'boolean', sortable?: boolean; width?: string; }
  | { key: string; label: string; type: 'decimal'; format?: DecimalFormat, sortable?: boolean; width?: string; }
  | { key: string; label: string; type: 'currency'; format?: CurrencyFormat, sortable?: boolean; width?: string; }
  | { key: string; label: string; type: 'date'; format?: DateFormat, sortable?: boolean; width?: string; };