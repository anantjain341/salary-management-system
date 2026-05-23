from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Employee
from app.schemas import EmployeeCreate, EmployeeResponse, EmployeeUpdate
from app.services.employee_service import (
    count_employees,
    create_employee,
    delete_employee,
    get_all_employees,
    get_employee_by_id,
    update_employee,
)

router = APIRouter(prefix="/employees", tags=["employees"])


@router.post("", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create(payload: EmployeeCreate, db: Session = Depends(get_db)):
    return create_employee(db, payload)


@router.get("", response_model=List[EmployeeResponse])
def list_all(
    skip: int = 0,
    limit: int = 10,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    return get_all_employees(db, skip=skip, limit=limit, search=search)


@router.get("/count")
def count(search: str | None = None, db: Session = Depends(get_db)):
    return {"total": count_employees(db, search=search)}


@router.get("/seed", status_code=200)
def run_seed(db: Session = Depends(get_db)):
    from seed.seed import seed_employees
    count = db.query(Employee).count()
    if count > 0:
        return {"message": f"Already seeded with {count} employees"}
    seed_employees(db)
    return {"message": "Seeded 10,000 employees successfully"}


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_one(employee_id: str, db: Session = Depends(get_db)):
    employee = get_employee_by_id(db, employee_id)
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update(
    employee_id: str,
    payload: EmployeeUpdate,
    db: Session = Depends(get_db),
):
    employee = update_employee(
        db, employee_id, payload.model_dump(exclude_unset=True)
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove(employee_id: str, db: Session = Depends(get_db)):
    if not delete_employee(db, employee_id):
        raise HTTPException(status_code=404, detail="Employee not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
