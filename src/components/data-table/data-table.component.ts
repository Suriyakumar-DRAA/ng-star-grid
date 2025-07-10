import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FilterDropdownComponent } from '../filter-dropdown/filter-dropdown.component'; // Corrected import path
import { FilterService } from '../../services/filter.service'; // Corrected import path
import { TableData, TableColumn, ColumnFilter, SortOption } from '../../interfaces/filter.interface'; // Corrected import path

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FilterDropdownComponent, FormsModule],
  templateUrl: './data-table.component.html', // Link to HTML
  styleUrls: ['./data-table.component.css'] // Link to CSS
})
export class DataTableComponent implements OnInit, OnDestroy {
  @Input() data: TableData[] = [];
  @Input() columns: TableColumn[] = [];

  filteredData: TableData[] = [];
  originalData: TableData[] = [];
  filters: Map<string, ColumnFilter> = new Map();
  currentSort: SortOption = { direction: null, column: '' };
  filtersEnabled = true; // Default to false (off)
  renderSide: 'client' | 'server' = 'client'; // Default to client-side rendering

  private destroy$ = new Subject<void>();

  constructor(private filterService: FilterService) {}

  ngOnInit() {
    this.originalData = [...this.data];
    this.filteredData = [...this.data];
    
    // Initialize filters
    const columnKeys = this.columns.map(col => col.key);
    this.filters = this.filterService.initializeFilters(this.data, columnKeys);
    
    // Set data in service
    this.filterService.setData(this.data);
    
    // Subscribe to filtered data
    this.filterService.filteredData$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.filteredData = data;
      });

    // Subscribe to filter changes
    this.filterService.filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.filters = filters;
      });

    // Subscribe to sort changes
    this.filterService.sort$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sort => {
        this.currentSort = sort;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFilterToggleChange() {
    if (!this.filtersEnabled) {
      // When disabling filters, clear all active filters
      this.clearAllFilters();
    }
  }

  onFilterChange(column: string, filter: ColumnFilter) {
    if (this.filtersEnabled) {
      this.filterService.updateFilter(column, filter);
    }
  }

  onClearFilter(column: string) {
    if (this.filtersEnabled) {
      this.filterService.clearFilter(column);
    }
  }

  onSortChange(sortOption: {column: string, direction: 'asc' | 'desc' | null}) {
    if (this.filtersEnabled) {
      this.filterService.updateSort(sortOption);
    }
  }

  toggleSort(column: string) {
    if (!this.filtersEnabled) return;
    
    let newDirection: 'asc' | 'desc' | null = 'asc';
    
    if (this.currentSort.column === column) {
      if (this.currentSort.direction === 'asc') {
        newDirection = 'desc';
      } else if (this.currentSort.direction === 'desc') {
        newDirection = null;
      }
    }
    
    this.filterService.updateSort({ column, direction: newDirection });
  }

  getSortDirection(column: string): 'asc' | 'desc' | null {
    return this.currentSort.column === column ? this.currentSort.direction : null;
  }

  clearAllFilters() {
    this.filterService.clearAllFilters();
  }

  clearSort() {
    this.filterService.updateSort({ column: '', direction: null });
  }

  removeSpecificFilter(column: string) {
    this.filterService.clearFilter(column);
  }

  hasActiveFilters(): boolean {
    if (!this.filtersEnabled) return false;
    
    return Array.from(this.filters.values()).some(filter => 
      !filter.showAll || 
      !!filter.condition || 
      !!filter.colorFilter ||
      (!!filter.searchText && filter.searchText.trim() !== '') ||
      filter.options.some(option => !option.selected)
    ) || !!this.currentSort.direction;
  }

  getActiveFiltersInfo(): Array<{column: string, description: string}> {
    const activeFilters: Array<{column: string, description: string}> = [];
    
    Array.from(this.filters.entries()).forEach(([columnKey, filter]) => {
      const descriptions: string[] = [];
      
      // Check for unselected options
      const unselectedOptions = filter.options.filter(option => !option.selected);
      if (unselectedOptions.length > 0 && unselectedOptions.length < filter.options.length) {
        const selectedCount = filter.options.length - unselectedOptions.length;
        descriptions.push(`${selectedCount} selected`);
      }
      
      // Check for search text
      if (filter.searchText && filter.searchText.trim() !== '') {
        descriptions.push(`contains "${filter.searchText}"`);
      }
      
      // Check for conditions
      if (filter.condition) {
        const conditionDesc = this.getConditionDescription(filter.condition);
        if (conditionDesc) {
          descriptions.push(conditionDesc);
        }
      }
      
      // Check for color filter
      if (filter.colorFilter && filter.colorFilter !== '') {
        descriptions.push(`color: ${filter.colorFilter}`);
      }
      
      if (descriptions.length > 0) {
        const columnLabel = this.getColumnLabel(columnKey);
        activeFilters.push({
          column: columnLabel,
          description: descriptions.join(', ')
        });
      }
    });
    
    return activeFilters;
  }

  private getConditionDescription(condition: any): string {
    switch (condition.operator) {
      case 'equals':
        return `= ${condition.value}`;
      case 'notEquals':
        return `≠ ${condition.value}`;
      case 'greaterThan':
        return `> ${condition.value}`;
      case 'greaterThanOrEqual':
        return `≥ ${condition.value}`;
      case 'lessThan':
        return `< ${condition.value}`;
      case 'lessThanOrEqual':
        return `≤ ${condition.value}`;
      case 'between':
        return `${condition.value} - ${condition.value2}`;
      case 'top10':
        return 'top 10';
      case 'bottom10':
        return 'bottom 10';
      case 'aboveAverage':
        return 'above average';
      case 'belowAverage':
        return 'below average';
      case 'blanks':
        return 'blanks only';
      case 'nonBlanks':
        return 'non-blanks only';
      default:
        return '';
    }
  }

  private getColumnLabel(columnKey: string): string {
    const column = this.columns.find(col => col.key === columnKey);
    return column ? column.label : columnKey;
  }

  getSortColumnLabel(): string {
    return this.getColumnLabel(this.currentSort.column);
  }

  formatCellValue(value: any, type: string): string {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'date':
        return value instanceof Date ? value.toLocaleDateString() : new Date(value).toLocaleDateString();
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value.toString();
      case 'boolean':
        return value ? '✓' : '✗';
      default:
        return value.toString();
    }
  }
}
