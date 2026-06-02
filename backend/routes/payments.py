from fastapi import APIRouter
from pydantic import BaseModel
import stripe
import os

router = APIRouter(prefix="/payments", tags=["payments"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

class CheckoutData(BaseModel):
    amount: float
    description: str
    employee_name: str = ""
    employee_role: str = ""
    contract: str = ""
    employee_id: int = 0

@router.post("/create-checkout-session")
def create_checkout_session(data: CheckoutData):
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "eur",
                "product_data": {
                    "name": data.description,
                },
                "unit_amount": int(data.amount * 100),
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"http://localhost:5173/payroll?payment=success&name={data.employee_name}&role={data.employee_role}&contract={data.contract}&amount={data.amount}&employee_id={data.employee_id}",
        cancel_url="http://localhost:5173/staff?payment=cancelled",
    )
    return {"url": session.url}