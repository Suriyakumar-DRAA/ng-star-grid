import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColumnFilter, FilterOption, FilterCondition } from '../interfaces/filter.interface';

@Component({
  selector: 'app-filter-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-dropdown-container" #dropdownContainer>
      <button 
        class="filter-button"
        [class.active]="isOpen"
        [class.filtered]="hasActiveFilters()"
        (click)="toggleDropdown()"
        #filterButton>
        <span class="filter-icon">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"></polygon>
          </svg>
        </span>
        <span class="dropdown-arrow" [class.rotated]="isOpen">▼</span>
      </button>

      <div class="filter-dropdown" 
           [class.show]="isOpen" 
           [class.dropdown-up]="shouldShowUp"
           [class.dropdown-left]="shouldAlignLeft"
           #dropdown>
        
        <!-- Sort Section -->
        <div class="filter-section sort-section">
          <h4 class="section-title">Sort</h4>
          <div class="sort-options">
            <button class="sort-btn" [class.active]="currentSort === 'asc'" (click)="setSortDirection('asc')">
              <span class="sort-icon">A↓</span> Asc
            </button>
            <button class="sort-btn" [class.active]="currentSort === 'desc'" (click)="setSortDirection('desc')">
              <span class="sort-icon">Z↑</span> Desc
            </button>
          </div>
        </div>

        <!-- Filter Section -->
        <div class="filter-section">
          <h4 class="section-title">Filter</h4>
          
          <!-- Advanced Filter Dropdown -->
          <div class="advanced-filter-container">
            <div class="filter-type-selector" [class.open]="showAdvancedOptions">
              <button class="filter-type-btn" (click)="toggleAdvancedOptions()">
                <span class="condition-indicator" [class.active]="hasActiveCondition()">⚡</span>
                <span class="filter-type-text">{{getSelectedFilterLabel()}}</span>
                <span class="dropdown-arrow-small" [class.rotated]="showAdvancedOptions">▼</span>
              </button>
              
              <div class="advanced-options" [class.show]="showAdvancedOptions">
                <button *ngFor="let option of getFilterOptions()" 
                        class="filter-option-btn"
                        [class.selected]="filter.condition?.operator === option.value"
                        (click)="selectFilterOption(option.value)">
                  {{option.label}}
                </button>
              </div>
            </div>

            <!-- Condition Input Fields -->
            <div *ngIf="filter.condition && needsInput(filter.condition.operator)" class="condition-inputs">
              <input 
                type="text" 
                placeholder="Value"
                [(ngModel)]="filter.condition.value"
                (input)="onConditionChange()"
                class="condition-input">
              
              <input 
                *ngIf="filter.condition.operator === 'between'"
                type="text" 
                placeholder="To"
                [(ngModel)]="filter.condition.value2"
                (input)="onConditionChange()"
                class="condition-input">
            </div>
          </div>

          <!-- Search Box -->
          <div class="search-container">
            <input 
              type="text" 
              placeholder="Search values..."
              [(ngModel)]="filter.searchText"
              (input)="onSearchChange()"
              class="search-input">
            <span class="search-icon">🔍</span>
          </div>

          <!-- Load Options Button -->
          <div class="load-options-container" *ngIf="filter.options.length === 0">
            <button class="load-options-btn" (click)="loadFilterOptions()">
              Load Filter Options
            </button>
          </div>

          <!-- Filter Options List -->
          <div class="filter-options" *ngIf="filter.options.length > 0">
            <div class="filter-option select-all">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  [checked]="filter.showAll"
                  (change)="onSelectAllChange($event)">
                <span class="custom-checkbox"></span>
                <span class="option-text">All ({{getVisibleOptionsCount()}})</span>
              </label>
            </div>
            
            <div class="options-list">
              <div 
                *ngFor="let option of getFilteredOptions()" 
                class="filter-option">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    [checked]="option.selected"
                    (change)="onOptionChange(option, $event)">
                  <span class="custom-checkbox"></span>
                  <span class="option-text" [title]="option.label">{{option.label}}</span>
                </label>
              </div>
              
              <!-- Blanks option -->
              <div class="filter-option">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    [checked]="blanksSelected"
                    (change)="onBlanksChange($event)">
                  <span class="custom-checkbox"></span>
                  <span class="option-text">(Blanks)</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Auto Apply -->
          <div class="auto-apply-container">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                [checked]="filter.autoApply"
                (change)="onAutoApplyChange($event)">
              <span class="custom-checkbox"></span>
              <span class="option-text">Auto Apply</span>
            </label>
          </div>
        </div>

        <!-- Footer Buttons -->
        <div class="filter-footer">
          <button class="btn btn-secondary" (click)="clearFilter()">Clear</button>
          <button class="btn btn-primary" (click)="applyFilter()">Apply</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .filter-dropdown-container {
      position: relative;
      display: inline-block;
    }

    .filter-button {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 3px 6px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s ease;
      min-width: 20px;
      height: 20px;
    }

    .filter-button:hover {
      border-color: #3b82f6;
      background: #f8fafc;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .filter-button.active {
      border-color: #3b82f6;
      background: #eff6ff;
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
    }

    .filter-button.filtered {
      background: #dbeafe;
      border-color: #3b82f6;
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
    }

    .filter-icon {
      display: flex;
      align-items: center;
      color: #6b7280;
    }

    .filter-button.filtered .filter-icon {
      color: #3b82f6;
    }

    .dropdown-arrow {
      font-size: 8px;
      transition: transform 0.2s ease;
      color: #6b7280;
    }

    .dropdown-arrow.rotated {
      transform: rotate(180deg);
    }

    .filter-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      width: 280px;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: all 0.2s ease;
      max-height: 70vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .filter-dropdown.dropdown-up {
      top: auto;
      bottom: 100%;
      transform: translateY(8px);
    }

    .filter-dropdown.dropdown-up.show {
      transform: translateY(0);
    }

    .filter-dropdown.dropdown-left {
      left: auto;
      right: 0;
    }

    .filter-dropdown.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .filter-section {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    .filter-section:last-of-type {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .sort-section {
      background: #f8fafc;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      margin: 0 0 6px 0;
      color: #374151;
    }

    .sort-options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .sort-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 6px 8px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s ease;
    }

    .sort-btn:hover {
      border-color: #3b82f6;
      background: #f8fafc;
    }

    .sort-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .sort-icon {
      font-weight: bold;
      font-size: 10px;
    }

    .advanced-filter-container {
      margin-bottom: 8px;
    }

    .filter-type-selector {
      position: relative;
    }

    .filter-type-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      text-align: left;
      transition: all 0.2s ease;
    }

    .filter-type-btn:hover {
      border-color: #3b82f6;
      background: #f8fafc;
    }

    .condition-indicator {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      background: #e5e7eb;
      color: #6b7280;
      margin-right: 6px;
      transition: all 0.2s ease;
    }

    .condition-indicator.active {
      background: #22c55e;
      color: white;
    }

    .filter-type-text {
      flex: 1;
      font-size: 11px;
    }

    .dropdown-arrow-small {
      font-size: 7px;
      transition: transform 0.2s ease;
      color: #9ca3af;
    }

    .dropdown-arrow-small.rotated {
      transform: rotate(180deg);
    }

    .advanced-options {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 3px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1001;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-3px);
      transition: all 0.2s ease;
      max-height: 160px;
      overflow-y: auto;
    }

    .advanced-options.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .filter-option-btn {
      display: block;
      width: 100%;
      padding: 6px 8px;
      border: none;
      background: white;
      text-align: left;
      cursor: pointer;
      font-size: 11px;
      transition: background-color 0.15s ease;
    }

    .filter-option-btn:hover {
      background: #f3f4f6;
    }

    .filter-option-btn.selected {
      background: #eff6ff;
      color: #3b82f6;
    }

    .condition-inputs {
      margin-top: 6px;
      display: flex;
      gap: 6px;
    }

    .condition-input {
      flex: 1;
      padding: 4px 6px;
      border: 1px solid #d1d5db;
      border-radius: 3px;
      font-size: 11px;
    }

    .condition-input:focus {
      border-color: #3b82f6;
      outline: none;
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
    }

    .search-container {
      position: relative;
      margin-bottom: 8px;
    }

    .search-input {
      width: 100%;
      padding: 6px 24px 6px 8px;
      border: 1px solid #d1d5db;
      border-radius: 3px;
      font-size: 11px;
      outline: none;
    }

    .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
    }

    .search-icon {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      font-size: 10px;
    }

    .load-options-container {
      margin-bottom: 8px;
    }

    .load-options-btn {
      width: 100%;
      padding: 8px;
      border: 1px solid #3b82f6;
      background: #eff6ff;
      color: #3b82f6;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .load-options-btn:hover {
      background: #dbeafe;
    }

    .filter-options {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .options-list {
      flex: 1;
      overflow-y: auto;
      max-height: 140px;
    }

    .filter-option {
      padding: 0;
    }

    .select-all {
      padding: 6px 8px;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
      flex-shrink: 0;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      padding: 4px 8px;
      font-size: 11px;
      transition: background-color 0.15s ease;
      width: 100%;
    }

    .checkbox-label:hover {
      background: #f3f4f6;
    }

    .select-all .checkbox-label {
      padding: 0;
      font-weight: 500;
    }

    .select-all .checkbox-label:hover {
      background: transparent;
    }

    /* Hide default checkbox */
    input[type="checkbox"] {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    /* Custom checkbox */
    .custom-checkbox {
      height: 12px;
      width: 12px;
      background-color: white;
      border: 1px solid #d1d5db;
      border-radius: 2px;
      position: relative;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    /* Checkbox checked state */
    input[type="checkbox"]:checked ~ .custom-checkbox {
      background-color: #3b82f6;
      border-color: #3b82f6;
    }

    /* Checkmark */
    .custom-checkbox:after {
      content: "";
      position: absolute;
      display: none;
      left: 3px;
      top: 0px;
      width: 3px;
      height: 6px;
      border: solid white;
      border-width: 0 1px 1px 0;
      transform: rotate(45deg);
    }

    input[type="checkbox"]:checked ~ .custom-checkbox:after {
      display: block;
    }

    .option-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .auto-apply-container {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      flex-shrink: 0;
    }

    .filter-footer {
      display: flex;
      justify-content: space-between;
      padding: 8px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
      flex-shrink: 0;
    }

    .btn {
      padding: 5px 10px;
      border-radius: 3px;
      border: none;
      cursor: pointer;
      font-size: 11px;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .btn-secondary {
      background: #e5e7eb;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #d1d5db;
    }

    /* Scrollbar styling for options list */
    .options-list::-webkit-scrollbar {
      width: 4px;
    }

    .options-list::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .options-list::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 2px;
    }

    .options-list::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .advanced-options::-webkit-scrollbar {
      width: 4px;
    }

    .advanced-options::-webkit-scrollbar-track {
      background: #f1f5f9;
    }

    .advanced-options::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 2px;
    }
  `]
})
export class FilterDropdownComponent {
  @Input() filter!: ColumnFilter;
  @Output() filterChange = new EventEmitter<ColumnFilter>();
  @Output() clearFilterEvent = new EventEmitter<void>();
  @Output() sortChange = new EventEmitter<{column: string, direction: 'asc' | 'desc' | null}>();
  @Output() loadOptions = new EventEmitter<string>();

  @ViewChild('dropdown') dropdown!: ElementRef;
  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;

  isOpen = false;
  showAdvancedOptions = false;
  currentSort: 'asc' | 'desc' | null = null;
  blanksSelected = false;
  shouldShowUp = false;
  shouldAlignLeft = false;

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    this.showAdvancedOptions = false;
    
    if (this.isOpen) {
      // Check if dropdown should show above the button and align left
      setTimeout(() => {
        this.checkDropdownPosition();
      }, 0);
    }
  }

  private checkDropdownPosition() {
    if (!this.dropdown || !this.dropdownContainer) return;
    
    const containerRect = this.dropdownContainer.nativeElement.getBoundingClientRect();
    const dropdownWidth = 280;
    const dropdownHeight = 400;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Check vertical position
    const spaceBelow = viewportHeight - containerRect.bottom;
    const spaceAbove = containerRect.top;
    this.shouldShowUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
    
    // Check horizontal position - calculate space to the right of the button
    const spaceRight = viewportWidth - containerRect.left;
    
    // If there's not enough space to the right for the dropdown, align it to the left
    this.shouldAlignLeft = spaceRight < dropdownWidth;
  }

  toggleAdvancedOptions() {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    if (!this.dropdownContainer.nativeElement.contains(event.target as Node)) {
      this.isOpen = false;
      this.showAdvancedOptions = false;
    }
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.isOpen) {
      this.checkDropdownPosition();
    }
  }

  setSortDirection(direction: 'asc' | 'desc') {
    this.currentSort = this.currentSort === direction ? null : direction;
    this.sortChange.emit({
      column: this.filter.column,
      direction: this.currentSort
    });
  }

  loadFilterOptions() {
    console.log('Loading filter options for column:', this.filter.column);
    this.loadOptions.emit(this.filter.searchText);
  }

  getFilterOptions() {
    const baseOptions = [
      { value: 'equals', label: 'Equals' },
      { value: 'notEquals', label: 'Does Not Equal' }
    ];

    if (this.filter.type === 'number') {
      return [
        ...baseOptions,
        { value: 'greaterThan', label: 'Greater than' },
        { value: 'greaterThanOrEqual', label: 'Greater than or Equal to' },
        { value: 'lessThan', label: 'Less than' },
        { value: 'lessThanOrEqual', label: 'Less than or Equal to' },
        { value: 'between', label: 'Between' }
      ];
    }

    return [
      ...baseOptions,
      { value: 'blanks', label: 'Blanks' },
      { value: 'nonBlanks', label: 'Non-Blanks' }
    ];
  }

  selectFilterOption(operator: string) {
    if (!this.filter.condition) {
      this.filter.condition = { operator: operator as any };
    } else {
      this.filter.condition.operator = operator as any;
    }
    this.showAdvancedOptions = false;
    
    if (this.filter.autoApply) {
      this.onConditionChange();
    }
  }

  getSelectedFilterLabel(): string {
    if (!this.filter.condition) {
      return 'Choose One';
    }
    
    const option = this.getFilterOptions().find(opt => opt.value === this.filter.condition?.operator);
    return option ? option.label : 'Choose One';
  }

  hasActiveCondition(): boolean {
    return !!this.filter.condition && !!this.filter.condition.operator;
  }

  hasActiveFilters(): boolean {
    // Check if any options are unselected
    const hasUncheckedOptions = this.filter.options.some(option => !option.selected);
    
    // Check if there's an active condition
    const hasCondition = this.hasActiveCondition();
    
    // Check if there's a search text
    const hasSearchText = !!this.filter.searchText && this.filter.searchText.trim() !== '';
    
    // Check if there's a color filter
    const hasColorFilter = !!this.filter.colorFilter && this.filter.colorFilter !== '';
    
    return hasUncheckedOptions || hasCondition || hasSearchText || hasColorFilter;
  }

  needsInput(operator: string): boolean {
    return !['blanks', 'nonBlanks'].includes(operator);
  }

  onConditionChange() {
    console.log('Condition changed:', this.filter.condition);
    if (this.filter.autoApply) {
      this.emitFilterChange();
    }
  }

  onSearchChange() {
    console.log('Search changed:', this.filter.searchText);
    if (this.filter.autoApply) {
      this.emitFilterChange();
    }
  }

  onSelectAllChange(event: any) {
    const checked = event.target.checked;
    console.log('Select all changed:', checked);
    this.filter.showAll = checked;
    this.filter.options.forEach(option => option.selected = checked);
    
    if (this.filter.autoApply) {
      this.emitFilterChange();
    }
  }

  onOptionChange(option: FilterOption, event: any) {
    const checked = event.target.checked;
    console.log('Option changed:', option.label, 'checked:', checked);
    option.selected = checked;
    
    // Update showAll based on individual selections
    const selectedCount = this.getVisibleOptions().filter(opt => opt.selected).length;
    const totalCount = this.getVisibleOptions().length;
    
    // Set showAll to false if any option is unselected
    this.filter.showAll = selectedCount === totalCount;
    
    console.log('Updated showAll to:', this.filter.showAll, 'Selected:', selectedCount, 'Total:', totalCount);
    
    if (this.filter.autoApply) {
      this.emitFilterChange();
    }
  }

  onBlanksChange(event: any) {
    this.blanksSelected = event.target.checked;
    console.log('Blanks changed:', this.blanksSelected);
    
    if (this.filter.autoApply) {
      this.emitFilterChange();
    }
  }

  onAutoApplyChange(event: any) {
    this.filter.autoApply = event.target.checked;
    console.log('Auto apply changed:', this.filter.autoApply);
    this.emitFilterChange();
  }

  getFilteredOptions(): FilterOption[] {
    const visibleOptions = this.getVisibleOptions();
    if (!this.filter.searchText) return visibleOptions;
    
    return visibleOptions.filter(option =>
      option.label.toLowerCase().includes(this.filter.searchText.toLowerCase())
    );
  }

  getVisibleOptions(): FilterOption[] {
    return this.filter.options;
  }

  getVisibleOptionsCount(): number {
    return this.getFilteredOptions().length;
  }

  clearFilter() {
    console.log('Clearing filter for column:', this.filter.column);
    this.clearFilterEvent.emit();
    this.currentSort = null;
    this.blanksSelected = false;
    this.isOpen = false;
  }

  applyFilter() {
    console.log('Applying filter for column:', this.filter.column, 'Filter state:', this.filter);
    this.emitFilterChange();
    this.isOpen = false;
  }

  private emitFilterChange() {
    console.log('Emitting filter change for column:', this.filter.column, 'Filter:', this.filter);
    // Create a deep copy to ensure change detection works
    const filterCopy = {
      ...this.filter,
      options: this.filter.options.map(opt => ({ ...opt })),
      condition: this.filter.condition ? { ...this.filter.condition } : undefined
    };
    this.filterChange.emit(filterCopy);
  }
}