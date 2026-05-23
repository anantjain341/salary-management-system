import { useEffect, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getAvgSalaryByTitle,
  getDepartmentBreakdown,
  getJobTitles,
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

function formatSalaryCompact(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export default function InsightsPage() {
  const [country, setCountry] = useState<string>(COUNTRIES[0]);
  const [stats, setStats] = useState<SalaryStats | null>(null);
  const [topTitles, setTopTitles] = useState<TopTitle[]>([]);
  const [departments, setDepartments] = useState<DepartmentStat[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [lookupCountry, setLookupCountry] = useState<string>(COUNTRIES[0]);
  const [lookupTitle, setLookupTitle] = useState<string>("");
  const [debouncedTitle, setDebouncedTitle] = useState<string>("");
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [lookupResult, setLookupResult] = useState<number | null>(null);
  const [lookupState, setLookupState] = useState<
    "idle" | "loading" | "not_found" | "error"
  >("idle");
  const lookupContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedTitle(lookupTitle.trim()), 400);
    return () => clearTimeout(handle);
  }, [lookupTitle]);

  useEffect(() => {
    let cancelled = false;
    getJobTitles(lookupCountry, lookupTitle.trim() || undefined)
      .then((titles) => {
        if (!cancelled) setTitleSuggestions(titles);
      })
      .catch(() => {
        if (!cancelled) setTitleSuggestions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [lookupCountry, lookupTitle]);

  useEffect(() => {
    if (!debouncedTitle) {
      setLookupResult(null);
      setLookupState("idle");
      return;
    }
    let cancelled = false;
    setLookupState("loading");
    getAvgSalaryByTitle(lookupCountry, debouncedTitle)
      .then((value) => {
        if (cancelled) return;
        setLookupResult(value);
        setLookupState("idle");
      })
      .catch((err) => {
        if (cancelled) return;
        setLookupResult(null);
        setLookupState(err?.response?.status === 404 ? "not_found" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [lookupCountry, debouncedTitle]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        lookupContainerRef.current &&
        !lookupContainerRef.current.contains(event.target as Node)
      ) {
        setSuggestionsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      <Card className="overflow-visible relative z-20">
        <CardHeader>
          <CardTitle>Average salary by job title</CardTitle>
          <CardDescription>
            Look up the average salary for a specific job title in a country.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[1fr_2fr_auto] items-end">
            <div className="grid gap-2">
              <Label>Country</Label>
              <Select value={lookupCountry} onValueChange={setLookupCountry}>
                <SelectTrigger>
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
            <div className="grid gap-2">
              <Label htmlFor="lookup-title">Job title</Label>
              <div ref={lookupContainerRef} className="relative">
                <Input
                  id="lookup-title"
                  placeholder="e.g. Software Engineer"
                  value={lookupTitle}
                  onChange={(e) => {
                    setLookupTitle(e.target.value);
                    setSuggestionsOpen(true);
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setSuggestionsOpen(false);
                  }}
                  autoComplete="off"
                />
                {suggestionsOpen && titleSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-lg max-h-64">
                    {titleSuggestions.map((title) => (
                      <button
                        key={title}
                        type="button"
                        onClick={() => {
                          setLookupTitle(title);
                          setSuggestionsOpen(false);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="min-w-[180px]">
              {lookupState === "loading" && (
                <p className="text-sm text-muted-foreground">Looking up…</p>
              )}
              {lookupState === "idle" && lookupResult !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-semibold">
                    {formatSalary(lookupResult)}
                  </p>
                </div>
              )}
              {lookupState === "idle" && lookupResult === null && (
                <p className="text-sm text-muted-foreground">
                  Enter a job title to look up.
                </p>
              )}
              {lookupState === "not_found" && (
                <p className="text-sm text-muted-foreground">
                  No employees match.
                </p>
              )}
              {lookupState === "error" && (
                <p className="text-sm text-destructive">Lookup failed.</p>
              )}
            </div>
          </div>
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
            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={topTitles}
                margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="job_title"
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={80}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={(v) => formatSalaryCompact(Number(v))}
                  width={64}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  domain={[0, (dataMax: number) => Math.ceil(dataMax * 1.15)]}
                />
                <Tooltip
                  cursor={{ fill: "rgba(37, 99, 235, 0.08)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: 13,
                  }}
                  formatter={(value) => [formatSalary(Number(value)), "Avg salary"]}
                  labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                />
                <Bar
                  dataKey="avg_salary"
                  fill="#2563eb"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={56}
                />
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
