import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, debounceTime, distinctUntilChanged, switchMap, catchError, of, combineLatest } from 'rxjs';
import { FilterOption, ColumnFilter, TableData, SortOption } from '../interfaces/filter.interface';
import { PaginationRequest, PaginationResponse, ServerFilter, ServerSort, LoadingState, FilterMetadata } from '../interfaces/pagination.interface';
import { ServerDataService } from './server-data.service';

@Injectable({
  providedIn: 'root'
})
export class ServerFilterService {
  private filtersSubject = new BehaviorSubject<Map<string, ColumnFilter>>(new Map());
  public filters$ = this.filtersSubject.asObservable();

  private sortSubject = new BehaviorSubject<SortOption>({ direction: null, column: '' });
  public sort$ = this.sortSubject.asObservable();

  private paginationSubject = new BehaviorSubject<{ page: number; pageSize: number }>({ page: 1, pageSize: 25 });
  public pagination$ = this.paginationSubject.asObservable();

  private loadingSubject = new BehaviorSubject<LoadingState>({ isLoading: false });
  public loading$ = this.loadingSubject.asObservable();

  private dataResponseSubject = new BehaviorSubject<PaginationResponse<TableData> | null>(null);
  public dataResponse$ = this.dataResponseSubject.asObservable();

  constructor(private serverDataService: ServerDataService) {
    // Set up automatic data fetching when filters, sort, or pagination changes
    combineLatest([
      this.filtersSubject,
      this.sortSubject,
      this.paginationSubject
    ]).pipe(
      debounceTime(300), // Debounce to avoid too many API calls
      distinctUntilChanged((prev, curr) => {
        // Custom comparison that properly handles Map objects
        const [prevFilters, prevSort, prevPagination] = prev;
        const [currFilters, currSort, currPagination] = curr;
        
        // Convert Map to sorted array of entries for proper comparison
        const prevFiltersArray = Array.from(prevFilters.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        const currFiltersArray = Array.from(currFilters.entries()).sort((a, b) => a[0].localeCompare(b[0]));
        
        return JSON.stringify([prevFiltersArray, prevSort, prevPagination]) === 
               JSON.stringify([currFiltersArray, currSort, currPagination]);
      }),
      switchMap(() => {
        this.loadingSubject.next({ isLoading: true });
        return this.fetchData();
      }),
      catchError(error => {
        console.error('Error fetching data:', error);
        this.loadingSubject.next({ isLoading: false, error: error.message || 'Failed to load data' });
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this.dataResponseSubject.next(response);
      }
      this.loadingSubject.next({ isLoading: false });
    });
  }

  initializeFilters(columns: string[]): Observable<Map<string, ColumnFilter>> {
    const filters = new Map<string, ColumnFilter>();
    
    columns.forEach(column => {
      filters.set(column, {
        column,
        type: 'text', // Will be determined dynamically
        options: [],
        searchText: '',
        showAll: true,
        autoApply: true,
        colorFilter: ''
      });
    });

    this.filtersSubject.next(filters);
    return this.filters$;
  }

  loadColumnOptions(column: string, searchText?: string): Observable<FilterOption[]> {
    return this.serverDataService.getColumnMetadata(column, searchText).pipe(
      switchMap((metadata: FilterMetadata) => {
        const options: FilterOption[] = metadata.distinctValues.map(value => ({
          value,
          label: this.formatValue(value),
          selected: true
        }));

        // Update the filter with new options
        const currentFilters = this.filtersSubject.value;
        const filter = currentFilters.get(column);
        if (filter) {
          filter.options = options;
          filter.type = this.detectColumnType(metadata.distinctValues);
          currentFilters.set(column, filter);
          this.filtersSubject.next(currentFilters);
        }

        return of(options);
      }),
      catchError(error => {
        console.error('Error loading column options:', error);
        return of([]);
      })
    );
  }

  updateFilter(column: string, updatedFilter: ColumnFilter) {
    console.log('ServerFilterService: Updating filter for column:', column, updatedFilter);
    const currentFilters = this.filtersSubject.value;
    
    // Create a deep copy to ensure proper change detection
    const filterCopy = {
      ...updatedFilter,
      options: updatedFilter.options.map(opt => ({ ...opt })),
      condition: updatedFilter.condition ? { ...updatedFilter.condition } : undefined
    };
    
    currentFilters.set(column, filterCopy);
    this.filtersSubject.next(new Map(currentFilters));
    this.resetToFirstPage();
  }

  updateSort(sortOption: SortOption) {
    this.sortSubject.next(sortOption);
    this.resetToFirstPage();
  }

  updatePagination(page: number, pageSize?: number) {
    const current = this.paginationSubject.value;
    this.paginationSubject.next({
      page,
      pageSize: pageSize || current.pageSize
    });
  }

  clearFilter(column: string) {
    const currentFilters = this.filtersSubject.value;
    const filter = currentFilters.get(column);
    
    if (filter) {
      filter.options.forEach(option => option.selected = true);
      filter.searchText = '';
      filter.showAll = true;
      filter.condition = undefined;
      filter.colorFilter = '';
      currentFilters.set(column, filter);
      this.filtersSubject.next(new Map(currentFilters));
      this.resetToFirstPage();
    }
  }

  clearAllFilters() {
    const currentFilters = this.filtersSubject.value;
    currentFilters.forEach(filter => {
      filter.options.forEach(option => option.selected = true);
      filter.searchText = '';
      filter.showAll = true;
      filter.condition = undefined;
      filter.colorFilter = '';
    });
    this.filtersSubject.next(new Map(currentFilters));
    this.sortSubject.next({ direction: null, column: '' });
    this.resetToFirstPage();
  }

  private resetToFirstPage() {
    const current = this.paginationSubject.value;
    if (current.page !== 1) {
      this.paginationSubject.next({ ...current, page: 1 });
    }
  }

  private fetchData(): Observable<PaginationResponse<TableData>> {
    const filters = this.filtersSubject.value;
    const sort = this.sortSubject.value;
    const pagination = this.paginationSubject.value;

    const request: PaginationRequest = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      filters: this.convertToServerFilters(filters),
      sort: sort.direction ? { column: sort.column, direction: sort.direction } : undefined
    };

    console.log('ServerFilterService: Fetching data with request:', request);
    return this.serverDataService.getPagedData(request);
  }

  private convertToServerFilters(filters: Map<string, ColumnFilter>): ServerFilter[] {
    const serverFilters: ServerFilter[] = [];

    filters.forEach(filter => {
      console.log('ServerFilterService: Processing filter for column:', filter.column, {
        optionsCount: filter.options.length,
        selectedCount: filter.options.filter(o => o.selected).length,
        showAll: filter.showAll,
        searchText: filter.searchText,
        condition: filter.condition
      });
      
      // Skip if no options are loaded yet
      if (filter.options.length === 0) {
        console.log('ServerFilterService: Skipping filter - no options loaded');
        return;
      }
      
      // Handle option-based filtering
      const selectedOptions = filter.options.filter(option => option.selected);
      const totalOptions = filter.options.length;
      
      console.log('ServerFilterService: Option analysis:', {
        selectedCount: selectedOptions.length,
        totalCount: totalOptions,
        showAll: filter.showAll
      });
      
      // Apply filter if showAll is false (indicating user has interacted with the filter)
      // OR if not all options are selected
      if (!filter.showAll || selectedOptions.length < totalOptions) {
        if (selectedOptions.length > 0) {
          const selectedValues = selectedOptions.map(option => option.value);
          
          console.log('ServerFilterService: Adding "in" filter for column:', filter.column, 'with values:', selectedValues);
          serverFilters.push({
            column: filter.column,
            operator: 'in',
            values: selectedValues
          });
        } else {
          // If no options are selected, create a filter that matches nothing
          console.log('ServerFilterService: No options selected, adding empty "in" filter');
          serverFilters.push({
            column: filter.column,
            operator: 'in',
            values: []
          });
        }
      }

      // Handle search text
      if (filter.searchText && filter.searchText.trim() !== '') {
        console.log('ServerFilterService: Adding "contains" filter for column:', filter.column, 'with text:', filter.searchText);
        serverFilters.push({
          column: filter.column,
          operator: 'contains',
          value: filter.searchText.trim()
        });
      }

      // Handle advanced conditions
      if (filter.condition && filter.condition.operator) {
        console.log('ServerFilterService: Adding condition filter for column:', filter.column, 'condition:', filter.condition);
        const serverFilter: ServerFilter = {
          column: filter.column,
          operator: this.mapConditionOperator(filter.condition.operator),
          value: filter.condition.value,
          value2: filter.condition.value2
        };
        serverFilters.push(serverFilter);
      }
    });

    console.log('ServerFilterService: Final server filters:', serverFilters);
    return serverFilters;
  }

  private mapConditionOperator(operator: string): ServerFilter['operator'] {
    const mapping: { [key: string]: ServerFilter['operator'] } = {
      'equals': 'equals',
      'notEquals': 'notEquals',
      'greaterThan': 'greaterThan',
      'greaterThanOrEqual': 'greaterThanOrEqual',
      'lessThan': 'lessThan',
      'lessThanOrEqual': 'lessThanOrEqual',
      'between': 'between',
      'blanks': 'isNull',
      'nonBlanks': 'isNotNull'
    };
    return mapping[operator] || 'equals';
  }

  private detectColumnType(values: any[]): 'text' | 'number' | 'date' | 'boolean' {
    const sample = values.find(v => v !== null && v !== undefined);
    
    if (typeof sample === 'boolean') return 'boolean';
    if (typeof sample === 'number') return 'number';
    if (sample instanceof Date || !isNaN(Date.parse(sample))) return 'date';
    return 'text';
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toLocaleDateString();
    return value.toString();
  }

  // Utility methods for components
  hasActiveFilters(): boolean {
    return Array.from(this.filtersSubject.value.values()).some(filter => {
      // Check if options filtering is active (showAll is false OR some options unselected)
      const hasOptionFiltering = filter.options.length > 0 && 
        (!filter.showAll || filter.options.some(option => !option.selected));
      
      // Check other filter types
      const hasCondition = !!filter.condition;
      const hasColorFilter = !!filter.colorFilter;
      const hasSearchText = !!filter.searchText && filter.searchText.trim() !== '';
      
      return hasOptionFiltering || hasCondition || hasColorFilter || hasSearchText;
    }) || !!this.sortSubject.value.direction;
  }

  getCurrentPage(): number {
    return this.paginationSubject.value.page;
  }

  getPageSize(): number {
    return this.paginationSubject.value.pageSize;
  }
}