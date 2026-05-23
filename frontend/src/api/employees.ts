import client from "./client";
import type { Employee, EmployeeCreate } from "../types";

export async function getEmployees(
  page: number = 1,
  pageSize: number = 10,
): Promise<Employee[]> {
  const skip = (page - 1) * pageSize;
  const response = await client.get<Employee[]>("/employees", {
    params: { skip, limit: pageSize },
  });
  return response.data;
}

export async function getEmployee(id: string): Promise<Employee> {
  const response = await client.get<Employee>(`/employees/${id}`);
  return response.data;
}

export async function createEmployee(
  data: EmployeeCreate,
): Promise<Employee> {
  const response = await client.post<Employee>("/employees", data);
  return response.data;
}

export async function updateEmployee(
  id: string,
  data: Partial<EmployeeCreate>,
): Promise<Employee> {
  const response = await client.put<Employee>(`/employees/${id}`, data);
  return response.data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await client.delete(`/employees/${id}`);
}

export async function getEmployeeCount(): Promise<number> {
  const response = await client.get<{ total: number }>("/employees/count");
  return response.data.total;
}
