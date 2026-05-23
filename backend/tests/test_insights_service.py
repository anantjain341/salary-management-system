from datetime import date

from app.services.employee_service import create_employee
from app.services.insights_service import (
    get_salary_stats,
    get_avg_salary_by_title,
    get_top_paying_titles,
    get_department_breakdown,
)


def _employee(**overrides):
    data = {
        "full_name": "Test Person",
        "email": "test@example.com",
        "job_title": "Engineer",
        "department": "Engineering",
        "country": "India",
        "salary": 50000.0,
        "employment_type": "full_time",
        "hire_date": date(2024, 1, 1),
    }
    data.update(overrides)
    return data


def test_get_salary_stats_returns_min_max_avg_for_country(db_session):
    create_employee(db_session, _employee(email="a@example.com", salary=30000))
    create_employee(db_session, _employee(email="b@example.com", salary=50000))
    create_employee(db_session, _employee(email="c@example.com", salary=70000))

    result = get_salary_stats(db_session, country="India")

    assert "min_salary" in result
    assert "max_salary" in result
    assert "avg_salary" in result
    assert result["min_salary"] == 30000
    assert result["max_salary"] == 70000
    assert result["avg_salary"] == 50000


def test_get_salary_stats_returns_none_for_empty_country(db_session):
    result = get_salary_stats(db_session, country="Antarctica")

    assert result is None


def test_get_avg_salary_by_title_in_country(db_session):
    create_employee(db_session, _employee(
        email="eng1@example.com", job_title="Engineer", salary=40000
    ))
    create_employee(db_session, _employee(
        email="eng2@example.com", job_title="Engineer", salary=60000
    ))
    create_employee(db_session, _employee(
        email="mgr@example.com", job_title="Manager", salary=90000
    ))

    result = get_avg_salary_by_title(db_session, country="India", job_title="Engineer")

    assert result == 50000.0


def test_get_top_paying_titles_returns_ranked_list(db_session):
    create_employee(db_session, _employee(
        email="e1@example.com", job_title="Engineer", salary=40000
    ))
    create_employee(db_session, _employee(
        email="e2@example.com", job_title="Engineer", salary=60000
    ))
    create_employee(db_session, _employee(
        email="m1@example.com", job_title="Manager", salary=90000
    ))
    create_employee(db_session, _employee(
        email="d1@example.com", job_title="Director", salary=150000
    ))

    result = get_top_paying_titles(db_session, country="India", limit=3)

    assert isinstance(result, list)
    assert len(result) == 3
    for row in result:
        assert "job_title" in row
        assert "avg_salary" in row
    salaries = [row["avg_salary"] for row in result]
    assert salaries == sorted(salaries, reverse=True)


def test_get_department_salary_breakdown(db_session):
    create_employee(db_session, _employee(
        email="eng1@example.com", department="Engineering", salary=50000
    ))
    create_employee(db_session, _employee(
        email="eng2@example.com", department="Engineering", salary=70000
    ))
    create_employee(db_session, _employee(
        email="sales1@example.com", department="Sales", salary=40000
    ))

    result = get_department_breakdown(db_session)

    assert isinstance(result, list)
    assert len(result) == 2
    for row in result:
        assert "department" in row
        assert "avg_salary" in row
        assert "employee_count" in row
