from typing import Optional, List
from pydantic import BaseModel, Field

class ItemInput(BaseModel):
    name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    unit: str = Field(min_length=1)
    quantity: float = Field(ge=0)
    reorder_level: float = Field(ge=0)
    price_paisa: int = Field(default=0, ge=0)

class MovementInput(BaseModel):
    change: float
    reason: str = Field(min_length=1)

class MenuItemInput(BaseModel):
    name: str = Field(min_length=1)
    price_paisa: int = Field(ge=0)

class OrderLineInput(BaseModel):
    menu_item_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=1000)

class OrderInput(BaseModel):
    lines: List[OrderLineInput] = Field(min_length=1)
    amount_tendered_paisa: int = Field(ge=0)
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

class AppSettingsInput(BaseModel):
    restaurant_name: str = Field(default="Snack City")
    address: str = Field(default="")
    contact: str = Field(default="")
    email: str = Field(default="")
    website: str = Field(default="")
    theme: str = Field(default="light")
    receipt_size: str = Field(default="80mm")
    ask_customer_name: str = Field(default="false")
    admin_password: str = Field(default="admin")
