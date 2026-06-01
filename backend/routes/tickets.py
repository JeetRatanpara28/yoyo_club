from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from datetime import datetime
import models, schemas

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.get("/", response_model=list[schemas.TicketOut])
def get_tickets(db: Session = Depends(get_db)):
    return db.query(models.Ticket).all()

@router.post("/", response_model=schemas.TicketOut)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    db_ticket = models.Ticket(**ticket.dict())
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.post("/{ticket_id}/sell", response_model=schemas.TicketOut)
def sell_tickets(ticket_id: int, data: schemas.TicketSell, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.sold_tickets + data.quantity > ticket.total_tickets:
        raise HTTPException(status_code=400, detail="Not enough tickets available")

    ticket.sold_tickets += data.quantity
    db.commit()
    db.refresh(ticket)

    date_obj = datetime.strptime(ticket.event_date, "%Y-%m-%d")
    day_name = date_obj.strftime("%a")

    attendance = db.query(models.Attendance).filter(models.Attendance.day == day_name).first()
    if attendance:
        attendance.count += data.quantity
        db.commit()
    else:
        new_attendance = models.Attendance(day=day_name, count=data.quantity)
        db.add(new_attendance)
        db.commit()

    return ticket

@router.delete("/{ticket_id}")
def delete_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    db.delete(ticket)
    db.commit()
    return {"message": "Ticket deleted"}
