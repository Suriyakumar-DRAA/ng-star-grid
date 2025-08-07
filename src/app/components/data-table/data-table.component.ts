import { Component, OnInit, OnDestroy, HostListener, ViewEncapsulation, Input } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';
import { ThemeService } from '../../services/theme.service';
import { ColumnConfig, PaginationConfig, FilterPanelApplyEvent, FilterConfig, SortConfig, DataItem } from '../../interfaces/data-table.interface';
import { ColumnHeaderComponent } from '../column-header/column-header.component';
import { FilterPanelComponent } from '../filter-panel/filter-panel.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { DEFAULT_FORMATS } from './../../utils/constants'
import { GenericDataService } from '../../services/generic-data.service';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ColumnHeaderComponent,
    FilterPanelComponent,
    PaginationComponent,
  ],
  providers: [CurrencyPipe, DecimalPipe], // Provide pipes for use in the component

  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class DataTableComponent<T extends DataItem = DataItem> implements OnInit, OnDestroy {
  @Input() data: T[] = [];
  @Input() columns: ColumnConfig[] = [];

  visibleColumns = new Set<string>();
  displayColumns: ColumnConfig[] = [];
  totalRecords = 0;
  filteredRecords = 0;
  excelFiltersEnabled = true;
  searchTerm = '';
  private searchSubject = new Subject<string>();

  displayData: T[] = [];
  sortConfig: SortConfig | null = null;
  paginationConfig: PaginationConfig = {
    currentPage: 1,
    pageSize: 25,
    totalRecords: 0
  };

  activeFilters = new Map<string, FilterConfig>();
  activeFiltersArray: { column: string, config: FilterConfig }[] = [];

  // Filter Panel State
  filterPanelVisible = false;
  filterPanelColumn: string | null = null;
  filterPanelPosition = { top: 0, left: 0 };

  private destroy$ = new Subject<void>();

  constructor(
    private dataService: GenericDataService<T>,
    private themeService: ThemeService,
    private decimalPipe: DecimalPipe,
  ) { }

  ngOnInit(): void {
    this.themeService.initializeTheme();
    this.setupSubscriptions();
    this.initializeData();
  }

  ngOnChanges(): void {
    // Reinitialize when input data changes (important for API data loading)
    if (this.data && this.columns) {
      this.initializeData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeData(): void {
    console.log('Initializing data table with:', this.data.length, 'records and', this.columns.length, 'columns');
    console.log('First record:', this.data[0]);
    console.log('Columns:', this.columns.map(c => ({ key: c.key, label: c.label })));

    if (this.data.length > 0 && this.columns.length > 0) {
      // Initialize all columns as visible by default
      this.visibleColumns = new Set(this.columns.map(c => c.key));
      this.updateDisplayColumns();

      // Clear any existing filters and state
      this.dataService.clearAllFilters();
      this.searchTerm = '';
      this.dataService.setSearch('');

      // Initialize with new data
      this.dataService.initialize(this.data, this.columns);
      this.totalRecords = this.dataService.getTotalRecords();
    }
  }

  private updateDisplayColumns(): void {
    this.displayColumns = this.columns.filter(column => this.visibleColumns.has(column.key));
  }

  private setupSubscriptions(): void {
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged(), // Only emit if value actually changed
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.dataService.setSearch(searchTerm);
    });

    // Subscribe to paginated data
    this.dataService.paginatedData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.displayData = data;
      });

    // Subscribe to filtered data to get count
    this.dataService.filteredData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.filteredRecords = data.length;
      });

    // Subscribe to sort changes
    this.dataService.sort$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sort => {
        this.sortConfig = sort;
      });

    // Subscribe to pagination changes
    this.dataService.pagination$
      .pipe(takeUntil(this.destroy$))
      .subscribe(pagination => {
        this.paginationConfig = pagination;
      });

    // Subscribe to active filters
    this.dataService.getActiveFilters()
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.activeFilters = filters;
        this.activeFiltersArray = Array.from(filters.entries()).map(([column, config]) => ({ column, config }));
      });
  }

  onSort(event: { column: string, direction: 'asc' | 'desc' }): void {
    this.dataService.setSort(event.column, event.direction);
  }

  onFilter(event: { column: string, event: MouseEvent }): void {
    if (!this.excelFiltersEnabled) return;

    console.log('onFilter called with column:', event.column);

    const rect = (event.event.target as HTMLElement).getBoundingClientRect();
    const columnIndex = this.columns.findIndex(col => col.key === event.column);
    const isLastTwoColumns = columnIndex >= this.columns.length - 2;

    // Calculate position relative to viewport, not accounting for scroll
    // since we're using fixed positioning

    this.filterPanelPosition = {
      top: rect.bottom + 5,
      left: isLastTwoColumns
        ? rect.right - 320  // 320px is the filter panel width
        : rect.left
    };

    this.filterPanelColumn = event.column;
    console.log('Setting filterPanelColumn to:', this.filterPanelColumn);
    this.filterPanelVisible = true;
  }

  onFilterApply(filterData: FilterPanelApplyEvent): void {
    if (this.filterPanelColumn) {
      console.log('Filter apply called with:', filterData);
      this.dataService.setFilterWithConfig(this.filterPanelColumn, filterData);
    }
  }

  onFilterClose(): void {
    this.filterPanelVisible = false;
    this.filterPanelColumn = null;
  }

  hasActiveFilter(column: string): boolean {
    return this.activeFilters.has(column);
  }

  onPageChange(page: number): void {
    this.dataService.setPagination({ currentPage: page });
  }

  onPageSizeChange(pageSize: number): void {
    // If "All" is selected (pageSize = -1), set currentPage to 1
    this.dataService.setPagination({
      pageSize,
      currentPage: 1
    });
  }

  onGoToPage(page: number): void {
    this.dataService.setPagination({ currentPage: page });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  clearAllFilters(): void {
    this.dataService.clearAllFilters();
    this.searchTerm = '';
    this.dataService.setSearch('');
  }

  toggleExcelFilters(): void {
    if (!this.excelFiltersEnabled) {
      this.filterPanelVisible = false;
    }
  }

  removeFilter(column: string): void {
    this.dataService.setFilter(column, []);
  }

  getFilterLabel(column: string): string {
    const config = this.activeFilters.get(column);
    if (!config) return '';

    const columnLabel = this.columns.find(c => c.key === column)?.label || column;

    if (config.filterType === 'text' && config.textFilter) {
      const operatorLabel = this.getTextFilterOperatorLabel(config.textFilter.operator);
      return `${columnLabel}: ${operatorLabel} "${config.textFilter.value}"`;
    } else if (config.filterType === 'number' && config.numberFilter) {
      const operatorLabel = this.getNumberFilterOperatorLabel(config.numberFilter.operator);
      if (['top10', 'bottom10', 'aboveAverage', 'belowAverage'].includes(config.numberFilter.operator)) {
        return `${columnLabel}: ${operatorLabel}`;
      } else if (config.numberFilter.operator === 'between') {
        return `${columnLabel}: ${operatorLabel} ${config.numberFilter.value} and ${config.numberFilter.value2}`;
      } else {
        return `${columnLabel}: ${operatorLabel} ${config.numberFilter.value}`;
      }
    } else if (config.filterType === 'date' && config.dateFilter) {
      const operatorLabel = this.getDateFilterOperatorLabel(config.dateFilter.operator);
      if (['today', 'yesterday', 'tomorrow', 'thisWeek', 'lastWeek', 'nextWeek', 'thisMonth', 'lastMonth', 'nextMonth', 'thisQuarter', 'lastQuarter', 'nextQuarter', 'thisYear', 'lastYear', 'nextYear', 'yearToDate', 'allDatesInPeriod'].includes(config.dateFilter.operator)) {
        return `${columnLabel}: ${operatorLabel}`;
      } else if (config.dateFilter.operator === 'between') {
        return `${columnLabel}: ${operatorLabel} ${config.dateFilter.value} and ${config.dateFilter.value2}`;
      } else {
        return `${columnLabel}: ${operatorLabel} ${config.dateFilter.value}`;
      }
    } else {
      const count = config.values?.length || 0;
      return `${columnLabel} ${count} selected`;
    }
  }

  private getTextFilterOperatorLabel(operator: string): string {
    const operators: { [key: string]: string } = {
      'equals': 'Equals',
      'notEquals': 'Does Not Equal',
      'beginsWith': 'Begins with',
      'notBeginsWith': 'Does Not Begin with',
      'endsWith': 'Ends with',
      'notEndsWith': 'Does Not End with',
      'contains': 'Contains',
      'notContains': 'Does Not Contain'
    };
    return operators[operator] || operator;
  }

  private getNumberFilterOperatorLabel(operator: string): string {
    const operators: { [key: string]: string } = {
      'equals': 'Equals',
      'notEquals': 'Does Not Equal',
      'greaterThan': 'Greater than',
      'greaterThanOrEqual': 'Greater than or Equal to',
      'lessThan': 'Less than',
      'lessThanOrEqual': 'Less than or Equal to',
      'between': 'Between',
      'top10': 'Top 10',
      'bottom10': 'Bottom 10',
      'aboveAverage': 'Above Average',
      'belowAverage': 'Below Average'
    };
    return operators[operator] || operator;
  }

  private getDateFilterOperatorLabel(operator: string): string {
    const operators: { [key: string]: string } = {
      'equals': 'Equals',
      'before': 'Before',
      'after': 'After',
      'between': 'Between',
      'today': 'Today',
      'yesterday': 'Yesterday',
      'tomorrow': 'Tomorrow',
      'thisWeek': 'This Week',
      'lastWeek': 'Last Week',
      'nextWeek': 'Next Week',
      'thisMonth': 'This Month',
      'lastMonth': 'Last Month',
      'nextMonth': 'Next Month',
      'thisQuarter': 'This Quarter',
      'lastQuarter': 'Last Quarter',
      'nextQuarter': 'Next Quarter',
      'thisYear': 'This Year',
      'lastYear': 'Last Year',
      'nextYear': 'Next Year',
      'yearToDate': 'Year to Date',
      'allDatesInPeriod': 'All Dates in the Period'
    };
    return operators[operator] || operator;
  }

  /**
   * Formats the cell value based on its type and any specified format.
   * @param row The data row containing the value.
   * @param column The column configuration defining how to format the value.
   * @returns The formatted cell value as a string.
   */
  formatCellValue(row: any, column: any): string {
    const value = row[column.key];
    const type = column.type;
    const format = column.format || '';
    const symbol = column.symbol || '';
    const digit = column.digit || 0;
    if (value === null || value === undefined) {
      return '';
    }
    switch (type) {
      case 'date':
        const dateFormat = format ? format : DEFAULT_FORMATS.date;
        return formatDate(value, dateFormat, 'en-IN');
      case 'currency':
        const defaultFormat = format ? format : DEFAULT_FORMATS.currency;
        const [locale, currencyFormat] = this.getCurrencyFormat(defaultFormat);
        const options: Intl.NumberFormatOptions = {
          style: 'decimal',
          maximumFractionDigits: digit
        };
        if (symbol) {
          options['style'] = 'currency';
          options['currency'] = currencyFormat;
        }

        // Use Angular's CurrencyPipe
        return new Intl.NumberFormat(locale, options).format(value);
      // return this.currencyPipe.transform(value, currencyFormat, 'symbol', '1.0-0') || ''
      case 'number':
        if (digit > 0) {
          return this.decimalPipe.transform(value, `1.${digit}-${digit}`) || '';
        }
        return typeof value === 'number' ? value.toLocaleString() : value.toString();
      case 'boolean':
        return value ? '✓' : '✗';
      default:
        return value.toString();
    }
  }

  private getCurrencyFormat(format: string): [string, string] {
    switch (format) {
      case 'USD':
        return ['en-US', 'USD'];
      case 'INR':
        return ['en-IN', 'INR'];
      case 'EUR':
        return ['de-DE', 'EUR'];
      default:
        return ['', ''];
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.filter-panel') && !target.closest('[data-filter-trigger]')) {
      this.filterPanelVisible = false;
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    if (this.filterPanelVisible) {
      this.filterPanelVisible = false;
    }
  }

  @HostListener('document:scroll', ['$event'])
  onDocumentScroll(): void {
    if (this.filterPanelVisible) {
      this.filterPanelVisible = false;
    }
  }
  hasActiveFiltersOrSearch(): boolean {
    return this.activeFilters.size > 0 || this.searchTerm.trim() !== '';
  }

  hasActiveFilters(): boolean {
    // Check if any filters are actually active (not just empty filter configs)
    for (const [column, config] of this.activeFilters) {
      if (config.filterType === 'text' && config.textFilter) {
        return true;
      } else if (config.filterType === 'number' && config.numberFilter) {
        return true;
      } else if (config.filterType === 'date' && config.dateFilter) {
        return true;
      } else if (config.filterType === 'list' && config.values && config.values.length > 0) {
        return true;
      }
    }
    return false;
  }

  highlightSearchTerm(text: string): string {
    if (!this.searchTerm || !this.searchTerm.trim()) {
      return text;
    }

    const searchTerm = this.searchTerm.trim();

    // Simple case-insensitive replacement for better performance
    const lowerText = text.toLowerCase();
    const lowerSearch = searchTerm.toLowerCase();

    if (!lowerText.includes(lowerSearch)) {
      return text;
    }

    // Find all matches and replace them
    let result = '';
    let lastIndex = 0;
    let index = lowerText.indexOf(lowerSearch);

    while (index !== -1) {
      // Add text before match
      result += text.substring(lastIndex, index);
      // Add highlighted match
      result += `<mark class="search-highlight">${text.substring(index, index + searchTerm.length)}</mark>`;
      lastIndex = index + searchTerm.length;
      index = lowerText.indexOf(lowerSearch, lastIndex);
    }

    // Add remaining text
    result += text.substring(lastIndex);
    return result;
  }

  getSortDirection(column: string): 'asc' | 'desc' | null {
    if (this.sortConfig && this.sortConfig.column === column) {
      return this.sortConfig.direction;
    }
    return null;
  }

  onColumnVisibilityChange(event: { column: string, visible: boolean }): void {
    if (event.visible) {
      this.visibleColumns.add(event.column);
    } else {
      this.visibleColumns.delete(event.column);
    }
    this.updateDisplayColumns();
  }

}