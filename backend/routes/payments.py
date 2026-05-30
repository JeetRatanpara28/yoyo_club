from fastapi import APIRouter
import stripe
import os

router = APIRouter(prefix="/payments", tags=["payments"])

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@router.post("/create-checkout-session")
def create_checkout_session(data: dict):
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "eur",
                "product_data": {
                    "name": data.get("description", "Club Invoice"),
                },
                "unit_amount": int(data.get("amount", 0) * 100),
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url="http://localhost:5173/payroll?payment=success",
        cancel_url="http://localhost:5173/payroll?payment=cancelled",
    )
    return {"url": session.url}