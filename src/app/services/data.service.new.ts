import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

// Generic interfaces for the dynamic data service
export interface FilterOption {
  key: string;
  value: any;
  count: number;
  selected: boolean;
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

export interface FilterConfig<T = any> {
  column: keyof T;
  values: any[];
  searchTerm?: string;
  filterType?: 'list' | 'text' | 'number' | 'date';
  textFilter?: TextFilter;
  numberFilter?: NumberFilter;
  dateFilter?: DateFilter;
}

export interface SortConfig<T = any> {
  column: keyof T;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataService<T = any> {
  private originalData: T[] = [];
  private dataKeys: (keyof T)[] = [];
  
  private filtersSubject = new BehaviorSubject<Map<keyof T, FilterConfig<T>>>(new Map());
  private sortSubject = new BehaviorSubject<SortConfig<T> | null>(null);
  private paginationSubject = new BehaviorSubject<PaginationConfig>({
    currentPage: 1,
    pageSize: 25,
    totalRecords: 0
  });
  private searchSubject = new BehaviorSubject<string>('');

  public filters$ = this.filtersSubject.asObservable();
  public sort$ = this.sortSubject.asObservable();
  public pagination$ = this.paginationSubject.asObservable();
  public search$ = this.searchSubject.asObservable();

  /**
   * Initialize the service with data
   * @param data Array of objects to manage
   */
  setData(data: T[]): void {
    this.originalData = [...data];
    if (data.length > 0) {
      // Type assertion for Object.keys to work with generic types
      this.dataKeys = Object.keys(data[0] as Record<string, any>) as (keyof T)[];
    }
    this.resetPagination();
  }

  /**
   * Get the current data array
   */
  getData(): T[] {
    return [...this.originalData];
  }

  public filteredData$: Observable<T[]> = combineLatest([
    this.filters$,
    this.sort$,
    this.search$
  ]).pipe(
    map(([filters, sort, search]) => {
      let data = [...this.originalData];

      // Apply global search
      if (search && data.length > 0) {
        const searchLower = search.toLowerCase();
        const isNumericSearch = /^\d+$/.test(search);
        
        data = data.filter(item => {
          // Search through all properties of the object
          return this.dataKeys.some(key => {
            const value = (item as any)[key];
            if (value === null || value === undefined) return false;
            
            const valueStr = String(value).toLowerCase();
            
            // Handle different data types
            if (typeof value === 'number' && isNumericSearch) {
              return valueStr.includes(search);
            }
            
            if (typeof value === 'boolean') {
              return (value && (searchLower === 'true' || searchLower === 'active' || searchLower === '✓')) ||
                     (!value && (searchLower === 'false' || searchLower === 'inactive' || searchLower === '✗'));
            }
            
            return valueStr.includes(searchLower);
          });
        });
      }

      // Apply filters
      filters.forEach((filter, column) => {
        if (filter.filterType === 'text' && filter.textFilter) {
          data = this.applyTextFilter(data, column, filter.textFilter);
        } else if (filter.filterType === 'number' && filter.numberFilter) {
          data = this.applyNumberFilter(data, column, filter.numberFilter);
        } else if (filter.filterType === 'date' && filter.dateFilter) {
          data = this.applyDateFilter(data, column, filter.dateFilter);
        } else if (filter.values && filter.values.length > 0) {
          data = data.filter(item => filter.values.includes((item as any)[column]));
        }
      });

      // Handle top10/bottom10 filters after other filters
      filters.forEach((filter, column) => {
        if (filter.filterType === 'number' && filter.numberFilter) {
          if (filter.numberFilter.operator === 'top10') {
            data.sort((a, b) => Number((b as any)[column]) - Number((a as any)[column]));
            data = data.slice(0, 10);
          } else if (filter.numberFilter.operator === 'bottom10') {
            data.sort((a, b) => Number((a as any)[column]) - Number((b as any)[column]));
            data = data.slice(0, 10);
          }
        }
      });

      // Apply sorting
      if (sort) {
        data.sort((a, b) => {
          const aVal = (a as any)[sort.column];
          const bVal = (b as any)[sort.column];
          
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          if (aVal > bVal) comparison = 1;
          
          return sort.direction === 'desc' ? -comparison : comparison;
        });
      }

      // Update pagination total
      const currentPagination = this.paginationSubject.value;
      this.paginationSubject.next({
        ...currentPagination,
        totalRecords: data.length
      });

      return data;
    })
  );

  public paginatedData$: Observable<T[]> = combineLatest([
    this.filteredData$,
    this.pagination$
  ]).pipe(
    map(([data, pagination]) => {
      if (pagination.pageSize === -1) {
        return data;
      }
      
      const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      return data.slice(startIndex, endIndex);
    })
  );

  private applyTextFilter(data: T[], column: keyof T, textFilter: TextFilter): T[] {
    return data.filter(item => {
      const value = String((item as any)[column]).toLowerCase();
      const filterValue = textFilter.value.toLowerCase();
      
      switch (textFilter.operator) {
        case 'equals': return value === filterValue;
        case 'notEquals': return value !== filterValue;
        case 'beginsWith': return value.startsWith(filterValue);
        case 'notBeginsWith': return !value.startsWith(filterValue);
        case 'endsWith': return value.endsWith(filterValue);
        case 'notEndsWith': return !value.endsWith(filterValue);
        case 'contains': return value.includes(filterValue);
        case 'notContains': return !value.includes(filterValue);
        default: return true;
      }
    });
  }

  private applyNumberFilter(data: T[], column: keyof T, numberFilter: NumberFilter): T[] {
    return data.filter(item => {
      const value = Number((item as any)[column]);
      const filterValue = numberFilter.value;
      const filterValue2 = numberFilter.value2;
      
      switch (numberFilter.operator) {
        case 'equals': return value === filterValue!;
        case 'notEquals': return value !== filterValue!;
        case 'greaterThan': return value > filterValue!;
        case 'greaterThanOrEqual': return value >= filterValue!;
        case 'lessThan': return value < filterValue!;
        case 'lessThanOrEqual': return value <= filterValue!;
        case 'between':
          return filterValue !== undefined && filterValue2 !== undefined && 
                 value >= filterValue && value <= filterValue2;
        case 'aboveAverage':
          const avg = this.originalData.reduce((sum, item) => sum + Number((item as any)[column]), 0) / this.originalData.length;
          return value > avg;
        case 'belowAverage':
          const avgBelow = this.originalData.reduce((sum, item) => sum + Number((item as any)[column]), 0) / this.originalData.length;
          return value < avgBelow;
        case 'top10':
        case 'bottom10':
          return true; // Handled separately
        default: return true;
      }
    });
  }

  private applyDateFilter(data: T[], column: keyof T, dateFilter: DateFilter): T[] {
    return data.filter(item => {
      const itemDate = new Date((item as any)[column] as string);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (dateFilter.operator) {
        case 'equals':
          if (!dateFilter.value) return false;
          const targetDate = new Date(dateFilter.value);
          targetDate.setHours(0, 0, 0, 0);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === targetDate.getTime();
          
        case 'before':
          if (!dateFilter.value) return false;
          const beforeDate = new Date(dateFilter.value);
          beforeDate.setHours(0, 0, 0, 0);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() < beforeDate.getTime();
          
        case 'after':
          if (!dateFilter.value) return false;
          const afterDate = new Date(dateFilter.value);
          afterDate.setHours(23, 59, 59, 999);
          return itemDate.getTime() > afterDate.getTime();
          
        case 'between':
          if (!dateFilter.value || !dateFilter.value2) return false;
          const startDate = new Date(dateFilter.value);
          const endDate = new Date(dateFilter.value2);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() >= startDate.getTime() && itemDate.getTime() <= endDate.getTime();
          
        case 'today':
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === today.getTime();
          
        case 'yesterday':
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === yesterday.getTime();
          
        case 'tomorrow':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() === tomorrow.getTime();
          
        case 'thisWeek':
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() >= startOfWeek.getTime() && itemDate.getTime() <= endOfWeek.getTime();
          
        case 'thisMonth':
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          endOfMonth.setHours(23, 59, 59, 999);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() >= startOfMonth.getTime() && itemDate.getTime() <= endOfMonth.getTime();
          
        case 'thisYear':
          const yearStart = new Date(today.getFullYear(), 0, 1);
          const yearEnd = new Date(today.getFullYear(), 11, 31);
          yearEnd.setHours(23, 59, 59, 999);
          itemDate.setHours(0, 0, 0, 0);
          return itemDate.getTime() >= yearStart.getTime() && itemDate.getTime() <= yearEnd.getTime();
          
        // Add other date operators as needed
        default: return true;
      }
    });
  }

  getFilterOptions(column: keyof T): Observable<FilterOption[]> {
    return new Observable<FilterOption[]>(observer => {
      setTimeout(() => {
        let dataToAnalyze = [...this.originalData];
        
        // Apply all filters except the one for the column we're currently filtering
        const currentFilters = this.filtersSubject.value;
        const searchTerm = this.searchSubject.value;
        
        // Apply global search
        if (searchTerm) {
          dataToAnalyze = dataToAnalyze.filter(item =>
            this.dataKeys.some(key => {
              const value = (item as any)[key];
              return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
            })
          );
        }
        
        // Apply all other filters (excluding the current column)
        currentFilters.forEach((filter, filterColumn) => {
          if (filterColumn === column) return; // Skip the column we're filtering on
          
          if (filter.filterType === 'text' && filter.textFilter) {
            dataToAnalyze = this.applyTextFilter(dataToAnalyze, filterColumn, filter.textFilter);
          } else if (filter.filterType === 'number' && filter.numberFilter) {
            dataToAnalyze = this.applyNumberFilter(dataToAnalyze, filterColumn, filter.numberFilter);
          } else if (filter.filterType === 'date' && filter.dateFilter) {
            dataToAnalyze = this.applyDateFilter(dataToAnalyze, filterColumn, filter.dateFilter);
          } else if (filter.values && filter.values.length > 0) {
            dataToAnalyze = dataToAnalyze.filter(item => filter.values.includes((item as any)[filterColumn]));
          }
        });
        
        // Count occurrences
        const valueCountMap = new Map<any, number>();
        for (const item of dataToAnalyze) {
          const value = (item as any)[column];
          valueCountMap.set(value, (valueCountMap.get(value) || 0) + 1);
        }
        
        // Get current active filters
        const currentFilter = currentFilters.get(column);
        
        // Create filter options
        const options = Array.from(valueCountMap.entries()).map(([value, count]) => ({
          key: String(value),
          value: value,
          count: count,
          selected: currentFilter ? currentFilter.values.includes(value) : false
        }));
        
        observer.next(options);
        observer.complete();
      }, 0);
    });
  }

  setFilter(column: keyof T, values: any[]): void {
    const currentFilters = new Map(this.filtersSubject.value);
    if (values.length === 0) {
      currentFilters.delete(column);
    } else {
      currentFilters.set(column, { column, values, filterType: 'list' });
    }
    this.filtersSubject.next(currentFilters);
    this.resetPagination();
  }

  setFilterWithConfig(column: keyof T, filterData: any): void {
    const currentFilters = new Map(this.filtersSubject.value);
    
    if (filterData.textFilter) {
      currentFilters.set(column, { 
        column, 
        values: [], 
        filterType: 'text',
        textFilter: filterData.textFilter
      });
    } else if (filterData.numberFilter) {
      currentFilters.set(column, { 
        column, 
        values: [], 
        filterType: 'number',
        numberFilter: filterData.numberFilter
      });
    } else if (filterData.dateFilter) {
      currentFilters.set(column, { 
        column, 
        values: [], 
        filterType: 'date',
        dateFilter: filterData.dateFilter
      });
    } else if (filterData.values && filterData.values.length > 0) {
      currentFilters.set(column, { 
        column, 
        values: filterData.values,
        filterType: 'list'
      });
    } else {
      currentFilters.delete(column);
    }
    
    this.filtersSubject.next(currentFilters);
    this.resetPagination();
  }
  
  clearAllFilters(): void {
    this.filtersSubject.next(new Map());
    this.resetPagination();
  }

  setSort(column: keyof T, direction: 'asc' | 'desc'): void {
    this.sortSubject.next({ column, direction });
  }

  clearSort(): void {
    this.sortSubject.next(null);
  }

  setPagination(config: Partial<PaginationConfig>): void {
    const current = this.paginationSubject.value;
    this.paginationSubject.next({ ...current, ...config });
  }

  setSearch(term: string): void {
    this.searchSubject.next(term);
    this.resetPagination();
  }

  private resetPagination(): void {
    const current = this.paginationSubject.value;
    this.paginationSubject.next({ ...current, currentPage: 1 });
  }

  getActiveFilters(): Observable<Map<keyof T, FilterConfig<T>>> {
    return this.filters$.pipe(
      map(filters => {
        const activeFilters = new Map<keyof T, FilterConfig<T>>();
        for (const [column, config] of filters) {
          // Check if filter is actually active based on its type
          if (config.filterType === 'text' && config.textFilter) {
            activeFilters.set(column, config);
          } else if (config.filterType === 'number' && config.numberFilter) {
            activeFilters.set(column, config);
          } else if (config.filterType === 'date' && config.dateFilter) {
            activeFilters.set(column, config);
          } else if (config.filterType === 'list' && config.values && config.values.length > 0) {
            activeFilters.set(column, config);
          }
        }
        return activeFilters;
      })
    );
  }

  getTotalRecords(): number {
    return this.originalData.length;
  }

  /**
   * Get all available columns/keys from the data
   */
  getDataKeys(): (keyof T)[] {
    return [...this.dataKeys];
  }

  /**
   * Generate sample data for testing (can be removed in production)
   */
  generateSampleEmployeeData(): any[] {
    const departments = ['Marketing', 'Design', 'Operations', 'Legal', 'IT', 'HR', 'Finance', 'Customer Service', 'Engineering'];
    const locations = ['Memphis', 'Oklahoma City', 'Miami', 'Boston', 'Charlotte', 'Indianapolis', 'Milwaukee', 'Baltimore', 'El Paso', 'Omaha', 'Las Vegas', 'Chicago'];
    const firstNames = ['Jason', 'Andrea', 'Helen', 'Ashley', 'Larry', 'Michael', 'Edward', 'Rachel', 'Heather', 'Stephen', 'Janet'];
    const lastNames = ['Ramirez', 'Nguyen', 'White', 'Phillips', 'Brown', 'Green', 'Rogers', 'Reyes', 'Richardson', 'Allen', 'Ortiz', 'Perez', 'Garcia'];

    const data: any[] = [];
    for (let i = 1; i <= 10000; i++) {
      data.push({
        id: i,
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        email: `employee${i}@company.com`,
        department: departments[Math.floor(Math.random() * departments.length)],
        salary: Math.floor(Math.random() * 100000) + 40000,
        active: Math.random() > 0.1,
        joinDate: this.randomDate(new Date(2020, 0, 1), new Date()).toISOString().split('T')[0],
        location: locations[Math.floor(Math.random() * locations.length)]
      });
    }
    return data;
  }

  private randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }
}
