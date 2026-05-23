import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getDepartmentBreakdown,
  getSalaryStats,
  getTopPayingTitles,
} from "../api/insights";
import type { DepartmentStat, SalaryStats, TopTitle } from "../types";

const COUNTRIES = ["India", "USA", "UK", "Germany", "Canada"];

function formatSalary(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function InsightsPage() {
  const [country, setCountry] = useState<string>(COUNTRIES[0]);
  const [stats, setStats] = useState<SalaryStats | null>(null);
  const [topTitles, setTopTitles] = useState<TopTitle[]>([]);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatsError(null);

    getSalaryStats(country)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setStats(null);
        const message =
          err?.response?.status === 404
            ? `No employees found for ${country}.`
            : err instanceof Error
              ? err.message
              : "Failed to load salary stats";
        setStatsError(message);
      });

    getTopPayingTitles(country)
      .then((data) => {
        if (!cancelled) setTopTitles(data);
      })
      .catch(() => {
        if (!cancelled) setTopTitles([]);
      });

    return () => {
      cancelled = true;
    };
  }, [country]);

  useEffect(() => {
    let cancelled = false;
    getDepartmentBreakdown()
      .then((data) => {
        if (!cancelled) setDepartments(data);
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Country</span>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Salary stats — {country}</CardTitle>
          <CardDescription>
            Min, max, and average salary for the selected country.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsError && (
            <p className="text-sm text-muted-foreground">{statsError}</p>
          )}
          {stats && !statsError && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Minimum</p>
                <p className="text-2xl font-semibold">
                  {formatSalary(stats.min_salary)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Average</p>
                <p className="text-2xl font-semibold">
                  {formatSalary(stats.avg_salary)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Maximum</p>
                <p className="text-2xl font-semibold">
                  {formatSalary(stats.max_salary)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top paying job titles — {country}</CardTitle>
          <CardDescription>
            Average salary by job title, ranked highest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topTitles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topTitles}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="job_title" interval={0} angle={-20} textAnchor="end" height={70} />
                <YAxis tickFormatter={(v) => formatSalary(v)} width={90} />
                <Tooltip formatter={(value: number) => formatSalary(value)} />
                <Bar dataKey="avg_salary" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department breakdown</CardTitle>
          <CardDescription>
            Average salary and headcount per department (across all countries).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Average salary</TableHead>
                  <TableHead className="text-right">Employee count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No data available.
                    </TableCell>
                  </TableRow>
                )}
                {departments.map((row) => (
                  <TableRow key={row.department}>
                    <TableCell>{row.department}</TableCell>
                    <TableCell className="text-right">
                      {formatSalary(row.avg_salary)}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.employee_count}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
