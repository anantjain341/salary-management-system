# Architecture

## Overview

The Salary Management System is a small CRUD + analytics application for tracking
employees and computing salary insights across countries, job titles, and departments.
It was built for the Incubyte TDD assessment, with strict red-green-refactor discipline
on the backend.

The system is two independently deployable parts:

- **Backend** — FastAPI + SQLAlchemy on top of SQLite.
- **Frontend** — React + Vite + TypeScript, styled with Tailwind v4 and shadcn/ui.

They communicate over HTTP JSON. The frontend is configured to call
`http://localhost:8000` by default.

## Tech stack and rationale

| Choice | Why |
| --- | --- |
| **Python 3.11 + FastAPI** | Fast to build, automatic OpenAPI, Pydantic validation at the route boundary, ergonomic dependency injection (`Depends(get_db)`). |
| **SQLite** | Zero-install, file-backed database. Adequate for assessment-scale data (10k rows seeded in < 1 second) and exercises real SQL patterns. |
| **SQLAlchemy ORM** | Lets us write declarative models and composable queries; supports bulk insert paths when we need speed. |
| **Pytest + httpx TestClient** | Standard Python testing; in-memory SQLite per test gives full isolation. |
| **React + Vite + TypeScript** | Fast dev server, native ESM, typed contract between API client and UI. |
| **Tailwind v4 + shadcn/ui** | Utility-first styling with a curated set of accessible primitives (Dialog, Select, Table, AlertDialog, Tabs). |
| **recharts** | Declarative React charts; only the BarChart is used so the dependency cost is contained. |

## System architecture

```
┌─────────────────────┐    HTTP/JSON    ┌──────────────────────┐
│  React + Vite UI    │ ──────────────► │  FastAPI routers     │
│  - EmployeesPage    │                 │  - employees router  │
│  - InsightsPage     │ ◄────────────── │  - insights router   │
│  - EmployeeSearch   │                 └──────────┬───────────┘
└─────────────────────┘                            │ function calls
                                                   ▼
                                        ┌──────────────────────┐
                                        │  Service layer       │
                                        │  - employee_service  │
                                        │  - insights_service  │
                                        └──────────┬───────────┘
                                                   │ SQLAlchemy ORM
                                                   ▼
                                        ┌──────────────────────┐
                                        │  SQLite (WAL mode)   │
                                        │  employees table     │
                                        └──────────────────────┘
```

Layering rules:

- Routers handle HTTP concerns only (status codes, request validation via Pydantic,
  dependency injection of the DB session). They do not touch SQLAlchemy directly.
- Services hold all data-access logic and are called with a `db: Session` argument.
  They return ORM objects or plain Python types (dicts, lists, primitives).
- Schemas (`app/schemas.py`) sit at the route boundary: `EmployeeCreate` for POST
  bodies, `EmployeeUpdate` for partial PUT bodies, `EmployeeResponse` for outputs.

## Database schema

Single table `employees`:

| Column          | Type     | Notes                                      |
| --------------- | -------- | ------------------------------------------ |
| `id`            | String   | Primary key. UUID4 string, generated in Python. |
| `full_name`     | String   | Not null. |
| `email`         | String   | Not null, **unique**. |
| `job_title`     | String   | Not null, indexed. |
| `department`    | String   | Not null. |
| `country`       | String   | Not null, indexed. |
| `salary`        | Float    | Not null. |
| `employment_type` | String | Not null (Full-time / Part-time / Contract). |
| `hire_date`     | Date     | Not null. |
| `created_at`    | DateTime | Defaults to `datetime.utcnow` at insert. |

Composite index `ix_employees_country_job_title` on `(country, job_title)`.

## API endpoints

| Method | Path                                | Purpose |
| ------ | ----------------------------------- | ------- |
| GET    | `/health`                           | Liveness probe. |
| POST   | `/employees`                        | Create an employee. Body: `EmployeeCreate`. Returns 201. |
| GET    | `/employees`                        | List employees. Query: `skip`, `limit`, `search` (case-insensitive substring match on `full_name`). Ordered by `created_at desc`. |
| GET    | `/employees/count`                  | Returns `{ "total": N }` — total row count across the table. |
| GET    | `/employees/{employee_id}`          | Fetch a single employee. 404 if missing. |
| PUT    | `/employees/{employee_id}`          | Partial update. Body: `EmployeeUpdate` (all fields optional). 404 if missing. |
| DELETE | `/employees/{employee_id}`          | Remove an employee. 204 on success, 404 if missing. |
| GET    | `/insights/salary-stats`            | `?country=`. Returns `{ min_salary, max_salary, avg_salary }`. 404 if no employees in country. |
| GET    | `/insights/avg-salary`              | `?country=&job_title=`. Case-insensitive title match. Returns `{ country, job_title, avg_salary }`. 404 if no match. |
| GET    | `/insights/job-titles`              | `?country=&search=`. Distinct job titles in a country (optionally substring-filtered). Used to populate the autocomplete dropdown in the avg-salary lookup card. |
| GET    | `/insights/top-paying-titles`       | `?country=&limit=10`. Top job titles by average salary, descending. |
| GET    | `/insights/department-breakdown`    | Average salary and headcount per department across all countries. |

## Key design decisions

### Composite index on (country, job_title)

The insights endpoints filter by country and group by job title (`top-paying-titles`)
or filter by both (`avg-salary-by-title`). A single composite index on
`(country, job_title)` lets SQLite use index-only scans for both the country
filter and the subsequent group-by, instead of falling back to a table scan plus
sort.

### WAL journal mode on SQLite

`PRAGMA journal_mode=WAL` is set on every connection (`app/database.py`). WAL
allows concurrent reads while a write is in progress, which matters as soon as
the API has more than one client (e.g. the frontend doing a list fetch while a
form posts a new employee).

### `bulk_insert_mappings` in the seed script

The seed script (`seed/seed.py`) generates 10,000 employees in a single
`db.bulk_insert_mappings(Employee, rows)` call followed by one commit. This
bypasses ORM-level unit-of-work bookkeeping (no per-row identity-map insertion,
no flush of pending state), so 10k rows complete in well under one second on
a typical laptop. The trade-off is that Python-side column defaults (`id`,
`created_at`) must be generated explicitly in the row dicts — `bulk_insert_mappings`
does not fire them.

### `StaticPool` for test database isolation

`tests/conftest.py` creates a fresh `sqlite:///:memory:` engine per test with
`poolclass=StaticPool`. Without `StaticPool`, the default per-thread pool
gives FastAPI's TestClient worker thread its own empty `:memory:` database,
and queries fail with `no such table: employees`. `StaticPool` forces all
threads to share the single connection that the fixture created the tables on.

### Server-side pagination, sorting, and search

`GET /employees` accepts `skip`, `limit`, and `search` so the client never has
to download the whole table. Search uses `Employee.full_name.ilike("%term%")`
at the database (case-insensitive substring match), so the work happens once
and only matching rows are serialized. The default order is `created_at desc`,
implemented in SQL via `ORDER BY` rather than in Python, so the ordering is
consistent across pages.

### Pydantic-validated update payloads

`PUT /employees/{id}` takes `EmployeeUpdate` rather than a raw `dict`. This
matters most for `hire_date`: Pydantic coerces the incoming `"YYYY-MM-DD"`
string into a `datetime.date` object before it reaches SQLAlchemy. A raw dict
bypasses this and ends up trying to bind a string to a `Date` column, which
the SQLite type adapter rejects with a `StatementError`.
