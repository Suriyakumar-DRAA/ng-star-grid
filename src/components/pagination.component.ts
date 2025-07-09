import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaginationResponse } from '../interfaces/pagination.interface';
import { TableData } from '../interfaces/filter.interface';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pagination-container" *ngIf="paginationData">
      <div class="pagination-info">
        <div class="records-info">
          Showing {{getStartRecord()}} to {{getEndRecord()}} of {{paginationData.totalCount}} records
        </div>
        
        <div class="page-size-selector">
          <label for="pageSize">Show:</label>
          <select 
            id="pageSize" 
            [value]="paginationData.pageSize" 
            (change)="onPageSizeChange($event)"
            class="page-size-select">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span>per page</span>
        </div>
      </div>

      <div class="pagination-controls">
        <button 
          class="pagination-btn"
          [disabled]="!paginationData.hasPreviousPage"
          (click)="goToPage(1)"
          title="First page">
          ⟪
        </button>
        
        <button 
          class="pagination-btn"
          [disabled]="!paginationData.hasPreviousPage"
          (click)="goToPage(paginationData.currentPage - 1)"
          title="Previous page">
          ⟨
        </button>

        <div class="page-numbers">
          <button 
            *ngFor="let page of getVisiblePages()"
            class="page-btn"
            [class.active]="page === paginationData.currentPage"
            [class.ellipsis]="page === '...'"
            [disabled]="page === '...'"
            (click)="page !== '...' && goToPage(page)">
            {{page}}
          </button>
        </div>

        <button 
          class="pagination-btn"
          [disabled]="!paginationData.hasNextPage"
          (click)="goToPage(paginationData.currentPage + 1)"
          title="Next page">
          ⟩
        </button>
        
        <button 
          class="pagination-btn"
          [disabled]="!paginationData.hasNextPage"
          (click)="goToPage(paginationData.totalPages)"
          title="Last page">
          ⟫
        </button>
      </div>

      <div class="page-jump">
        <label for="pageJump">Go to page:</label>
        <input 
          id="pageJump"
          type="number" 
          [min]="1" 
          [max]="paginationData.totalPages"
          [(ngModel)]="jumpToPage"
          (keyup.enter)="goToPage(jumpToPage)"
          class="page-jump-input">
        <button 
          class="go-btn"
          [disabled]="!isValidPage(jumpToPage)"
          (click)="goToPage(jumpToPage)">
          Go
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pagination-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f8fafc;
      border-top: 1px solid #e5e7eb;
      flex-wrap: wrap;
      gap: 16px;
    }

    .pagination-info {
      display: flex;
      align-items: center;
      gap: 24px;
      flex-wrap: wrap;
    }

    .records-info {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
    }

    .page-size-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #374151;
    }

    .page-size-select {
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      font-size: 14px;
      cursor: pointer;
    }

    .page-size-select:focus {
      border-color: #3b82f6;
      outline: none;
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .pagination-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      transition: all 0.2s ease;
    }

    .pagination-btn:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .pagination-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f9fafb;
    }

    .page-numbers {
      display: flex;
      gap: 2px;
      margin: 0 8px;
    }

    .page-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      height: 32px;
      padding: 0 8px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      transition: all 0.2s ease;
    }

    .page-btn:hover:not(:disabled):not(.ellipsis) {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .page-btn.active {
      background: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .page-btn.ellipsis {
      border: none;
      background: transparent;
      cursor: default;
      color: #9ca3af;
    }

    .page-jump {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #374151;
    }

    .page-jump-input {
      width: 60px;
      padding: 4px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      text-align: center;
      font-size: 14px;
    }

    .page-jump-input:focus {
      border-color: #3b82f6;
      outline: none;
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.2);
    }

    .go-btn {
      padding: 4px 12px;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      transition: all 0.2s ease;
    }

    .go-btn:hover:not(:disabled) {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .go-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .pagination-container {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }

      .pagination-info {
        justify-content: space-between;
        flex-wrap: nowrap;
      }

      .pagination-controls {
        justify-content: center;
      }

      .page-jump {
        justify-content: center;
      }

      .page-numbers {
        margin: 0 4px;
      }

      .page-btn {
        min-width: 28px;
        height: 28px;
        font-size: 13px;
      }

      .pagination-btn {
        width: 28px;
        height: 28px;
        font-size: 13px;
      }
    }
  `]
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