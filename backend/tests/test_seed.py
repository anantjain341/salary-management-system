import time

from app.models import Employee
from seed.seed import seed_employees


def test_seed_inserts_10000_employees_under_3_seconds(db_session):
    start = time.time()
    seed_employees(db_session, count=10000)
    elapsed = time.time() - start

    assert db_session.query(Employee).count() == 10000
    assert elapsed < 3.0


def test_seed_generates_unique_emails(db_session):
    seed_employees(db_session, count=100)

    emails = [row[0] for row in db_session.query(Employee.email).all()]
    assert len(set(emails)) == 100


def test_seed_uses_names_from_provided_lists(db_session):
    seed_employees(
        db_session,
        count=10,
        first_names=["John", "Jane"],
        last_names=["Doe", "Smith"],
    )

    names = [row[0] for row in db_session.query(Employee.full_name).all()]
    for name in names:
        assert name.startswith("John") or name.startswith("Jane")
