# About this project

- A full-stack web dashboard for managing a nightclub — staff, payroll, tickets, attendance, and employee clock-in system.

# Tech Stack

- Frontend: React + Vite, Recharts, Axios
- Backend: FastAPI (Python)
- Database: PostgreSQL (Supabase)
- Payment: Stripe
- Auth: JWT + sha256_crypt (passlib)

## Installation & Setup

### Backend Setup

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt


Run the backend:

uvicorn main:app --reload --port 8001

API available at: `http://localhost:8001/docs`

### Frontend Setup

cd frontend
npm install

Run the frontend:

npm run dev

Open `http://localhost:5173`

## Default Admin Account

Create via Swagger at `http://localhost:8001/docs` -> POST /auth/register:

json
{
  "email": "yoyo@club.com",
  "password": "yoyo1234",
  "name": "Yoyo"
}

## Features

**Admin (Yoyo)**
- Dashboard with attendance charts (Today / Week / Month / Year / Custom range) with navigation
- Staff overview chart (hours worked and payroll cost per employee)
- Hire employees — creates employee record + login account at the same time
- Edit and fire employees
- Real-time clock-in timer per employee (live session counter)
- Pay employees via Stripe — amount calculated from real clock-in hours
- Payment warning if employee already paid this week
- Force clock out employee remotely (fraud prevention)
- Reset only today's hours (fraud prevention)
- Payroll history with total paid, paid this week, employees paid stats
- Ticket management — create events, sell tickets, track revenue and attendance

**Employee**
- Separate login redirects to employee dashboard
- Clock in / clock out
- View real hours worked and estimated pay
- View next payment date
- Clock-in history table
- Payment history table
