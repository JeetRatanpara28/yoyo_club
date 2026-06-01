from pydantic import BaseModel
from typing import Optional

class EmployeeCreate(BaseModel):
    name: str
    role: str
    contract: str
    hourly_rate: float
    hours_worked: Optional[float] = 0

class EmployeeOut(EmployeeCreate):
    id: int
    class Config:
        from_attributes = True

class AttendanceOut(BaseModel):
    id: int
    day: str
    count: int
    class Config:
        from_attributes = True

class AttendanceCreate(BaseModel):
    day: str
    count: int

class TicketCreate(BaseModel):
    event_name: str
    event_date: str
    price: float
    total_tickets: int
    sold_tickets: Optional[int] = 0

class TicketOut(TicketCreate):
    id: int
    class Config:
        from_attributes = True

class TicketSell(BaseModel):
    quantity: int