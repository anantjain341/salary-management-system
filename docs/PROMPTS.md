# AI prompts used during development

This project was built collaboratively with **Claude Code** (Anthropic's CLI
agent) as the primary AI development tool. The user supplied each step as a
prompt; Claude Code produced the code, ran the tests, and reported back.

The prompting discipline was strict TDD on the backend — every new function or
endpoint started with a failing test, was made to pass with the minimum code,
and only then refactored. The frontend was built in larger implementation
steps because the assessment didn't require TDD coverage of UI code.

## Prompt categories, in chronological order

### 1. Database and model setup

> "Set up FastAPI + SQLAlchemy + SQLite. Create an Employee model with
> id (UUID string), full_name, email, job_title, department, country,
> salary, employment_type, hire_date, created_at. Add a composite index
> on (country, job_title)."

Output: `app/database.py` (engine, session, WAL pragma), `app/models.py`
(Employee with explicit composite index), `app/main.py` (FastAPI app, CORS,
health endpoint).

### 2. Red phase — failing test fixtures

> "Create `tests/conftest.py` with a `db_session` fixture (in-memory SQLite,
> creates all tables, drops on teardown) and a `client` fixture that
> overrides `get_db`. Create `tests/test_employee_service.py` with two tests
> for `create_employee` that import from a module that doesn't exist yet."

Output: failing tests with `ModuleNotFoundError: No module named
'app.services.employee_service'`. Intentional red.

### 3. Green phase — minimum code to pass

> "Implement `app/services/employee_service.py` with a `create_employee`
> function that accepts a dict or schema object. Add `app/schemas.py` with
> `EmployeeCreate` and `EmployeeResponse`. Make the two failing tests pass."

Output: minimal `create_employee`, Pydantic schemas, both tests green.

### 4. Repeat red/green for the rest of the CRUD surface

Separate red-then-green cycles for:

- `get_employee_by_id`, `get_all_employees`, `update_employee`,
  `delete_employee` (5 tests added, then 4 functions implemented).
- Insights service: `get_salary_stats`, `get_avg_salary_by_title`,
  `get_top_paying_titles`, `get_department_breakdown` (5 tests, then
  the service file with SQLAlchemy `func.min`/`max`/`avg`/`count` and
  `group_by`).
- API integration tests: 8 tests using FastAPI's TestClient, then the
  `employees` and `insights` routers.
- Seed script: 3 performance/correctness tests, then `seed_employees`
  using `bulk_insert_mappings`.

Each cycle followed the same structure: write the test, confirm
`ImportError`/`AssertionError`, implement minimally, confirm green, then
move on.

### 5. Refactor phase

Refactors that preserved all-green test runs:

- Replaced deprecated `@app.on_event("startup")` with the modern
  `@asynccontextmanager`-based `lifespan` handler.
- Replaced `datetime.utcnow()` with `datetime.now(timezone.utc)` in the
  seed script to silence the upcoming Python deprecation.

### 6. Bug fixes via TDD

When the frontend reported a bug, the fix went through a red-green cycle
on the backend:

- **PUT /employees/{id} crashed with 500 when `hire_date` was included.**
  Reproduced with a new failing test (`test_update_employee_with_hire_date_via_api`),
  diagnosed as the route accepting a raw `dict` rather than a typed
  Pydantic model. Fix: added `EmployeeUpdate` schema with all-optional
  fields, switched the route to use it with `model_dump(exclude_unset=True)`.

- **Pagination footer needed a total count.** Red: added
  `test_count_employees_returns_total` and `test_get_employees_count_via_api`.
  Green: added `count_employees` service function and `GET /employees/count`
  route (carefully ordered **before** `/employees/{id}` so FastAPI doesn't
  match "count" as a UUID).

- **Employees needed to display newest-first.** Red: added
  `test_get_all_employees_returns_newest_first` with explicit `created_at`
  values to avoid timing flakiness. Green: chained
  `.order_by(Employee.created_at.desc())` into the query.

### 7. Frontend UI

The frontend was built in larger steps (no TDD):

- API layer: `src/api/client.ts` (axios instance), `src/api/employees.ts`
  (CRUD typed functions), `src/api/insights.ts`, and `src/types.ts` with
  the TypeScript interfaces mirroring the backend schemas.
- Page components: `EmployeesPage` (table, pagination, search, modals),
  `InsightsPage` (country selector, salary stats card, recharts BarChart,
  department breakdown table).
- Reusable components: `EmployeeForm` (used for both create and edit),
  `EmployeeSearch` (multiselect typeahead with chips, debounced backend
  query, outside-click and Escape to close — built from scratch without an
  autocomplete library).

shadcn/ui primitives (Dialog, Select, Table, AlertDialog, Tabs, Card,
Input, Label, Button) were installed via `npx shadcn add` and the path-alias
issue with the root `tsconfig.json` was fixed so future `shadcn add` calls
land in `src/components/ui/` rather than a literal `@/components/ui/`
directory.

## Notes on the discipline

- **Failing tests were verified to fail for the right reason** before any
  implementation — usually `ImportError`/`ModuleNotFoundError` on the symbol
  being introduced, not a fixture or environment problem.
- **Minimum code to pass** was the rule for green steps. Helper indirection
  and abstractions were only added when a second usage forced them.
- **Refactors only when green.** Each refactor was paired with a full
  `pytest tests/` run to confirm no regressions.
- **No tests were skipped or marked xfail** to make the suite pass. When
  a bug was found, the bug got a new failing test first.

The final backend suite is 29 tests covering services, API routes, ordering,
search, count, insights, and seed performance — all green.
