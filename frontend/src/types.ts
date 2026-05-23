export interface Employee {
  id: string;
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  country: string;
  salary: number;
  employment_type: string;
  hire_date: string;
  created_at: string;
}

export interface EmployeeCreate {
  full_name: string;
  email: string;
  job_title: string;
  department: string;
  country: string;
  salary: number;
  employment_type: string;
  hire_date: string;
}

export interface SalaryStats {
  min_salary: number;
  max_salary: number;
  avg_salary: number;
}

export interface TopTitle {
  job_title: string;
  avg_salary: number;
}

export interface DepartmentStat {
  department: string;
  avg_salary: number;
  employee_count: number;
}
