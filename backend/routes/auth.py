from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import hash_password, verify_password, create_access_token
import models, schemas

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(
        email=user.email,
        hashed_password=hash_password(user.password),
        name=user.name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": db_user.email, "id": db_user.id, "role": db_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": db_user.role,
        "name": db_user.name
    }

@router.get("/me", response_model=schemas.UserOut)
def get_me(token: str, db: Session = Depends(get_db)):
    from auth import decode_token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(models.User).filter(models.User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/google", response_model=schemas.Token)
def google_login(data: dict, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == data.get("email")).first()
    if not user:
        user = models.User(
            email=data.get("email"),
            name=data.get("name"),
            google_id=data.get("google_id")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token({"sub": user.email, "id": user.id})
    return {"access_token": token, "token_type": "bearer"}