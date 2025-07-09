import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { FilterDropdownComponent } from '../filter-dropdown/filter-dropdown.component';
import { PaginationComponent } from '../pagination/pagination.component';
import { ServerFilterService } from '../../services/server-filter.service';
import { TableData, TableColumn, ColumnFilter, SortOption } from '../../interfaces/filter.interface';
import { PaginationResponse, LoadingState } from '../../interfaces/pagination.interface';

@Component({
  selector: 'app-server-data-table',
  standalone: true,
  imports: [CommonModule, FilterDropdownComponent, FormsModule, PaginationComponent],
  templateUrl: './server-data-table.component.html', // Linked to external HTML file
  styleUrls: ['./server-data-table.component.css'] // Linked to external CSS file
})
export class ServerDataTableComponent implements OnInit, OnDestroy {
  @Input() columns: TableColumn[] = [];

  currentData: TableData[] = [];
  filters: Map<string, ColumnFilter> = new Map();
  currentSort: SortOption = { direction: null, column: '' };
  filtersEnabled = false;
  paginationData: PaginationResponse<TableData> | null = null;
  loading: LoadingState = { isLoading: false };

  private destroy$ = new Subject<void>();

  constructor(private serverFilterService: ServerFilterService) {}

  ngOnInit() {
    // Initialize filters
    const columnKeys = this.columns.map(col => col.key);
    this.serverFilterService.initializeFilters(columnKeys);
    
    // Subscribe to data response
    this.serverFilterService.dataResponse$
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.paginationData = response;
        this.currentData = response?.data || [];
      });

    // Subscribe to loading state
    this.serverFilterService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
      });

    // Subscribe to filter changes
    this.serverFilterService.filters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.filters = filters;
      });

    // Subscribe to sort changes
    this.serverFilterService.sort$
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
      this.clearAllFilters();
    }
  }

  onFilterChange(column: string, filter: ColumnFilter) {
    if (this.filtersEnabled) {
      this.serverFilterService.updateFilter(column, filter);
    }
  }

  onClearFilter(column: string) {
    if (this.filtersEnabled) {
      this.serverFilterService.clearFilter(column);
    }
  }

  onSortChange(sortOption: {column: string, direction: 'asc' | 'desc' | null}) {
    if (this.filtersEnabled) {
      this.serverFilterService.updateSort(sortOption);
    }
  }

  onLoadOptions(column: string, searchText?: string) {
    this.serverFilterService.loadColumnOptions(column, searchText).subscribe();
  }

  onPageChange(page: number) {
    this.serverFilterService.updatePagination(page);
  }

  onPageSizeChange(pageSize: number) {
    this.serverFilterService.updatePagination(1, pageSize);
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
    
    this.serverFilterService.updateSort({ column, direction: newDirection });
  }

  getSortDirection(column: string): 'asc' | 'desc' | null {
    return this.currentSort.column === column ? this.currentSort.direction : null;
  }

  clearAllFilters() {
    this.serverFilterService.clearAllFilters();
  }

  clearSort() {
    this.serverFilterService.updateSort({ column: '', direction: null });
  }

  removeSpecificFilter(column: string) {
    this.serverFilterService.clearFilter(column);
  }

  hasActiveFilters(): boolean {
    if (!this.filtersEnabled) return false;
    return this.serverFilterService.hasActiveFilters();
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
