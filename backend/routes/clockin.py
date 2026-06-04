from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime
import models
from pydantic import BaseModel

router = APIRouter(prefix="/clockin", tags=["clockin"])

class ClockAction(BaseModel):
    employee_id: int
    employee_name: str

@router.get("/all-summary")
def get_all_summary(db: Session = Depends(get_db)):
    records = db.query(models.ClockIn).all()
    summary = {}
    for r in records:
        if r.clock_out:
            if r.employee_name not in summary:
                summary[r.employee_name] = 0
            summary[r.employee_name] += r.hours_worked
    result = []
    for name, hours in summary.items():
        result.append({"employee_name": name, "total_hours": round(hours, 2)})
    return result

@router.get("/active")
def get_active_clockins(db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    records = db.query(models.ClockIn).filter(
        models.ClockIn.date == today,
        models.ClockIn.clock_out == None
    ).all()
    return records

@router.get("/summary/{employee_id}")
def get_clock_summary(employee_id: int, db: Session = Depends(get_db)):
    records = db.query(models.ClockIn).filter(
        models.ClockIn.employee_id == employee_id
    ).all()
    total_hours = sum(r.hours_worked for r in records if r.clock_out)
    return {"employee_id": employee_id, "total_hours": round(total_hours, 2)}

@router.get("/{employee_id}")
def get_clockins(employee_id: int, db: Session = Depends(get_db)):
    return db.query(models.ClockIn).filter(
        models.ClockIn.employee_id == employee_id
    ).order_by(models.ClockIn.id.desc()).all()

@router.post("/in")
def clock_in(data: ClockAction, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    now = datetime.now().strftime("%H:%M:%S")
    existing = db.query(models.ClockIn).filter(
        models.ClockIn.employee_id == data.employee_id,
        models.ClockIn.date == today,
        models.ClockIn.clock_out == None
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already clocked in")
    record = models.ClockIn(
        employee_id=data.employee_id,
        employee_name=data.employee_name,
        clock_in=now,
        date=today,
        hours_worked=0
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.post("/out")
def clock_out(data: ClockAction, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    now = datetime.now()
    record = db.query(models.ClockIn).filter(
        models.ClockIn.employee_id == data.employee_id,
        models.ClockIn.date == today,
        models.ClockIn.clock_out == None
    ).first()
    if not record:
        raise HTTPException(status_code=400, detail="Not clocked in")
    clock_in_time = datetime.strptime(record.clock_in, "%H:%M:%S")
    clock_in_full = datetime.combine(now.date(), clock_in_time.time())
    hours = round((now - clock_in_full).seconds / 3600, 2)
    record.clock_out = now.strftime("%H:%M:%S")
    record.hours_worked = hours
    db.commit()
    db.refresh(record)
    return record

@router.post("/force-out/{employee_id}")
def force_clock_out(employee_id: int, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    now = datetime.now()
    record = db.query(models.ClockIn).filter(
        models.ClockIn.employee_id == employee_id,
        models.ClockIn.date == today,
        models.ClockIn.clock_out == None
    ).first()
    if not record:
        raise HTTPException(status_code=400, detail="Employee is not clocked in")
    clock_in_time = datetime.strptime(record.clock_in, "%H:%M:%S")
    clock_in_full = datetime.combine(now.date(), clock_in_time.time())
    hours = round((now - clock_in_full).seconds / 3600, 2)
    record.clock_out = now.strftime("%H:%M:%S")
    record.hours_worked = hours
    db.commit()
    db.refresh(record)
    return {"message": "Employee clocked out forcefully"}

@router.delete("/reset-today/{employee_id}")
def reset_today_hours(employee_id: int, db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    record = db.query(models.ClockIn).filter(
        models.ClockIn.employee_id == employee_id,
        models.ClockIn.date == today
    ).first()
    if not record:
        raise HTTPException(status_code=400, detail="No clock record found for today")
    db.delete(record)
    db.commit()
    return {"message": "Today's hours reset"}

@router.delete("/reset/{employee_id}")
def reset_clock_hours(employee_id: int, db: Session = Depends(get_db)):
    db.query(models.ClockIn).filter(
        models.ClockIn.employee_id == employee_id
    ).delete()
    db.commit()
    return {"message": "All clock hours reset"}
