from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import employees, attendance, payments, tickets, auth, payroll, clockin
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Yoyo's Club API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(payments.router)
app.include_router(tickets.router)
app.include_router(auth.router)
app.include_router(payroll.router)
app.include_router(clockin.router)

@app.get("/")
def root():
    return {"message": "Yoyo's Club API is running"}
