import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FilterOption, ColumnFilter, TableData, SortOption, FilterCondition } from '../interfaces/filter.interface';

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private filtersSubject = new BehaviorSubject<Map<string, ColumnFilter>>(new Map());
  public filters$ = this.filtersSubject.asObservable();

  private sortSubject = new BehaviorSubject<SortOption>({ direction: null, column: '' });
  public sort$ = this.sortSubject.asObservable();

  private originalDataSubject = new BehaviorSubject<TableData[]>([]);
  private filteredDataSubject = new BehaviorSubject<TableData[]>([]);
  public filteredData$ = this.filteredDataSubject.asObservable();

  setData(data: TableData[]) {
    this.originalDataSubject.next(data);
    this.filteredDataSubject.next(data);
  }

  initializeFilters(data: TableData[], columns: string[]): Map<string, ColumnFilter> {
    const filters = new Map<string, ColumnFilter>();

    columns.forEach(column => {
      const uniqueValues = [...new Set(data.map(item => item[column]))];
      const options: FilterOption[] = uniqueValues
        .filter(value => value !== null && value !== undefined)
        .sort()
        .map(value => ({
          value,
          label: this.formatValue(value),
          selected: true
        }));

      const columnType = this.detectColumnType(uniqueValues);

      filters.set(column, {
        column,
        type: columnType,
        options,
        searchText: '',
        showAll: true,
        autoApply: true,
        colorFilter: ''
      });
    });

    this.filtersSubject.next(filters);
    return filters;
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

  updateFilter(column: string, updatedFilter: ColumnFilter) {
    const currentFilters = this.filtersSubject.value;
    currentFilters.set(column, updatedFilter);
    this.filtersSubject.next(currentFilters);
    this.applyFilters();
  }

  updateSort(sortOption: SortOption) {
    this.sortSubject.next(sortOption);
    this.applyFilters();
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
      this.filtersSubject.next(currentFilters);
      this.applyFilters();
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
    this.filtersSubject.next(currentFilters);
    this.sortSubject.next({ direction: null, column: '' });
    this.applyFilters();
  }

  private applyFilters() {
    let data = [...this.originalDataSubject.value];
    const filters = this.filtersSubject.value;
    const sort = this.sortSubject.value;

    // Apply filters
    data = data.filter(item => {
      return Array.from(filters.values()).every(filter => {
        return this.passesFilter(item, filter);
      });
    });

    // Update filter options based on filtered data
    // this.updateFilterOptions(data);

    // Apply sorting
    if (sort.direction && sort.column) {
      data.sort((a, b) => {
        const aVal = a[sort.column];
        const bVal = b[sort.column];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;

        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }

    this.filteredDataSubject.next(data);
  }

  private passesFilter(item: TableData, filter: ColumnFilter): boolean {
    const value = item[filter.column];

    // Apply advanced condition if exists
    if (filter.condition) {
      if (!this.passesCondition(item, filter.condition, filter.column)) {
        return false;
      }
    }

    // Check if any options are unselected (meaning we have active filtering)
    const hasActiveFiltering = filter.options.some(option => !option.selected);

    // If we have active filtering, check if the value is in selected options
    if (hasActiveFiltering) {
      const selectedValues = filter.options
        .filter(option => option.selected)
        .map(option => option.value);

      if (!selectedValues.includes(value)) {
        return false;
      }
    }

    // Apply search text filter if present
    if (filter.searchText && filter.searchText.trim() !== '') {
      const searchText = filter.searchText.toLowerCase();
      const valueText = this.formatValue(value).toLowerCase();
      if (!valueText.includes(searchText)) {
        return false;
      }
    }

    return true;
  }

  private passesCondition(item: TableData, condition: FilterCondition, column: string): boolean {
    const value = item[column];
    const originalData = this.originalDataSubject.value;

    switch (condition.operator) {
      case 'equals':
        return value == condition.value;

      case 'notEquals':
        return value != condition.value;

      case 'greaterThan':
        return Number(value) > Number(condition.value);

      case 'greaterThanOrEqual':
        return Number(value) >= Number(condition.value);

      case 'lessThan':
        return Number(value) < Number(condition.value);

      case 'lessThanOrEqual':
        return Number(value) <= Number(condition.value);

      case 'between':
        const num = Number(value);
        const min = Number(condition.value);
        const max = Number(condition.value2);
        return num >= min && num <= max;

      case 'top10':
        const sortedDesc = originalData
          .map(row => Number(row[column]))
          .filter(val => !isNaN(val))
          .sort((a, b) => b - a)
          .slice(0, 10);
        return sortedDesc.includes(Number(value));

      case 'bottom10':
        const sortedAsc = originalData
          .map(row => Number(row[column]))
          .filter(val => !isNaN(val))
          .sort((a, b) => a - b)
          .slice(0, 10);
        return sortedAsc.includes(Number(value));

      case 'aboveAverage':
        const values = originalData
          .map(row => Number(row[column]))
          .filter(val => !isNaN(val));
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        return Number(value) > average;

      case 'belowAverage':
        const vals = originalData
          .map(row => Number(row[column]))
          .filter(val => !isNaN(val));
        const avg = vals.reduce((sum, val) => sum + val, 0) / vals.length;
        return Number(value) < avg;

      case 'blanks':
        return value === null || value === undefined || value === '';

      case 'nonBlanks':
        return value !== null && value !== undefined && value !== '';

      default:
        return true;
    }
  }

  private updateFilterOptions(filteredData: TableData[]) {
    const currentFilters = this.filtersSubject.value;
    const updatedFilters = new Map<string, ColumnFilter>();

    currentFilters.forEach((filter, column) => {
      // Get unique values from the filtered data for this column
      const filteredValues = new Set(filteredData.map(item => item[column]));
      
      // Update existing options: keep all options but unselect those not in filtered data
      const updatedOptions: FilterOption[] = filter.options.map(option => {
        return {
          ...option,
          // Keep the option selected only if it exists in filtered data AND was previously selected
          selected: filteredValues.has(option.value) && option.selected
        };
      });

      // Update the filter with updated options while preserving other properties
      updatedFilters.set(column, {
        ...filter,
        options: updatedOptions
      });
    });

    this.filtersSubject.next(updatedFilters);
  }

  getFilteredOptionsCount(column: string): number {
    const filter = this.filtersSubject.value.get(column);
    if (!filter) return 0;
    return filter.options.filter(option => option.selected).length;
  }

  getTotalOptionsCount(column: string): number {
    const filter = this.filtersSubject.value.get(column);
    if (!filter) return 0;
    return filter.options.length;
  }
}