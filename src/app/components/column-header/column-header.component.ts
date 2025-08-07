import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnConfig } from '../../interfaces/data-table.interface';

@Component({
  selector: 'app-column-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './column-header.component.html',
  styleUrls: ['./column-header.component.scss'],
  encapsulation: ViewEncapsulation.Emulated
})
export class ColumnHeaderComponent {
  @Input() config!: ColumnConfig;
  @Input() hasActiveFilter = false;
  @Input() excelFiltersEnabled = false;
  @Input() sortDirection: 'asc' | 'desc' | null = null;
  @Output() filter = new EventEmitter<{ column: string, event: MouseEvent }>();
  @Output() sort = new EventEmitter<{ column: string, direction: 'asc' | 'desc' }>();

  onFilter(event: MouseEvent): void {
    if (!this.config.filterable || !this.excelFiltersEnabled) return;
    event.stopPropagation();
    this.filter.emit({ column: this.config.key, event });
  }

  onHeaderClick(): void {
    if (!this.config.sortable) return;

    let newDirection: 'asc' | 'desc';
    if (this.sortDirection === 'asc') {
      newDirection = 'desc';
    } else {
      newDirection = 'asc';
    }

    console.log('Header clicked, emitting sort:', this.config.key, newDirection);
    this.sort.emit({ column: this.config.key, direction: newDirection });
  }
}