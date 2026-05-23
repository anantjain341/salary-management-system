import client from "./client";
import type { SalaryStats, TopTitle, DepartmentStat } from "../types";

export async function getSalaryStats(country: string): Promise<SalaryStats> {
  const response = await client.get<SalaryStats>("/insights/salary-stats", {
    params: { country },
  });
  return response.data;
}

export async function getTopPayingTitles(
  country: string,
): Promise<TopTitle[]> {
  const response = await client.get<TopTitle[]>(
    "/insights/top-paying-titles",
    { params: { country } },
  );
  return response.data;
}

export async function getDepartmentBreakdown(): Promise<DepartmentStat[]> {
  const response = await client.get<DepartmentStat[]>(
    "/insights/department-breakdown",
  );
  return response.data;
}

export async function getAvgSalaryByTitle(
  country: string,
  jobTitle: string,
): Promise<number> {
  const response = await client.get<{ avg_salary: number }>(
    "/insights/avg-salary",
    { params: { country, job_title: jobTitle } },
  );
  return response.data.avg_salary;
}

export async function getJobTitles(
  country: string,
  search?: string,
): Promise<string[]> {
  const params: Record<string, string> = { country };
  if (search) params.search = search;
  const response = await client.get<string[]>("/insights/job-titles", {
    params,
  });
  return response.data;
}
