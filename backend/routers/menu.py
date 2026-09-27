import sqlite3
from fastapi import APIRouter, HTTPException, Depends

from database import db
from dependencies import require_admin, require_staff_or_admin
from models import MenuItemInput
from routers.inventory import clean_name

router = APIRouter(prefix="/api/menu-items", tags=["menu"])

@router.get("", dependencies=[Depends(require_staff_or_admin)])
def list_menu_items():
    with db() as conn:
        return [dict(row) for row in conn.execute('SELECT * FROM menu_items WHERE active = 1 ORDER BY name')]

@router.post("", status_code=201, dependencies=[Depends(require_admin)])
def create_menu_item(data: MenuItemInput):
    name = clean_name(data.name)
    try:
        with db() as conn:
            cursor = conn.execute(
                'INSERT INTO menu_items (name, price_paisa) VALUES (?, ?)',
                (name, data.price_paisa)
            )
            return {'id': cursor.lastrowid}
    except sqlite3.IntegrityError:
        raise HTTPException(409, f'Menu item "{name}" already exists')

@router.put("/{menu_item_id}", dependencies=[Depends(require_admin)])
def update_menu_item(menu_item_id: int, data: MenuItemInput):
    name = clean_name(data.name)
    try:
        with db() as conn:
            cursor = conn.execute('''
                UPDATE menu_items SET name = ?, price_paisa = ? WHERE id = ? AND active = 1
            ''', (name, data.price_paisa, menu_item_id))
            if cursor.rowcount == 0:
                raise HTTPException(404, 'Menu item not found')
            return {'message': 'Menu item updated'}
    except sqlite3.IntegrityError:
        raise HTTPException(409, f'Menu item "{name}" already exists')

@router.delete("/{menu_item_id}", dependencies=[Depends(require_admin)])
def remove_menu_item(menu_item_id: int):
    with db() as conn:
        cursor = conn.execute('''
            UPDATE menu_items SET active = 0 WHERE id = ? AND active = 1
        ''', (menu_item_id,))
        if cursor.rowcount == 0:
            raise HTTPException(404, 'Menu item not found')
        return {'message': 'Menu item removed'}
