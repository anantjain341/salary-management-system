from app.models import Employee


def create_employee(db, employee_data):
    data = employee_data if isinstance(employee_data, dict) else employee_data.model_dump()
    employee = Employee(**data)
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee
