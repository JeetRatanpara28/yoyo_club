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