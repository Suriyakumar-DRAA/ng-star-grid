import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, HostListener, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ColumnFilter, FilterOption, FilterCondition, SortOption } from '../../interfaces/filter.interface'; // Corrected import path

@Component({
  selector: 'app-filter-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './filter-dropdown.component.html', // Link to HTML
  styleUrls: ['./filter-dropdown.component.css'] // Link to CSS
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
