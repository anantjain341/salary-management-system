import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { X } from "lucide-react";
import { getEmployees } from "../api/employees";
import type { Employee } from "../types";

interface EmployeeSearchProps {
  selected: Employee[];
  onChange: (next: Employee[]) => void;
}

export default function EmployeeSearch({
  selected,
  onChange,
}: EmployeeSearchProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");
  const [results, setResults] = useState<Employee[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedValue(inputValue), 300);
    return () => clearTimeout(handle);
  }, [inputValue]);

  useEffect(() => {
    if (!debouncedValue) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getEmployees(1, 10, debouncedValue)
      .then((data) => {
        if (cancelled) return;
        const selectedIds = new Set(selected.map((s) => s.id));
        setResults(data.filter((e) => !selectedIds.has(e.id)));
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedValue, selected]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectResult = (employee: Employee) => {
    onChange([...selected, employee]);
    setInputValue("");
    setDebouncedValue("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const removeChip = (id: string) => {
    onChange(selected.filter((e) => e.id !== id));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    } else if (
      event.key === "Backspace" &&
      inputValue === "" &&
      selected.length > 0
    ) {
      removeChip(selected[selected.length - 1].id);
    }
  };

  const showDropdown = isOpen && debouncedValue.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div
        className="flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 min-h-9 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        onClick={() => inputRef.current?.focus()}
      >
        {selected.map((employee) => (
          <span
            key={employee.id}
            className="inline-flex items-center gap-1 rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 text-xs"
          >
            {employee.full_name}
            <button
              type="button"
              aria-label={`Remove ${employee.full_name}`}
              onClick={(e) => {
                e.stopPropagation();
                removeChip(employee.id);
              }}
              className="hover:text-destructive"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={selected.length === 0 ? "Search by name…" : ""}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md max-h-64">
          {loading && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching…
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No employees found
            </div>
          )}
          {!loading &&
            results.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => selectResult(employee)}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              >
                <div className="font-medium">{employee.full_name}</div>
                <div className="text-xs text-muted-foreground">
                  {employee.email}
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
