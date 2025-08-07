import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { DataTableComponent } from './app/components/data-table/data-table.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="ag-container">
      <main>
        <app-data-table></app-data-table>
      </main>
    </div>
  `,
  styles: [`
    @media (max-width: 768px) {
      .app-container {
        padding: 1rem;
      }
      
      .display-4 {
        font-size: 2.5rem;
      }
      
      .lead {
        font-size: 1rem;
      }
    }
  `]
})
export class App {}

bootstrapApplication(App);