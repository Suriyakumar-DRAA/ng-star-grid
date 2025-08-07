import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnConfig, Employee } from '../../interfaces/data-table.interface';

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
  @Output() filter = new EventEmitter<{ column: keyof Employee, event: MouseEvent }>();

  onFilter(event: MouseEvent): void {
    if (!this.config.filterable || !this.excelFiltersEnabled) return;
    event.stopPropagation();
    this.filter.emit({ column: this.config.key, event });
  }
}