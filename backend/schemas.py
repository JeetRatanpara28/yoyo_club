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

class AttendanceCreate(BaseModel):
    day: str
    count: int
    date: Optional[str] = None

class AttendanceOut(BaseModel):
    id: int
    day: str
    count: int
    date: Optional[str] = None
    class Config:
        from_attributes = True

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

class UserCreate(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class PaymentOut(BaseModel):
    id: int
    employee_name: str
    employee_role: str
    contract: str
    amount: float
    paid_at: str
    class Config:
        from_attributes = True