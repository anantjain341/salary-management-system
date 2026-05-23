from sqlalchemy import func

from app.models import Employee


def get_salary_stats(db, country: str):
    row = (
        db.query(
            func.min(Employee.salary).label("min_salary"),
            func.max(Employee.salary).label("max_salary"),
            func.avg(Employee.salary).label("avg_salary"),
        )
        .filter(Employee.country == country)
        .one()
    )
    if row.min_salary is None:
        return None
    return {
        "min_salary": row.min_salary,
        "max_salary": row.max_salary,
        "avg_salary": row.avg_salary,
    }


def get_avg_salary_by_title(db, country: str, job_title: str):
    result = (
        db.query(func.avg(Employee.salary))
        .filter(Employee.country == country, Employee.job_title == job_title)
        .scalar()
    )
    if result is None:
        return None
    return float(result)


def get_top_paying_titles(db, country: str, limit: int = 10):
    rows = (
        db.query(
            Employee.job_title,
            func.avg(Employee.salary).label("avg_salary"),
        )
        .filter(Employee.country == country)
        .group_by(Employee.job_title)
        .order_by(func.avg(Employee.salary).desc())
        .limit(limit)
        .all()
    )
    return [{"job_title": r.job_title, "avg_salary": float(r.avg_salary)} for r in rows]


def get_department_breakdown(db):
    rows = (
        db.query(
            Employee.department,
            func.avg(Employee.salary).label("avg_salary"),
            func.count(Employee.id).label("employee_count"),
        )
        .group_by(Employee.department)
        .order_by(func.avg(Employee.salary).desc())
        .all()
    )
    return [
        {
            "department": r.department,
            "avg_salary": float(r.avg_salary),
            "employee_count": r.employee_count,
        }
        for r in rows
    ]
