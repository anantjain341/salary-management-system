from datetime import date

from app.models import Employee
from app.services.employee_service import (
    create_employee,
    get_employee_by_id,
    get_all_employees,
    update_employee,
    delete_employee,
    count_employees,
)


def _valid_employee_data(**overrides):
    data = {
        "full_name": "Aanya Sharma",
        "email": "aanya.sharma@example.com",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "India",
        "salary": 1800000.0,
        "employment_type": "full_time",
        "hire_date": date(2024, 6, 1),
    }
    data.update(overrides)
    return data


def test_create_employee_returns_employee_with_id(db_session):
    employee = create_employee(db_session, _valid_employee_data())

    assert employee.id is not None
    assert employee.full_name == "Aanya Sharma"


def test_create_employee_stores_in_database(db_session):
    create_employee(db_session, _valid_employee_data())

    assert db_session.query(Employee).count() == 1


def test_get_employee_by_id_returns_correct_employee(db_session):
    created = create_employee(db_session, _valid_employee_data())

    fetched = get_employee_by_id(db_session, created.id)

    assert fetched.id == created.id


def test_get_all_employees_returns_paginated_results(db_session):
    create_employee(db_session, _valid_employee_data(
        full_name="Alice One", email="alice@example.com"
    ))
    create_employee(db_session, _valid_employee_data(
        full_name="Bob Two", email="bob@example.com"
    ))
    create_employee(db_session, _valid_employee_data(
        full_name="Carol Three", email="carol@example.com"
    ))

    results = get_all_employees(db_session, skip=0, limit=10)

    assert len(results) == 3


def test_update_employee_changes_salary(db_session):
    employee = create_employee(db_session, _valid_employee_data(salary=50000))

    updated = update_employee(db_session, employee.id, {"salary": 75000})

    assert updated.salary == 75000


def test_delete_employee_removes_from_database(db_session):
    employee = create_employee(db_session, _valid_employee_data())

    delete_employee(db_session, employee.id)

    assert db_session.query(Employee).count() == 0


def test_get_employee_by_id_returns_none_for_missing_id(db_session):
    result = get_employee_by_id(db_session, "nonexistent-id")

    assert result is None


def test_get_all_employees_returns_newest_first(db_session):
    from datetime import datetime, timedelta

    base = datetime(2024, 1, 1, 12, 0, 0)
    create_employee(db_session, _valid_employee_data(
        full_name="First", email="first@example.com", created_at=base
    ))
    create_employee(db_session, _valid_employee_data(
        full_name="Second", email="second@example.com",
        created_at=base + timedelta(hours=1),
    ))
    create_employee(db_session, _valid_employee_data(
        full_name="Third", email="third@example.com",
        created_at=base + timedelta(hours=2),
    ))

    results = get_all_employees(db_session, skip=0, limit=10)

    assert [e.full_name for e in results] == ["Third", "Second", "First"]


def test_count_employees_returns_total(db_session):
    create_employee(db_session, _valid_employee_data(email="a@example.com"))
    create_employee(db_session, _valid_employee_data(email="b@example.com"))
    create_employee(db_session, _valid_employee_data(email="c@example.com"))

    assert count_employees(db_session) == 3
