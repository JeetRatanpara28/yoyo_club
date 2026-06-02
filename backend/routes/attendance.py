from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime
import models, schemas

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.get("/", response_model=list[schemas.AttendanceOut])
def get_attendance(db: Session = Depends(get_db)):
    return db.query(models.Attendance).all()

@router.post("/", response_model=schemas.AttendanceOut)
def create_attendance(data: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    date_to_use = data.date or today

    existing = db.query(models.Attendance).filter(models.Attendance.date == date_to_use).first()
    if existing:
        existing.count = data.count
        db.commit()
        db.refresh(existing)
        return existing

    record = models.Attendance(day=data.day, count=data.count, date=date_to_use)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record