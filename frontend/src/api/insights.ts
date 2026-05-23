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
