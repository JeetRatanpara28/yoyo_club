from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models, schemas

router = APIRouter(prefix="/attendance", tags=["attendance"])

@router.get("/", response_model=list[schemas.AttendanceOut])
def get_attendance(db: Session = Depends(get_db)):
    return db.query(models.Attendance).all()

@router.post("/", response_model=schemas.AttendanceOut)
def create_attendance(data: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    record = models.Attendance(**data.dict())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record