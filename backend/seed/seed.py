import random
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from app.models import Employee


_SEED_DIR = Path(__file__).resolve().parent

_JOB_TITLES = [
    "Software Engineer",
    "Senior Software Engineer",
    "Engineering Manager",
    "Product Manager",
    "Data Scientist",
    "Data Analyst",
    "DevOps Engineer",
    "QA Engineer",
    "UX Designer",
    "Director",
]

_DEPARTMENTS = [
    "Engineering",
    "Product",
    "Sales",
    "Marketing",
    "Operations",
    "Human Resources",
]

_COUNTRIES = ["India", "USA", "UK", "Germany", "Canada"]
_EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract"]

_HIRE_START = date(2018, 1, 1)
_HIRE_END = date(2024, 1, 1)
_HIRE_RANGE_DAYS = (_HIRE_END - _HIRE_START).days


def _load_names(path: Path) -> list[str]:
    with path.open(encoding="utf-8") as f:
        return [line.strip() for line in f if line.strip()]


def seed_employees(db, count: int = 10000, first_names=None, last_names=None):
    if first_names is None:
        first_names = _load_names(_SEED_DIR / "first_names.txt")
    if last_names is None:
        last_names = _load_names(_SEED_DIR / "last_names.txt")

    now = datetime.now(timezone.utc)
    rows = []
    for _ in range(count):
        first = random.choice(first_names)
        last = random.choice(last_names)
        suffix = str(uuid.uuid4())[:8]
        rows.append({
            "id": str(uuid.uuid4()),
            "full_name": f"{first} {last}",
            "email": f"{first}.{last}.{suffix}@company.com".lower(),
            "job_title": random.choice(_JOB_TITLES),
            "department": random.choice(_DEPARTMENTS),
            "country": random.choice(_COUNTRIES),
            "salary": round(random.uniform(30000, 150000), 2),
            "employment_type": random.choice(_EMPLOYMENT_TYPES),
            "hire_date": _HIRE_START + timedelta(
                days=random.randint(0, _HIRE_RANGE_DAYS)
            ),
            "created_at": now,
        })

    db.bulk_insert_mappings(Employee, rows)
    db.commit()


if __name__ == "__main__":
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        print("Seeding 10,000 employees...")
        import time
        start = time.time()
        seed_employees(db)
        elapsed = time.time() - start
        print(f"Done! Inserted 10,000 employees in {elapsed:.2f}s")
    finally:
        db.close()
