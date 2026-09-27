from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import db

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    role: str
    password: str

@router.post("/login")
def login(req: LoginRequest):
    if req.role == 'admin':
        with db() as conn:
            row = conn.execute("SELECT value FROM settings WHERE key = 'admin_password'").fetchone()
            admin_pwd = row['value'] if row else 'admin'
        if req.password == admin_pwd:
            return {"token": "admin-token", "role": "admin"}
        raise HTTPException(401, "Invalid admin password")
    
    if req.role == 'staff':
        if req.password == 'staff':
            return {"token": "staff-token", "role": "staff"}
        raise HTTPException(401, "Invalid staff password")
        
    raise HTTPException(400, "Invalid role")
