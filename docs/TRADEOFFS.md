# Trade-offs

The major engineering choices, what we picked, and what we gave up.

## SQLite vs PostgreSQL

**Chose:** SQLite (file-based, single process).

**Why it's acceptable here:**

- Assessment-scale data: the seed script tops out at 10k employees, which is
  trivial for SQLite. Queries against the indexed columns return in
  milliseconds.
- `PRAGMA journal_mode=WAL` allows readers and a single writer to coexist
  without blocking each other, which covers all the concurrency this app
  needs.
- Composite index on `(country, job_title)` makes the analytics queries
  index-only or close to it.
- Zero ops cost — no separate database process to install, run, back up,
  or migrate. The whole system clones-and-runs.

**What we give up:**

- One concurrent writer. Anything beyond a single backend process behind a
  load balancer would need a real database.
- No native types for things like `JSONB`, arrays, full-text search,
  or partial indexes. We don't need any of these today.
- No network protocol — the database lives in the same process as the app,
  so we can't scale them independently.

Migration path is straightforward: the SQLAlchemy models and queries are
portable; switching to PostgreSQL is changing the connection URL and adding
a driver. We use `func.ilike` (which PostgreSQL implements natively) and
SQLAlchemy `Date`/`DateTime` types, so no SQLite-specific code needs to be
rewritten.

## Vite vs Next.js

**Chose:** Vite + React (client-side SPA).

**Why:**

- The backend is already a FastAPI service. The frontend is purely a client
  for that API — no server-rendered pages, no edge functions, no API routes
  inside the frontend tree.
- Vite's dev server is faster and simpler than Next.js for a pure SPA.
  No framework conventions about file-system routing, no `app/` vs `pages/`
  decision, no React Server Components confusion.
- The deployment story is "build to static files, serve from any CDN or
  Nginx" — much smaller surface than running a Node server.

**What we give up:**

- No SSR / no SEO out of the box. Not a concern for an internal salary tool.
- No built-in API route mechanism — but we have a real backend for that.

## `bulk_insert_mappings` vs per-row ORM `.add()`

**Chose:** `db.bulk_insert_mappings(Employee, rows)` for the seed script.

**Why:**

- Inserting 10,000 employees via `Employee(**row)` + `db.add()` + `db.commit()`
  triggers the full ORM unit-of-work for every row: identity map insertion,
  default value resolution, flush event, autoflush bookkeeping.
- `bulk_insert_mappings` skips all of that and issues a single multi-row
  `INSERT`. The seed test asserts the whole thing finishes in under 3 seconds
  and in practice it lands in well under 1 second.

**What we give up:**

- Python-side column defaults don't fire. We have to generate `id` (UUID4)
  and `created_at` explicitly in each row dict.
- ORM events (`before_insert`, `after_insert`) are skipped. Not relevant
  for this app, but a hazard if we add audit hooks later.
- No automatic relationship cascading. We have a single table, so this is
  a non-issue.

For the regular `create_employee` service used by the API, we stick with the
ORM path — one row at a time, defaults fire, returns a hydrated object.

## Client-side debounce vs server-side search

**Chose:** Server-side search, with a client-side debounce on the input.

**Why server-side:**

- Client-side filtering only works on the currently-loaded page. With 10k
  rows and a page size of 10, the user would only ever search the visible
  20 names at best.
- Server-side `ILIKE %term%` runs once and returns only matches. The
  network response stays small and the UI doesn't have to think about
  which page the match lives on.

**Why still debounce:**

- A keystroke-per-request pattern wastes the backend's time and creates a
  flickering UI as half-typed terms race in and out. 300ms is the sweet
  spot — fast enough to feel live, slow enough that a full word triggers
  exactly one request.

**What we give up:**

- A round-trip on every typing pause. On a slow network this might feel
  laggy compared to filtering 10 already-loaded rows in JavaScript. Not
  a concern at this dataset size.

## UUID strings vs integer IDs

**Chose:** UUID4 strings (`String` column with `default=lambda: str(uuid.uuid4())`).

**Why:**

- IDs are generated client-side at insertion. No round-trip to ask the
  database for a sequence value, no risk of two app instances handing out
  the same auto-increment.
- UUIDs are unguessable. An integer URL like `/employees/47` invites
  enumeration; `/employees/14c88bba-4c48-4926-8044-b866340266b3` does not.
- They serialize cleanly to JSON without leading-zero or precision concerns.

**What we give up:**

- 36 bytes per ID instead of 8. At 10k rows this is meaningless; at a
  billion rows it matters.
- Index locality. Integer IDs cluster recent rows together in the B-tree,
  which speeds up "latest N" queries. We work around this with an explicit
  `ORDER BY created_at DESC` and the implicit index on `created_at` is fine
  at this scale.
- Human-unfriendly. You can't read a UUID over the phone. We don't need to.
