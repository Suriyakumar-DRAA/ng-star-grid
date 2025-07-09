import { Injectable } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';
import { PaginationRequest, PaginationResponse, FilterMetadata, ServerFilter, ServerSort } from '../interfaces/pagination.interface';
import { TableData } from '../interfaces/filter.interface';

@Injectable({
  providedIn: 'root'
})
export class ServerDataService {
  // Simulated server data - in real implementation, this would be API calls
  private allData: TableData[] = this.generateLargeDataset();

  constructor() {}

  // Simulate server-side data fetching with pagination
  getPagedData(request: PaginationRequest): Observable<PaginationResponse<TableData>> {
    console.log('ServerDataService: Processing request', request);
    
    return of(null).pipe(
      delay(500), // Simulate network delay
      map(() => {
        try {
          let filteredData = [...this.allData];
          console.log('ServerDataService: Starting with', filteredData.length, 'records');

          // Apply server-side filters
          if (request.filters && request.filters.length > 0) {
            console.log('ServerDataService: Applying', request.filters.length, 'filters');
            filteredData = this.applyServerFilters(filteredData, request.filters);
            console.log('ServerDataService: After filtering:', filteredData.length, 'records remain');
          }

          // Apply server-side sorting
          if (request.sort) {
            console.log('ServerDataService: Applying sort:', request.sort);
            filteredData = this.applyServerSort(filteredData, request.sort);
          }

          const totalCount = filteredData.length;
          const totalPages = Math.ceil(totalCount / request.pageSize);
          const startIndex = (request.page - 1) * request.pageSize;
          const endIndex = startIndex + request.pageSize;
          const pageData = filteredData.slice(startIndex, endIndex);

          const response: PaginationResponse<TableData> = {
            data: pageData,
            totalCount,
            currentPage: request.page,
            totalPages,
            pageSize: request.pageSize,
            hasNextPage: request.page < totalPages,
            hasPreviousPage: request.page > 1
          };

          console.log('ServerDataService: Returning response', {
            page: response.currentPage,
            totalPages: response.totalPages,
            dataLength: response.data.length,
            totalCount: response.totalCount
          });

          return response;
        } catch (error) {
          console.error('ServerDataService: Error processing data request:', error);
          throw error;
        }
      })
    );
  }

  // Get distinct values for a column (for filter dropdowns)
  getColumnMetadata(column: string, searchText?: string): Observable<FilterMetadata> {
    return of(null).pipe(
      delay(150), // Simulate network delay
      map(() => {
        try {
          let distinctValues = [...new Set(this.allData.map(item => item[column]))]
            .filter(value => value !== null && value !== undefined)
            .sort();

          // Apply search filter if provided
          if (searchText && searchText.trim()) {
            distinctValues = distinctValues.filter(value =>
              value.toString().toLowerCase().includes(searchText.toLowerCase())
            );
          }

          console.log('ServerDataService: Column metadata for', column, ':', distinctValues.length, 'distinct values');

          return {
            column,
            distinctValues: distinctValues.slice(0, 100), // Limit to 100 items for performance
            totalCount: distinctValues.length
          };
        } catch (error) {
          console.error('ServerDataService: Error getting column metadata:', error);
          throw error;
        }
      })
    );
  }

  private applyServerFilters(data: TableData[], filters: ServerFilter[]): TableData[] {
    console.log('ServerDataService: Applying filters to', data.length, 'records');
    
    return data.filter(item => {
      const passes = filters.every(filter => {
        const value = item[filter.column];
        
        try {
          let result = false;
          
          switch (filter.operator) {
            case 'equals':
              result = value == filter.value;
              break;
            case 'notEquals':
              result = value != filter.value;
              break;
            case 'contains':
              result = value && value.toString().toLowerCase().includes(filter.value.toLowerCase());
              break;
            case 'startsWith':
              result = value && value.toString().toLowerCase().startsWith(filter.value.toLowerCase());
              break;
            case 'endsWith':
              result = value && value.toString().toLowerCase().endsWith(filter.value.toLowerCase());
              break;
            case 'greaterThan':
              result = Number(value) > Number(filter.value);
              break;
            case 'greaterThanOrEqual':
              result = Number(value) >= Number(filter.value);
              break;
            case 'lessThan':
              result = Number(value) < Number(filter.value);
              break;
            case 'lessThanOrEqual':
              result = Number(value) <= Number(filter.value);
              break;
            case 'between':
              const num = Number(value);
              result = num >= Number(filter.value) && num <= Number(filter.value2);
              break;
            case 'in':
              // Handle the 'in' operator properly
              if (!filter.values || !Array.isArray(filter.values)) {
                console.warn('ServerDataService: Invalid values for "in" filter:', filter);
                result = true; // Don't filter if values are invalid
              } else if (filter.values.length === 0) {
                // If empty array, nothing should match
                result = false;
              } else {
                result = filter.values.includes(value);
              }
              
              // Log for department column to help debug
              if (filter.column === 'department') {
                console.log(`ServerDataService: IN filter - ${value} in [${filter.values?.join(', ') || 'undefined'}] = ${result}`);
              }
              break;
            case 'notIn':
              if (!filter.values || !Array.isArray(filter.values)) {
                result = true;
              } else {
                result = !filter.values.includes(value);
              }
              break;
            case 'isNull':
              result = value === null || value === undefined || value === '';
              break;
            case 'isNotNull':
              result = value !== null && value !== undefined && value !== '';
              break;
            default:
              console.warn('ServerDataService: Unknown filter operator:', filter.operator);
              result = true;
          }
          
          return result;
        } catch (error) {
          console.error('ServerDataService: Error applying filter:', filter, error);
          return true; // Include item if filter fails
        }
      });
      
      return passes;
    });
  }

  private applyServerSort(data: TableData[], sort: ServerSort): TableData[] {
    return data.sort((a, b) => {
      const aVal = a[sort.column];
      const bVal = b[sort.column];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      else if (aVal > bVal) comparison = 1;
      
      return sort.direction === 'desc' ? -comparison : comparison;
    });
  }

  private generateLargeDataset(): TableData[] {
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

    const employees: TableData[] = [];

    // Generate 10,000 employees for demonstration
    for (let i = 1; i <= 10000; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const name = `${firstName} ${lastName}`;
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.com`;
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

    console.log('ServerDataService: Generated dataset with', employees.length, 'employees');
    return employees;
  }
}