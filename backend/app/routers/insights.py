from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.insights_service import (
    get_department_breakdown,
    get_salary_stats,
    get_top_paying_titles,
)

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/salary-stats")
def salary_stats(country: str, db: Session = Depends(get_db)):
    stats = get_salary_stats(db, country=country)
    if stats is None:
        raise HTTPException(status_code=404, detail="No employees found for country")
    return stats


@router.get("/top-paying-titles")
def top_paying_titles(country: str, limit: int = 10, db: Session = Depends(get_db)):
    return get_top_paying_titles(db, country=country, limit=limit)


@router.get("/department-breakdown")
def department_breakdown(db: Session = Depends(get_db)):
    return get_department_breakdown(db)
