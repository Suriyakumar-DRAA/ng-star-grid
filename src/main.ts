import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from './components/data-table.component';
import { ServerDataTableComponent } from './components/server-data-table.component';
import { TableColumn } from './interfaces/filter.interface';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DataTableComponent, ServerDataTableComponent],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>Excel-like Data Filter Demo</h1>
        <p>Interactive data table with advanced filtering capabilities</p>
        
        <div class="demo-selector">
          <button 
            class="demo-btn"
            [class.active]="currentDemo === 'client'"
            (click)="currentDemo = 'client'">
            Client-Side (200 records)
          </button>
          <button 
            class="demo-btn"
            [class.active]="currentDemo === 'server'"
            (click)="currentDemo = 'server'">
            Server-Side (10,000 records)
          </button>
        </div>
      </header>
      
      <main class="app-main">
        <app-data-table 
          *ngIf="currentDemo === 'client'"
          [data]="sampleData" 
          [columns]="columns">
        </app-data-table>
        
        <app-server-data-table
          *ngIf="currentDemo === 'server'"
          [columns]="columns">
        </app-server-data-table>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
    }

    .app-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .app-header h1 {
      color: #1f2937;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 10px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .app-header p {
      color: #6b7280;
      font-size: 1.1rem;
      margin: 0 0 20px 0;
    }

    .demo-selector {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin-top: 20px;
    }

    .demo-btn {
      padding: 12px 24px;
      border: 2px solid #3b82f6;
      background: white;
      color: #3b82f6;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s ease;
    }

    .demo-btn:hover {
      background: #eff6ff;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
    }

    .demo-btn.active {
      background: #3b82f6;
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .app-main {
      max-width: 1400px;
      margin: 0 auto;
    }

    @media (max-width: 768px) {
      .app-container {
        padding: 10px;
      }
      
      .app-header h1 {
        font-size: 2rem;
      }

      .demo-selector {
        flex-direction: column;
        align-items: center;
      }

      .demo-btn {
        width: 100%;
        max-width: 300px;
      }
    }
  `]
})
export class App {
  currentDemo: 'client' | 'server' = 'client';

  columns: TableColumn[] = [
    { key: 'id', label: 'ID', type: 'number', sortable: true },
    { key: 'name', label: 'Name', type: 'text', sortable: true },
    { key: 'email', label: 'Email', type: 'text', sortable: true },
    { key: 'department', label: 'Department', type: 'text', sortable: true },
    { key: 'salary', label: 'Salary', type: 'number', sortable: true },
    { key: 'isActive', label: 'Active', type: 'boolean', sortable: true },
    { key: 'joinDate', label: 'Join Date', type: 'date', sortable: true },
    { key: 'location', label: 'Location', type: 'text', sortable: true }
  ];

  sampleData = this.generateEmployeeData();

  private generateEmployeeData() {
    const firstNames = [
      'John', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa', 'Tom', 'Anna', 'Chris', 'Jennifer',
      'Robert', 'Maria', 'James', 'Jessica', 'Michael', 'Ashley', 'William', 'Amanda', 'Richard', 'Stephanie',
      'Joseph', 'Nicole', 'Thomas', 'Elizabeth', 'Charles', 'Helen', 'Christopher', 'Deborah', 'Daniel', 'Rachel',
      'Matthew', 'Carolyn', 'Anthony', 'Janet', 'Mark', 'Catherine', 'Donald', 'Frances', 'Steven', 'Samantha',
      'Paul', 'Debra', 'Andrew', 'Rachel', 'Joshua', 'Carolyn', 'Kenneth', 'Janet', 'Kevin', 'Virginia',
      'Brian', 'Maria', 'George', 'Heather', 'Timothy', 'Diane', 'Ronald', 'Julie', 'Jason', 'Joyce',
      'Edward', 'Victoria', 'Jeffrey', 'Kelly', 'Ryan', 'Christina', 'Jacob', 'Joan', 'Gary', 'Evelyn',
      'Nicholas', 'Lauren', 'Eric', 'Judith', 'Jonathan', 'Megan', 'Stephen', 'Cheryl', 'Larry', 'Andrea'
    ];

    const lastNames = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
      'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
      'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
      'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
      'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
      'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson'
    ];

    const departments = [
      'Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Customer Service', 'IT',
      'Legal', 'Research & Development', 'Quality Assurance', 'Product Management', 'Design', 'Security'
    ];

    const locations = [
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego',
      'Dallas', 'San Jose', 'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte', 'San Francisco',
      'Indianapolis', 'Seattle', 'Denver', 'Washington DC', 'Boston', 'El Paso', 'Nashville', 'Detroit',
      'Oklahoma City', 'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore', 'Milwaukee', 'Albuquerque',
      'Tucson', 'Fresno', 'Sacramento', 'Kansas City', 'Mesa', 'Atlanta', 'Omaha', 'Colorado Springs',
      'Raleigh', 'Miami', 'Virginia Beach', 'Oakland', 'Minneapolis', 'Tulsa', 'Arlington', 'Tampa'
    ];

    const employees = [];

    for (let i = 1; i <= 200; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@company.com`;
      const department = departments[Math.floor(Math.random() * departments.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      
      // Generate salary based on department with some randomness
      let baseSalary = 50000;
      switch (department) {
        case 'Engineering':
        case 'IT':
        case 'Security':
          baseSalary = 85000;
          break;
        case 'Product Management':
        case 'Research & Development':
          baseSalary = 90000;
          break;
        case 'Legal':
        case 'Finance':
          baseSalary = 75000;
          break;
        case 'Sales':
        case 'Marketing':
          baseSalary = 65000;
          break;
        case 'Design':
        case 'Quality Assurance':
          baseSalary = 70000;
          break;
        case 'Operations':
        case 'Customer Service':
          baseSalary = 55000;
          break;
        case 'HR':
          baseSalary = 60000;
          break;
      }
      
      // Add random variation of ±20%
      const salary = Math.floor(baseSalary + (Math.random() - 0.5) * baseSalary * 0.4);
      
      // Generate random join date within last 3 years
      const startDate = new Date('2021-01-01');
      const endDate = new Date('2024-12-31');
      const joinDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      
      // 85% chance of being active
      const isActive = Math.random() > 0.15;

      employees.push({
        id: i,
        name,
        email,
        department,
        salary,
        isActive,
        joinDate,
        location
      });
    }

    return employees;
  }
}

bootstrapApplication(App);