from fastapi import APIRouter, Depends

from database import db
from dependencies import require_admin, require_staff_or_admin
from models import AppSettingsInput

router = APIRouter(prefix="/api/settings", tags=["settings"])

@router.get("", dependencies=[Depends(require_staff_or_admin)])
def get_settings():
    with db() as conn:
        rows = conn.execute('SELECT key, value FROM settings').fetchall()
        settings = {row['key']: row['value'] for row in rows}
        return {
            'restaurant_name': settings.get('restaurant_name', 'Snack City'),
            'address': settings.get('address', ''),
            'contact': settings.get('contact', ''),
            'email': settings.get('email', ''),
            'website': settings.get('website', ''),
            'theme': settings.get('theme', 'dark'),
            'receipt_size': settings.get('receipt_size', '80mm'),
            'ask_customer_name': settings.get('ask_customer_name', 'false'),
        }

@router.put("", dependencies=[Depends(require_admin)])
def update_settings(data: AppSettingsInput):
    with db() as conn:
        conn.execute('BEGIN IMMEDIATE')
        for k, v in data.model_dump().items():
            conn.execute('''
                INSERT INTO settings (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value=excluded.value
            ''', (k, str(v)))
        # Call get_settings directly to reuse the logic
        rows = conn.execute('SELECT key, value FROM settings').fetchall()
        settings = {row['key']: row['value'] for row in rows}
        return {
            'restaurant_name': settings.get('restaurant_name', 'Snack City'),
            'address': settings.get('address', ''),
            'contact': settings.get('contact', ''),
            'email': settings.get('email', ''),
            'website': settings.get('website', ''),
            'theme': settings.get('theme', 'dark'),
            'receipt_size': settings.get('receipt_size', '80mm'),
            'ask_customer_name': settings.get('ask_customer_name', 'false'),
        }
