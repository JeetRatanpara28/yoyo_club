# Tech Stack

- Frontend: React + Vite, Recharts, Axios
- Backend: FastAPI (Python)
- Database: PostgreSQL (Supabase)
- Payment: Stripe
- Auth: JWT + bcrypt

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
