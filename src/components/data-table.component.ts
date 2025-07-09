import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FilterDropdownComponent } from './filter-dropdown.component';
import { FilterService } from '../services/filter.service';
import { TableData, TableColumn, ColumnFilter, SortOption } from '../interfaces/filter.interface';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FilterDropdownComponent, FormsModule],
  template: `
    <div class="data-table-container">
      <div class="table-header">
        <div class="table-info-row">
          <span class="record-count">{{filteredData.length}} of {{originalData.length}} records</span>
          
          <!-- Filter Toggle Button - Top Right -->
          <div class="filter-toggle-container">
            <label class="filter-toggle-label">
              <input 
                type="checkbox" 
                [(ngModel)]="filtersEnabled"
                (change)="onFilterToggleChange()"
                class="filter-toggle-checkbox">
              <span class="filter-toggle-slider"></span>
              <span class="filter-toggle-text">Enable Excel like Filters</span>
            </label>
          </div>
        </div>
        
        <!-- Active Filters Strip -->
        <div *ngIf="hasActiveFilters() && filtersEnabled" class="active-filters-strip">
          <div class="filters-label">Active Filters:</div>
          <div class="filter-tags">
            <span *ngFor="let filterInfo of getActiveFiltersInfo()" class="filter-tag">
              <span class="filter-column">{{filterInfo.column}}</span>
              <span class="filter-description">{{filterInfo.description}}</span>
              <button class="remove-filter-btn" (click)="removeSpecificFilter(filterInfo.column)" title="Remove this filter">×</button>
            </span>
            <span *ngIf="currentSort.direction" class="filter-tag sort-tag">
              <span class="filter-column">Sort</span>
              <span class="filter-description">{{getSortColumnLabel()}} {{currentSort.direction === 'asc' ? '↑' : '↓'}}</span>
              <button class="remove-filter-btn" (click)="clearSort()" title="Remove sort">×</button>
            </span>
          </div>
          <button *ngIf="hasActiveFilters() && filtersEnabled" class="clear-all-btn" (click)="clearAllFilters()">
            Clear All Filters
          </button>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr class="header-row">
              <th *ngFor="let column of columns" class="header-cell" [class.sortable]="column.sortable">
                <div class="header-content">
                  <span class="column-label" (click)="toggleSort(column.key)">
                    {{column.label}}
                    <span *ngIf="getSortDirection(column.key)" class="sort-indicator">
                      {{getSortDirection(column.key) === 'asc' ? '↑' : '↓'}}
                    </span>
                  </span>
                  <app-filter-dropdown
                    *ngIf="filters.get(column.key) && filtersEnabled"
                    [filter]="filters.get(column.key)!"
                    (filterChange)="onFilterChange(column.key, $event)"
                    (clearFilterEvent)="onClearFilter(column.key)"
                    (sortChange)="onSortChange($event)">
                  </app-filter-dropdown>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filteredData; let i = index" 
                class="data-row" 
                [class.even]="i % 2 === 0"
                [class.odd]="i % 2 === 1">
              <td *ngFor="let column of columns" class="data-cell" [attr.data-type]="column.type">
                <span class="cell-content">{{formatCellValue(row[column.key], column.type)}}</span>
              </td>
            </tr>
            <tr *ngIf="filteredData.length === 0" class="no-data-row">
              <td [colSpan]="columns.length" class="no-data-cell">
                No data matches the current filters
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .data-table-container {
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      height: 700px;
      display: flex;
      flex-direction: column;
    }

    .table-header {
      padding: 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    .table-info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .record-count {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }

    .filter-toggle-container {
      display: flex;
      align-items: center;
    }

    .filter-toggle-label {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      user-select: none;
    }

    .filter-toggle-checkbox {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .filter-toggle-slider {
      position: relative;
      display: inline-block;
      width: 48px;
      height: 24px;
      background-color: #d1d5db;
      border-radius: 24px;
      transition: all 0.3s ease;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .filter-toggle-slider:before {
      content: "";
      position: absolute;
      height: 20px;
      width: 20px;
      left: 2px;
      top: 2px;
      background-color: white;
      border-radius: 50%;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .filter-toggle-checkbox:checked + .filter-toggle-slider {
      background-color: #3b82f6;
      box-shadow: inset 0 2px 4px rgba(59, 130, 246, 0.2);
    }

    .filter-toggle-checkbox:checked + .filter-toggle-slider:before {
      transform: translateX(24px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    }

    .filter-toggle-slider:hover {
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .filter-toggle-text {
      font-weight: 500;
      color: #374151;
      transition: color 0.2s ease;
    }

    .filter-toggle-checkbox:checked ~ .filter-toggle-text {
      color: #3b82f6;
    }

    .active-filters-strip {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #3b82f6;
      border-radius: 6px;
      padding: 12px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
    }

    .filters-label {
      font-size: 13px;
      font-weight: 600;
      color: #1e40af;
      margin-right: 8px;
    }

    .filter-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      flex: 1;
    }

    .filter-tag {
      display: inline-flex;
      align-items: center;
      background: #3b82f6;
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      gap: 4px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }

    .filter-tag:hover {
      background: #2563eb;
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }

    .sort-tag {
      background: #10b981;
    }

    .sort-tag:hover {
      background: #059669;
    }

    .filter-column {
      font-weight: 600;
      opacity: 0.9;
    }

    .filter-description {
      opacity: 0.95;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .remove-filter-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      font-weight: bold;
      transition: background-color 0.2s ease;
      margin-left: 2px;
    }

    .remove-filter-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .clear-all-btn {
      background: #ef4444;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);
      margin-left: auto;
    }

    .clear-all-btn:hover {
      background: #dc2626;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
    }

    .table-wrapper {
      overflow: auto;
      flex: 1;
      position: relative;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      table-layout: fixed;
    }

    .header-row {
      background: #f1f5f9;
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-cell {
      padding: 0;
      border-right: 1px solid #d1d5db;
      border-bottom: 2px solid #9ca3af;
      background: #f1f5f9;
      font-weight: 600;
      color: #374151;
      text-align: left;
      width: 150px;
      position: relative;
      overflow: visible;
    }

    .header-cell:last-child {
      border-right: none;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      gap: 8px;
      position: relative;
    }

    .column-label {
      flex: 1;
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .column-label:hover {
      color: #3b82f6;
    }

    .sort-indicator {
      font-size: 12px;
      color: #3b82f6;
    }

    .data-row {
      transition: background-color 0.15s ease;
    }

    .data-row:hover {
      background: #f8fafc;
    }

    .data-row.even {
      background: #ffffff;
    }

    .data-row.odd {
      background: #fafbfc;
    }

    .data-row:hover {
      background: #f0f9ff !important;
    }

    .data-cell {
      padding: 8px 12px;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #f3f4f6;
      vertical-align: top;
      width: 150px;
      overflow: hidden;
    }

    .data-cell:last-child {
      border-right: none;
    }

    .data-cell[data-type="number"] {
      text-align: right;
    }

    .data-cell[data-type="boolean"] {
      text-align: center;
    }

    .cell-content {
      display: block;
      word-wrap: break-word;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .no-data-row {
      background: #fafbfc;
    }

    .no-data-cell {
      padding: 40px;
      text-align: center;
      color: #9ca3af;
      font-style: italic;
    }

    /* Scrollbar styling */
    .table-wrapper::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .table-wrapper::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .table-wrapper::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }

    .table-wrapper::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .data-table-container {
        height: 600px;
      }

      .table-info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .filter-toggle-container {
        align-self: flex-end;
      }

      .active-filters-strip {
        padding: 8px;
        flex-direction: column;
        align-items: flex-start;
      }

      .filters-label {
        margin-right: 0;
        margin-bottom: 4px;
      }

      .filter-tag {
        font-size: 11px;
        padding: 3px 6px;
      }

      .filter-description {
        max-width: 80px;
      }

      .clear-all-btn {
        margin-left: 0;
        margin-top: 8px;
        align-self: flex-start;
      }

      .data-table {
        table-layout: auto;
      }

      .header-cell,
      .data-cell {
        width: auto;
        min-width: 120px;
      }
    }
  `]
})
export class DataTableComponent implements OnInit, OnDestroy {
  @Input() data: TableData[] = [];
  @Input() columns: TableColumn[] = [];

  filteredData: TableData[] = [];
  originalData: TableData[] = [];
  filters: Map<string, ColumnFilter> = new Map();
  currentSort: SortOption = { direction: null, column: '' };
  filtersEnabled = false; // Default to false (off)

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