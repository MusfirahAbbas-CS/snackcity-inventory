from fastapi import Header, HTTPException

def get_current_role(authorization: str = Header(default="")):
    if authorization == "Bearer admin-token":
        return "admin"
    if authorization == "Bearer staff-token":
        return "staff"
    return "guest"

def require_admin(role: str = Header(default="", alias="Authorization")):
    if role != "Bearer admin-token":
        raise HTTPException(403, "Admin access required")

def require_staff_or_admin(role: str = Header(default="", alias="Authorization")):
    if role not in ("Bearer admin-token", "Bearer staff-token"):
        raise HTTPException(403, "Staff or Admin access required")
