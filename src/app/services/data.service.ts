import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Employee, FilterConfig, SortConfig, PaginationConfig, FilterOption } from '../interfaces/data-table.interface';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly originalData: Employee[] = this.generateSampleData();
  
  private filtersSubject = new BehaviorSubject<Map<keyof Employee, FilterConfig>>(new Map());
  private sortSubject = new BehaviorSubject<SortConfig | null>(null);
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

  public filteredData$: Observable<Employee[]> = combineLatest([
    this.filters$,
    this.sort$,
    this.search$
  ]).pipe(
    map(([filters, sort, search]) => {
      let data = [...this.originalData];

      // Apply global search
      if (search) {
        const searchLower = search.toLowerCase();
        
        // Pre-compile search patterns for better performance
        const isNumericSearch = /^\d+$/.test(search);
        
        data = data.filter(item => {
          // Check each field individually for better performance
          const { id, name, email, department, salary, active, joinDate, location } = item;
          
          // Quick numeric search for ID and salary
          if (isNumericSearch) {
            if (id.toString().includes(search) || salary.toString().includes(search)) {
              return true;
            }
          }
          
          // Text fields search
          if (name.toLowerCase().includes(searchLower) ||
              email.toLowerCase().includes(searchLower) ||
              department.toLowerCase().includes(searchLower) ||
              location.toLowerCase().includes(searchLower)) {
            return true;
          }
          
          // Boolean field search
          if ((active && (searchLower === 'true' || searchLower === 'active' || searchLower === '✓')) ||
              (!active && (searchLower === 'false' || searchLower === 'inactive' || searchLower === '✗'))) {
            return true;
          }
          
          return false;
        });
      }

      // Apply filters
      filters.forEach((filter, column) => {
       if (filter.filterType === 'text' && filter.textFilter) {
         // Apply text filter
         data = data.filter(item => {
           const value = String(item[column]).toLowerCase();
           const filterValue = filter.textFilter!.value.toLowerCase();
           
           switch (filter.textFilter!.operator) {
             case 'equals':
               return value === filterValue;
             case 'notEquals':
               return value !== filterValue;
             case 'beginsWith':
               return value.startsWith(filterValue);
             case 'notBeginsWith':
               return !value.startsWith(filterValue);
             case 'endsWith':
               return value.endsWith(filterValue);
             case 'notEndsWith':
               return !value.endsWith(filterValue);
             case 'contains':
               return value.includes(filterValue);
             case 'notContains':
               return !value.includes(filterValue);
             default:
               return true;
           }
         });
        } else if (filter.filterType === 'number' && filter.numberFilter) {
          // Apply number filter
          data = data.filter(item => {
            const value = Number(item[column]);
            console.log('Comparing value:', value, 'with filter:', filter.numberFilter);
            const filterValue = filter.numberFilter!.value;
            const filterValue2 = filter.numberFilter!.value2;
            
            switch (filter.numberFilter!.operator) {
              case 'equals':
                return value === filterValue!;
              case 'notEquals':
                return value !== filterValue!;
              case 'greaterThan':
                return value > filterValue!;
              case 'greaterThanOrEqual':
                return value >= filterValue!;
              case 'lessThan':
                return value < filterValue!;
              case 'lessThanOrEqual':
                return value <= filterValue!;
              case 'between':
                return filterValue !== undefined && filterValue2 !== undefined && 
                       value >= filterValue && value <= filterValue2;
              case 'aboveAverage':
                const avg = this.originalData.reduce((sum, item) => sum + Number(item[column]), 0) / this.originalData.length;
                return value > avg;
              case 'belowAverage':
                const avgBelow = this.originalData.reduce((sum, item) => sum + Number(item[column]), 0) / this.originalData.length;
                return value < avgBelow;
              case 'top10':
              case 'bottom10':
                // These are handled separately after this loop
                return true;
              default:
                return true;
            }
          });
       } else if (filter.filterType === 'date' && filter.dateFilter) {
         // Apply date filter
         data = data.filter(item => {
           const itemDate = new Date(item[column] as string);
           const today = new Date();
           today.setHours(0, 0, 0, 0);
           
           switch (filter.dateFilter!.operator) {
             case 'equals':
               if (!filter.dateFilter!.value) return false;
               const targetDate = new Date(filter.dateFilter!.value);
               targetDate.setHours(0, 0, 0, 0);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() === targetDate.getTime();
               
             case 'before':
               if (!filter.dateFilter!.value) return false;
               const beforeDate = new Date(filter.dateFilter!.value);
               beforeDate.setHours(0, 0, 0, 0);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() < beforeDate.getTime();
               
             case 'after':
               if (!filter.dateFilter!.value) return false;
               const afterDate = new Date(filter.dateFilter!.value);
               afterDate.setHours(23, 59, 59, 999);
               return itemDate.getTime() > afterDate.getTime();
               
             case 'between':
               if (!filter.dateFilter!.value || !filter.dateFilter!.value2) return false;
               const startDate = new Date(filter.dateFilter!.value);
               const endDate = new Date(filter.dateFilter!.value2);
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
               
             case 'lastWeek':
               const lastWeekStart = new Date(today);
               lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
               const lastWeekEnd = new Date(lastWeekStart);
               lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
               lastWeekEnd.setHours(23, 59, 59, 999);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= lastWeekStart.getTime() && itemDate.getTime() <= lastWeekEnd.getTime();
               
             case 'nextWeek':
               const nextWeekStart = new Date(today);
               nextWeekStart.setDate(today.getDate() - today.getDay() + 7);
               const nextWeekEnd = new Date(nextWeekStart);
               nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
               nextWeekEnd.setHours(23, 59, 59, 999);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= nextWeekStart.getTime() && itemDate.getTime() <= nextWeekEnd.getTime();
               
             case 'thisMonth':
               const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
               const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
               endOfMonth.setHours(23, 59, 59, 999);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= startOfMonth.getTime() && itemDate.getTime() <= endOfMonth.getTime();
               
             case 'lastMonth':
               const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
               const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
               lastMonthEnd.setHours(23, 59, 59, 999);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= lastMonthStart.getTime() && itemDate.getTime() <= lastMonthEnd.getTime();
               
             case 'nextMonth':
               const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
               const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
               nextMonthEnd.setHours(23, 59, 59, 999);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= nextMonthStart.getTime() && itemDate.getTime() <= nextMonthEnd.getTime();
               
             case 'thisQuarter':
               const currentQuarter = Math.floor(today.getMonth() / 3);
               const quarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
               const quarterEnd = new Date(today.getFullYear(), (currentQuarter + 1) * 3, 0);
               quarterEnd.setHours(23, 59, 59, 999);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= quarterStart.getTime() && itemDate.getTime() <= quarterEnd.getTime();
               
             case 'lastQuarter':
               const lastQuarter = Math.floor(today.getMonth() / 3) - 1;
               const lastQuarterYear = lastQuarter < 0 ? today.getFullYear() - 1 : today.getFullYear();
               const adjustedLastQuarter = lastQuarter < 0 ? 3 : lastQuarter;
               const lastQuarterStart = new Date(lastQuarterYear, adjustedLastQuarter * 3, 1);
               const lastQuarterEnd = new Date(lastQuarterYear, (adjustedLastQuarter + 1) * 3, 0);
               lastQuarterEnd.setHours(23, 59, 59, 999);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= lastQuarterStart.getTime() && itemDate.getTime() <= lastQuarterEnd.getTime();
               
             case 'nextQuarter':
               const nextQuarter = Math.floor(today.getMonth() / 3) + 1;
               const nextQuarterYear = nextQuarter > 3 ? today.getFullYear() + 1 : today.getFullYear();
               const adjustedNextQuarter = nextQuarter > 3 ? 0 : nextQuarter;
               const nextQuarterStart = new Date(nextQuarterYear, adjustedNextQuarter * 3, 1);
               const nextQuarterEnd = new Date(nextQuarterYear, (adjustedNextQuarter + 1) * 3, 0);
               nextQuarterEnd.setHours(23, 59, 59, 999);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= nextQuarterStart.getTime() && itemDate.getTime() <= nextQuarterEnd.getTime();
               
             case 'thisYear':
               const yearStart = new Date(today.getFullYear(), 0, 1);
               const yearEnd = new Date(today.getFullYear(), 11, 31);
               yearEnd.setHours(23, 59, 59, 999);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= yearStart.getTime() && itemDate.getTime() <= yearEnd.getTime();
               
             case 'lastYear':
               const lastYearStart = new Date(today.getFullYear() - 1, 0, 1);
               const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
               lastYearEnd.setHours(23, 59, 59, 999);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= lastYearStart.getTime() && itemDate.getTime() <= lastYearEnd.getTime();
               
             case 'nextYear':
               const nextYearStart = new Date(today.getFullYear() + 1, 0, 1);
               const nextYearEnd = new Date(today.getFullYear() + 1, 11, 31);
               nextYearEnd.setHours(23, 59, 59, 999);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= nextYearStart.getTime() && itemDate.getTime() <= nextYearEnd.getTime();
               
             case 'yearToDate':
               const ytdStart = new Date(today.getFullYear(), 0, 1);
               itemDate.setHours(0, 0, 0, 0);
               return itemDate.getTime() >= ytdStart.getTime() && itemDate.getTime() <= today.getTime();
               
             case 'allDatesInPeriod':
               // This would typically require additional context about what "period" means
               // For now, return all dates
               return true;
               
             default:
               return true;
           }
         });
       } else if (filter.values && filter.values.length > 0) {
         // Apply list filter
         data = data.filter(item => filter.values.includes(item[column]));
        }
      });

      // Handle top10/bottom10 filters after other filters
      filters.forEach((filter, column) => {
        if (filter.filterType === 'number' && filter.numberFilter) {
          if (filter.numberFilter.operator === 'top10') {
            // Sort by column descending and take top 10
            data.sort((a, b) => Number(b[column]) - Number(a[column]));
            data = data.slice(0, 10);
          } else if (filter.numberFilter.operator === 'bottom10') {
            // Sort by column ascending and take bottom 10
            data.sort((a, b) => Number(a[column]) - Number(b[column]));
            data = data.slice(0, 10);
          }
        }
      });

      // Apply sorting
      if (sort) {
        data.sort((a, b) => {
          const aVal = a[sort.column];
          const bVal = b[sort.column];
          
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

  public paginatedData$: Observable<Employee[]> = combineLatest([
    this.filteredData$,
    this.pagination$
  ]).pipe(
    map(([data, pagination]) => {
      // If pageSize is -1, return all data (no pagination)
      if (pagination.pageSize === -1) {
        return data;
      }
      
      const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      return data.slice(startIndex, endIndex);
    })
  );

  getFilterOptions(column: keyof Employee, excludeColumn?: keyof Employee): Observable<FilterOption[]> {
    return new Observable<FilterOption[]>(observer => {
      console.log('=== getFilterOptions called with column:', column);
      
      // Use setTimeout to make this async and prevent UI blocking
      setTimeout(() => {
        // Get currently filtered data (excluding the column we're filtering on)
        let dataToAnalyze = [...this.originalData];
        
        // Apply all filters except the one for the column we're currently filtering
        const currentFilters = this.filtersSubject.value;
        const searchTerm = this.searchSubject.value;
        
        // Apply global search
        if (searchTerm) {
          dataToAnalyze = dataToAnalyze.filter(item =>
            Object.values(item).some(value =>
              value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
          );
        }
        
        // Apply all other filters (excluding the current column)
        currentFilters.forEach((filter, filterColumn) => {
          if (filterColumn === column) return; // Skip the column we're filtering on
          
          if (filter.filterType === 'text' && filter.textFilter) {
            dataToAnalyze = dataToAnalyze.filter(item => {
              const value = String(item[filterColumn]).toLowerCase();
              const filterValue = filter.textFilter!.value.toLowerCase();
              
              switch (filter.textFilter!.operator) {
                case 'equals':
                  return value === filterValue;
                case 'notEquals':
                  return value !== filterValue;
                case 'beginsWith':
                  return value.startsWith(filterValue);
                case 'notBeginsWith':
                  return !value.startsWith(filterValue);
                case 'endsWith':
                  return value.endsWith(filterValue);
                case 'notEndsWith':
                  return !value.endsWith(filterValue);
                case 'contains':
                  return value.includes(filterValue);
                case 'notContains':
                  return !value.includes(filterValue);
                default:
                  return true;
              }
            });
          } else if (filter.filterType === 'number' && filter.numberFilter) {
            dataToAnalyze = dataToAnalyze.filter(item => {
              const value = Number(item[filterColumn]);
              const filterValue = filter.numberFilter!.value;
              const filterValue2 = filter.numberFilter!.value2;
              
              switch (filter.numberFilter!.operator) {
                case 'equals':
                  return value === filterValue!;
                case 'notEquals':
                  return value !== filterValue!;
                case 'greaterThan':
                  return value > filterValue!;
                case 'greaterThanOrEqual':
                  return value >= filterValue!;
                case 'lessThan':
                  return value < filterValue!;
                case 'lessThanOrEqual':
                  return value <= filterValue!;
                case 'between':
                  return filterValue !== undefined && filterValue2 !== undefined && 
                         value >= filterValue && value <= filterValue2;
                case 'aboveAverage':
                  const avg = this.originalData.reduce((sum, item) => sum + Number(item[filterColumn]), 0) / this.originalData.length;
                  return value > avg;
                case 'belowAverage':
                  const avgBelow = this.originalData.reduce((sum, item) => sum + Number(item[filterColumn]), 0) / this.originalData.length;
                  return value < avgBelow;
                default:
                  return true;
              }
            });
          } else if (filter.filterType === 'date' && filter.dateFilter) {
            dataToAnalyze = dataToAnalyze.filter(item => {
              const itemDate = new Date(item[filterColumn] as string);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              switch (filter.dateFilter!.operator) {
                case 'equals':
                  if (!filter.dateFilter!.value) return false;
                  const targetDate = new Date(filter.dateFilter!.value);
                  targetDate.setHours(0, 0, 0, 0);
                  itemDate.setHours(0, 0, 0, 0);
                  return itemDate.getTime() === targetDate.getTime();
                  
                case 'before':
                  if (!filter.dateFilter!.value) return false;
                  const beforeDate = new Date(filter.dateFilter!.value);
                  beforeDate.setHours(0, 0, 0, 0);
                  itemDate.setHours(0, 0, 0, 0);
                  return itemDate.getTime() < beforeDate.getTime();
                  
                case 'after':
                  if (!filter.dateFilter!.value) return false;
                  const afterDate = new Date(filter.dateFilter!.value);
                  afterDate.setHours(23, 59, 59, 999);
                  return itemDate.getTime() > afterDate.getTime();
                  
                case 'between':
                  if (!filter.dateFilter!.value || !filter.dateFilter!.value2) return false;
                  const startDate = new Date(filter.dateFilter!.value);
                  const endDate = new Date(filter.dateFilter!.value2);
                  startDate.setHours(0, 0, 0, 0);
                  endDate.setHours(23, 59, 59, 999);
                  itemDate.setHours(0, 0, 0, 0);
                  return itemDate.getTime() >= startDate.getTime() && itemDate.getTime() <= endDate.getTime();
                  
                // Add other date operators as needed
                default:
                  return true;
              }
            });
          } else if (filter.values && filter.values.length > 0) {
            dataToAnalyze = dataToAnalyze.filter(item => filter.values.includes(item[filterColumn]));
          }
        });
        
        // Use Map for better performance with large datasets
        const valueCountMap = new Map<any, number>();
        
        // Single pass through data to count occurrences
        for (const item of dataToAnalyze) {
          const value = item[column];
          valueCountMap.set(value, (valueCountMap.get(value) || 0) + 1);
        }
        
        console.log('Unique values count for', column, ':', valueCountMap.size);
        
        // Get current active filters
        const currentFilter = currentFilters.get(column);
        
        // Create filter options from Map entries
        const options = Array.from(valueCountMap.entries()).map(([value, count]) => ({
          key: String(value),
          value: value,
          count: count,
          selected: currentFilter ? currentFilter.values.includes(value) : false
        }));
        
        console.log('Final options for', column, ':', options.slice(0, 5));
        
        observer.next(options);
        observer.complete();
      }, 0);
    });
  }

  setFilter(column: keyof Employee, values: any[]): void {
    const currentFilters = new Map(this.filtersSubject.value);
    if (values.length === 0) {
      currentFilters.delete(column);
    } else {
      currentFilters.set(column, { column, values });
    }
    this.filtersSubject.next(currentFilters);
    this.resetPagination();
  }

  setFilterWithConfig(column: keyof Employee, filterData: { values?: any[], textFilter?: any }): void {
    console.log('setFilterWithConfig called with:', column, filterData);
    const currentFilters = new Map(this.filtersSubject.value);
    
    if (filterData.textFilter) {
      // Text filter mode
      currentFilters.set(column, { 
        column, 
        values: [], 
        filterType: 'text',
        textFilter: filterData.textFilter
      });
    } else if ((filterData as any).numberFilter) {
      // Number filter mode
      console.log('Setting number filter:', (filterData as any).numberFilter);
      currentFilters.set(column, { 
        column, 
        values: [], 
        filterType: 'number',
        numberFilter: (filterData as any).numberFilter
      });
    } else if ((filterData as any).dateFilter) {
      // Date filter mode
      console.log('Setting date filter:', (filterData as any).dateFilter);
      currentFilters.set(column, { 
        column, 
        values: [], 
        filterType: 'date',
        dateFilter: (filterData as any).dateFilter
      });
    } else if (filterData.values && filterData.values.length > 0) {
      // List filter mode
      currentFilters.set(column, { 
        column, 
        values: filterData.values,
        filterType: 'list'
      });
    } else {
      // Clear filter
      currentFilters.delete(column);
    }
    
    console.log('Updated filters:', currentFilters);
    this.filtersSubject.next(currentFilters);
    this.resetPagination();
  }
  
  clearAllFilters(): void {
    this.filtersSubject.next(new Map());
    this.resetPagination();
  }

  setSort(column: keyof Employee, direction: 'asc' | 'desc'): void {
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

  getActiveFilters(): Observable<Map<keyof Employee, FilterConfig>> {
    return this.filters$.pipe(
      map(filters => {
        const activeFilters = new Map<keyof Employee, FilterConfig>();
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

  private generateSampleData(): Employee[] {
    const departments = ['Marketing', 'Design', 'Operations', 'Legal', 'IT', 'HR', 'Finance', 'Customer Service', 'Engineering'];
    const locations = ['Memphis', 'Oklahoma City', 'Miami', 'Boston', 'Charlotte', 'Indianapolis', 'Milwaukee', 'Baltimore', 'El Paso', 'Omaha', 'Las Vegas', 'Chicago'];
    const firstNames = ['Jason', 'Andrea', 'Helen', 'Ashley', 'Larry', 'Michael', 'Edward', 'Rachel', 'Heather', 'Stephen', 'Janet', 'Rachel'];
    const lastNames = ['Ramirez', 'Nguyen', 'White', 'Phillips', 'Brown', 'Green', 'Rogers', 'Reyes', 'Richardson', 'Allen', 'Ortiz', 'Perez', 'Garcia'];

    const data: Employee[] = [];
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

  getTotalRecords(): number {
    return this.originalData.length;
  }
}