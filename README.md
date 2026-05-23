# Salary Management System

A minimal yet usable salary management tool for an organization with ~10,000
employees. Built for the Incubyte TDD assessment with strict red-green-refactor
discipline on the backend.

**User persona:** HR Manager.

**Capabilities**

- Add, view, update, and delete employees through a web UI.
- Search for employees by name with a multiselect typeahead that queries the
  backend live.
- View salary insights per country: min, max, and average salary; top-paying
  job titles (bar chart); average salary for a specific job title in a country;
  department-level breakdown across the org.

## Stack

| Layer | Choice |
| --- | --- |
| Backend | Python 3.11, FastAPI, SQLAlchemy, SQLite (WAL mode) |
| Frontend | React 19, Vite, TypeScript, Tailwind v4, shadcn/ui, recharts |
| Tests | pytest + httpx TestClient (29+ backend tests) |
| Seed | `bulk_insert_mappings` — 10,000 rows in well under 1 second |

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the layered diagram, full
schema, and key design decisions. See [`docs/TRADEOFFS.md`](docs/TRADEOFFS.md)
for SQLite-vs-PostgreSQL, Vite-vs-Next, and other engineering choices.

## Quick start

### Prerequisites

- Python **3.11+**
- Node.js **18+** (for the frontend)

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

The server listens on `http://localhost:8000`. Interactive docs are at
`http://localhost:8000/docs`.

### 2. Seed 10,000 employees

In a second terminal, with the venv activated:

```bash
cd backend
python -m seed.seed
```

You should see something like:

```
Seeding 10,000 employees...
Done! Inserted 10,000 employees in 0.6s
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Running the tests

```bash
cd backend
python -m pytest tests/ -v
```

All 35 tests should pass in around 1 second.

```
tests/test_api.py ............... PASSED
tests/test_employee_service.py .. PASSED
tests/test_insights_service.py .. PASSED
tests/test_seed.py .............. PASSED

============================== 35 passed ==============================
```

## API endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness probe |
| POST | `/employees` | Create an employee (returns 201) |
| GET | `/employees` | List employees. Query: `skip`, `limit`, `search` |
| GET | `/employees/count` | `{ total: N }`. Query: `search` (optional) |
| GET | `/employees/{id}` | Fetch one. 404 if missing |
| PUT | `/employees/{id}` | Partial update (`EmployeeUpdate` schema) |
| DELETE | `/employees/{id}` | 204 on success, 404 if missing |
| GET | `/insights/salary-stats` | `?country=`. `{min, max, avg}` or 404 |
| GET | `/insights/avg-salary` | `?country=&job_title=`. Case-insensitive title match. `{avg_salary: N}` or 404 |
| GET | `/insights/job-titles` | `?country=&search=opt`. Distinct titles in a country, optionally filtered. Powers the autocomplete in the UI |
| GET | `/insights/top-paying-titles` | `?country=&limit=10`. Ranked list |
| GET | `/insights/department-breakdown` | Per-department avg + headcount |

## Project structure

```
salary-management-system/
├── backend/
│   ├── app/
│   │   ├── database.py          # SQLAlchemy engine, session, WAL pragma
│   │   ├── models.py            # Employee ORM model
│   │   ├── schemas.py           # Pydantic: EmployeeCreate, Update, Response
│   │   ├── main.py              # FastAPI app, lifespan, CORS
│   │   ├── routers/
│   │   │   ├── employees.py     # /employees CRUD + /count
│   │   │   └── insights.py      # /insights/* analytics endpoints
│   │   └── services/
│   │       ├── employee_service.py
│   │       └── insights_service.py
│   ├── seed/
│   │   ├── seed.py              # bulk_insert_mappings 10k rows
│   │   ├── first_names.txt
│   │   └── last_names.txt
│   └── tests/                   # 32 pytest tests
├── frontend/
│   └── src/
│       ├── api/                 # axios client + typed endpoint helpers
│       ├── components/
│       │   ├── EmployeeForm.tsx
│       │   ├── EmployeeSearch.tsx   # multiselect typeahead, built from scratch
│       │   └── ui/              # shadcn primitives
│       ├── pages/
│       │   ├── EmployeesPage.tsx
│       │   └── InsightsPage.tsx
│       ├── types.ts
│       └── App.tsx              # tab shell + header
└── docs/
    ├── ARCHITECTURE.md
    ├── TRADEOFFS.md
    └── PROMPTS.md
```

## Development methodology

The backend was built strictly TDD — each feature went through:

1. **Red** — write a failing test that imports the symbol or hits the route
   that doesn't exist yet, confirm the failure is for the right reason.
2. **Green** — write the minimum code to make the test pass.
3. **Refactor** — clean up while staying green.

The commit history reflects this: every `test:` commit is followed by a
`feat:` or `fix:` commit. Refactors like the FastAPI `on_event` →
`lifespan` migration and the `datetime.utcnow` → `datetime.now(timezone.utc)`
fix were each their own commit, run with the full test suite green before and
after.

The frontend was built in larger implementation steps because UI testing was
not part of the assessment scope.

## AI tooling

This project was built collaboratively with **Claude Code** (Anthropic's CLI
agent). See [`docs/PROMPTS.md`](docs/PROMPTS.md) for a chronological account
of the prompt categories used at each phase.
