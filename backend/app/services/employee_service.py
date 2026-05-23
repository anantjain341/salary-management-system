from app.models import Employee


def create_employee(db, employee_data):
    data = employee_data if isinstance(employee_data, dict) else employee_data.model_dump()
    employee = Employee(**data)
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


def get_employee_by_id(db, employee_id: str):
    return db.query(Employee).filter(Employee.id == employee_id).first()


def get_all_employees(db, skip: int = 0, limit: int = 10, search: str | None = None):
    query = db.query(Employee)
    if search:
        query = query.filter(Employee.full_name.ilike(f"%{search}%"))
    return (
        query.order_by(Employee.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def count_employees(db) -> int:
    return db.query(Employee).count()


def update_employee(db, employee_id: str, update_data: dict):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee is None:
        return None
    for field, value in update_data.items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return employee


def delete_employee(db, employee_id: str):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if employee is None:
        return False
    db.delete(employee)
    db.commit()
    return True
