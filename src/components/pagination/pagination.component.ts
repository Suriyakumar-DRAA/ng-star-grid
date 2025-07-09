import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationResponse } from '../../interfaces/pagination.interface';
import { TableData } from '../../interfaces/filter.interface'; // Assuming TableData is still needed for context, though not directly used in this component's logic

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagination.component.html', // Linked to external HTML file
  styleUrls: ['./pagination.component.css'] // Linked to external CSS file
})
export class PaginationComponent {
  @Input() paginationData: PaginationResponse<TableData> | null = null;
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  jumpToPage: number = 1;

  goToPage(page: number | string) {
    if (typeof page === 'string' || !this.paginationData) return;
    
    if (page >= 1 && page <= this.paginationData.totalPages) {
      this.pageChange.emit(page);
      this.jumpToPage = page;
    }
  }

  onPageSizeChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value, 10);
    this.pageSizeChange.emit(newPageSize);
  }

  getStartRecord(): number {
    if (!this.paginationData) return 0;
    return (this.paginationData.currentPage - 1) * this.paginationData.pageSize + 1;
  }

  getEndRecord(): number {
    if (!this.paginationData) return 0;
    const end = this.paginationData.currentPage * this.paginationData.pageSize;
    return Math.min(end, this.paginationData.totalCount);
  }

  getVisiblePages(): (number | string)[] {
    if (!this.paginationData) return [];
    
    const current = this.paginationData.currentPage;
    const total = this.paginationData.totalPages;
    const delta = 2; // Number of pages to show on each side of current page
    
    if (total <= 7) {
      // Show all pages if total is small
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    // Add ellipsis if needed
    if (current - delta > 2) {
      pages.push('...');
    }
    
    // Add pages around current page
    const start = Math.max(2, current - delta);
    const end = Math.min(total - 1, current + delta);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if needed
    if (current + delta < total - 1) {
      pages.push('...');
    }
    
    // Always show last page (if not already included)
    if (total > 1) {
      pages.push(total);
    }
    
    return pages;
  }

  isValidPage(page: number): boolean {
    return this.paginationData ? 
      page >= 1 && page <= this.paginationData.totalPages : false;
  }
}
