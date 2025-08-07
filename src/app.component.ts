import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from './components/data-table/data-table.component';
import { ServerDataTableComponent } from './components/server-data-table/server-data-table.component';
import { TableColumn } from './interfaces/filter.interface';
import { ColumnConfig } from './types/column.types';

@Component({
  selector: 'app-root',
  standalone: true, // Indicates this is a standalone component
  imports: [CommonModule, DataTableComponent, ServerDataTableComponent], // Import necessary modules and components
  templateUrl: './app.component.html', // Link to the HTML template
  styleUrls: ['./app.component.css'] // Link to the CSS styles
})
export class AppComponent {
  currentDemo: 'client' | 'server' = 'client';

  columns: ColumnConfig[] = [
    { key: 'name', label: 'Name', type: 'text', sortable: true },
    { key: 'email', label: 'Email', type: 'text', sortable: true },
    { key: 'department', label: 'Department', type: 'text', sortable: true },
    { key: 'salary', label: 'Salary', type: 'currency', sortable: true },
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