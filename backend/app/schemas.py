from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class EmployeeCreate(BaseModel):
    full_name: str
    email: str
    job_title: str
    department: str
    country: str
    salary: float
    employment_type: str
    hire_date: date


class EmployeeUpdate(BaseModel):
    full_name: str | None = None
    email: str | None = None
    job_title: str | None = None
    department: str | None = None
    country: str | None = None
    salary: float | None = None
    employment_type: str | None = None
    hire_date: date | None = None


class EmployeeResponse(EmployeeCreate):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
