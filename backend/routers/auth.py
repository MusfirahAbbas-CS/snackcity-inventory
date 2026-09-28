from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import db

router = APIRouter(prefix="/api", tags=["auth"])

class LoginRequest(BaseModel):
    password: str

@router.post("/login")
def login(req: LoginRequest):
    with db() as conn:
        row = conn.execute("SELECT value FROM settings WHERE key = 'admin_password'").fetchone()
        admin_pwd = row['value'] if row else 'admin'
        
    if req.password == admin_pwd:
        return {"token": "admin-token", "role": "admin"}
    elif req.password == 'staff':
        return {"token": "staff-token", "role": "staff"}
        
    raise HTTPException(401, "Invalid password")
