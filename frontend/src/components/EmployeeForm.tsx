import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee, EmployeeCreate } from "../types";

const COUNTRIES = ["India", "USA", "UK", "Germany", "Canada"];
const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Sales",
  "Marketing",
  "Operations",
  "Human Resources",
];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract"];

interface EmployeeFormProps {
  initialData?: Employee;
  onSubmit: (data: EmployeeCreate) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function EmployeeForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: EmployeeFormProps) {
  const [form, setForm] = useState<EmployeeCreate>({
    full_name: initialData?.full_name ?? "",
    email: initialData?.email ?? "",
    job_title: initialData?.job_title ?? "",
    department: initialData?.department ?? DEPARTMENTS[0],
    country: initialData?.country ?? COUNTRIES[0],
    salary: initialData?.salary ?? 0,
    employment_type: initialData?.employment_type ?? EMPLOYMENT_TYPES[0],
    hire_date: initialData?.hire_date?.slice(0, 10) ?? "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof EmployeeCreate>(
    field: K,
    value: EmployeeCreate[K],
  ) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          required
          value={form.full_name}
          onChange={(e) => update("full_name", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="job_title">Job title</Label>
        <Input
          id="job_title"
          required
          value={form.job_title}
          onChange={(e) => update("job_title", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Department</Label>
          <Select
            value={form.department}
            onValueChange={(value) => update("department", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Country</Label>
          <Select
            value={form.country}
            onValueChange={(value) => update("country", value)}
          >
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="salary">Salary</Label>
          <Input
            id="salary"
            type="number"
            min={0}
            step="0.01"
            required
            value={form.salary}
            onChange={(e) => update("salary", Number(e.target.value))}
          />
        </div>

        <div className="grid gap-2">
          <Label>Employment type</Label>
          <Select
            value={form.employment_type}
            onValueChange={(value) => update("employment_type", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="hire_date">Hire date</Label>
        <Input
          id="hire_date"
          type="date"
          required
          value={form.hire_date}
          onChange={(e) => update("hire_date", e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
