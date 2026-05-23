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


class EmployeeResponse(EmployeeCreate):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
