import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { DataTableComponent } from './app/components/data-table/data-table.component';
import { ColumnConfig } from './app/interfaces/data-table.interface';

export interface Employee {
  id: number;
  name: string;
  url: string;
  email: string;
  department: string;
  salary: number;
  active: boolean;
  joinDate: string;
  location: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <div class="ag-container">
      <main>
        <app-data-table [data]="data" [columns]="columns"></app-data-table>
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
export class App {
  data: Array<any> = [];
  columns: Array<ColumnConfig> = []

  constructor() {
    this.columns = this.generateColumnConfig();
    this.data = this.generateSampleData();

  }

  private generateSampleData(): Employee[] {
    const departments = ['Marketing', 'Design', 'Operations', 'Legal', 'IT', 'HR', 'Finance', 'Customer Service', 'Engineering'];
    const locations = ['Memphis', 'Oklahoma City', 'Miami', 'Boston', 'Charlotte', 'Indianapolis', 'Milwaukee', 'Baltimore', 'El Paso', 'Omaha', 'Las Vegas', 'Chicago'];
    const firstNames = ['Jason', 'Andrea', 'Helen', 'Ashley', 'Larry', 'Michael', 'Edward', 'Rachel', 'Heather', 'Stephen', 'Janet', 'Rachel'];
    const lastNames = ['Ramirez', 'Nguyen', 'White', 'Phillips', 'Brown', 'Green', 'Rogers', 'Reyes', 'Richardson', 'Allen', 'Ortiz', 'Perez', 'Garcia'];

    const data: Employee[] = [];
    for (let i = 1; i <= 100000; i++) {
      data.push({
        id: i,
        url: `https://example.com/employee/${i}`,
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
        email: `employee${i}@company.com`,
        department: departments[Math.floor(Math.random() * departments.length)],
        salary: Math.floor(Math.random() * 100000) + 40000,
        active: Math.random() > 0.1,
        joinDate: this.randomDate(new Date(2020, 0, 1), new Date()).toISOString().split('T')[0],
        location: locations[Math.floor(Math.random() * locations.length)]
      });
    }
    return data;
  }

  private generateColumnConfig(): Array<ColumnConfig> {
    return [
      { key: 'name', label: 'Name', class: 'name', type: 'text', sortable: true, filterable: true },
      { key: 'email', label: 'Email', type: 'text', sortable: true, filterable: true },
      { key: 'department', label: 'Department', type: 'text', sortable: true, filterable: true },
      {
        key: 'salary', label: 'Salary', type: 'currency', symbol: true, sortable: true, filterable: true,
        highlightColumn: {
          type: 'badge',
          getClassFn: (value) => {
            if (value > 100000) return 'badge bg-success';
            if (value >= 50000 && value <= 100000) return 'badge bg-warning text-dark';
            return 'badge bg-danger';
          }
        }
      },
      {
        key: 'active', label: 'Active', type: 'boolean', sortable: true, filterable: true,
        displayDataFn(value, row) {
          return value ? 'Y' : 'N';
        },
      },
      { key: 'joinDate', label: 'Join Date', type: 'date', format: 'dd-MMM-yyyy', sortable: true, filterable: true },
      { key: 'location', label: 'Location', type: 'text', sortable: true, filterable: true }
    ];
  }

  private randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

}

bootstrapApplication(App);