from sqlalchemy import Column, Integer, String, Float
from database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    contract = Column(String, nullable=False)
    hourly_rate = Column(Float, nullable=False)
    hours_worked = Column(Float, default=0)

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    day = Column(String, nullable=False)
    count = Column(Integer, default=0)