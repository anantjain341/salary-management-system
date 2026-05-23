import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EmployeeForm from "../components/EmployeeForm";
import EmployeeSearch from "../components/EmployeeSearch";
import {
  createEmployee,
  deleteEmployee,
  getEmployeeCount,
  getEmployees,
  updateEmployee,
} from "../api/employees";
import type { Employee, EmployeeCreate } from "../types";

const PAGE_SIZE = 10;

function formatSalary(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return value.slice(0, 10);
}

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, count] = await Promise.all([
        getEmployees(page, PAGE_SIZE),
        getEmployeeCount(),
      ]);
      setEmployees(data);
      setTotal(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const isFiltered = selectedEmployees.length > 0;
  const displayed = isFiltered ? selectedEmployees : employees;

  const handleCreate = async (data: EmployeeCreate) => {
    try {
      await createEmployee(data);
      setCreating(false);
      await load();
    } catch (err) {
      console.error("Failed to create employee:", err);
      throw err;
    }
  };

  const handleUpdate = async (data: EmployeeCreate) => {
    if (!editing) return;
    try {
      const updated = await updateEmployee(editing.id, data);
      setSelectedEmployees((prev) =>
        prev.map((e) => (e.id === updated.id ? updated : e)),
      );
      setEditing(null);
      await load();
    } catch (err) {
      console.error("Failed to update employee:", err);
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    try {
      await deleteEmployee(targetId);
      setSelectedEmployees((prev) => prev.filter((e) => e.id !== targetId));
      setDeleteTarget(null);
      await load();
    } catch (err) {
      console.error("Failed to delete employee:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <EmployeeSearch
          selected={selectedEmployees}
          onChange={setSelectedEmployees}
        />
        <Button onClick={() => setCreating(true)}>Add employee</Button>
      </div>

      {error && <p className="text-sm text-destructive">Error: {error}</p>}

      <div className="overflow-x-auto w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Job title</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="text-right">Salary</TableHead>
              <TableHead>Employment type</TableHead>
              <TableHead>Hire date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !isFiltered && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {(!loading || isFiltered) && displayed.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No employees found.
                </TableCell>
              </TableRow>
            )}
            {(!loading || isFiltered) &&
              displayed.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">
                    {employee.full_name}
                  </TableCell>
                  <TableCell className="max-w-[160px] truncate">
                    {employee.email}
                  </TableCell>
                  <TableCell>{employee.job_title}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.country}</TableCell>
                  <TableCell className="text-right">
                    {formatSalary(employee.salary)}
                  </TableCell>
                  <TableCell>{employee.employment_type}</TableCell>
                  <TableCell>{formatDate(employee.hire_date)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditing(employee)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteTarget(employee)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {!isFiltered && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} · showing {employees.length} on this page
            {total !== null && ` · ${total} total`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={
                loading ||
                employees.length < PAGE_SIZE ||
                (total !== null && page * PAGE_SIZE >= total)
              }
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {isFiltered && (
        <p className="text-sm text-muted-foreground">
          Showing {selectedEmployees.length} selected employee
          {selectedEmployees.length === 1 ? "" : "s"}.
          Clear the search to see the full list.
        </p>
      )}

      <Dialog open={creating} onOpenChange={(open) => !open && setCreating(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            submitLabel="Create"
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit employee</DialogTitle>
          </DialogHeader>
          {editing && (
            <EmployeeForm
              initialData={editing}
              onSubmit={handleUpdate}
              onCancel={() => setEditing(null)}
              submitLabel="Update"
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this employee?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget &&
                `${deleteTarget.full_name} will be permanently removed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
