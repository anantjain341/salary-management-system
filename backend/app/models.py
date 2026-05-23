import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Date, DateTime, Index

from .database import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    job_title = Column(String, nullable=False, index=True)
    department = Column(String, nullable=False)
    country = Column(String, nullable=False, index=True)
    salary = Column(Float, nullable=False)
    employment_type = Column(String, nullable=False)
    hire_date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_employees_country_job_title", "country", "job_title"),
    )
