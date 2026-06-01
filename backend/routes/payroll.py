from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/payroll", tags=["payroll"])

class PaymentRecord(BaseModel):
    employee_name: str
    employee_role: str
    contract: str
    amount: float
    paid_at: str

class PaymentOut(PaymentRecord):
    id: int
    class Config:
        from_attributes = True

@router.get("/", response_model=List[PaymentOut])
def get_payments(db: Session = Depends(get_db)):
    return db.query(models.Payment).order_by(models.Payment.id.desc()).all()

@router.post("/", response_model=PaymentOut)
def add_payment(data: PaymentRecord, db: Session = Depends(get_db)):
    payment = models.Payment(**data.dict())
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment