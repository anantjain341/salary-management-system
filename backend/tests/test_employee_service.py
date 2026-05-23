from datetime import date

from app.models import Employee
from app.services.employee_service import create_employee


def _valid_employee_data():
    return {
        "full_name": "Aanya Sharma",
        "email": "aanya.sharma@example.com",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "India",
        "salary": 1800000.0,
        "employment_type": "full_time",
        "hire_date": date(2024, 6, 1),
    }


def test_create_employee_returns_employee_with_id(db_session):
    employee = create_employee(db_session, _valid_employee_data())

    assert employee.id is not None
    assert employee.full_name == "Aanya Sharma"


def test_create_employee_stores_in_database(db_session):
    create_employee(db_session, _valid_employee_data())

    assert db_session.query(Employee).count() == 1
