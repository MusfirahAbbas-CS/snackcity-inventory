import sqlite3
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from database import db
from dependencies import require_admin
from models import ItemInput, MovementInput

router = APIRouter(prefix="/api/items", tags=["inventory"])

def clean_name(value: str) -> str:
    name = value.strip()
    if not name:
        raise HTTPException(422, 'Name cannot be blank')
    return name

@router.get("", dependencies=[Depends(require_admin)])
def list_items():
    with db() as conn:
        return [dict(row) for row in conn.execute('SELECT * FROM items ORDER BY name')]

@router.post("", status_code=201, dependencies=[Depends(require_admin)])
def create_item(data: ItemInput):
    name = clean_name(data.name)
    unit = clean_name(data.unit)
    try:
        with db() as conn:
            cursor = conn.execute(
                'INSERT INTO items (name, category, unit, quantity, reorder_level, price_paisa) VALUES (?, ?, ?, ?, ?, ?)',
                (name, data.category, unit, data.quantity, data.reorder_level, data.price_paisa)
            )
            return {'id': cursor.lastrowid}
    except sqlite3.IntegrityError:
        raise HTTPException(409, f'Item "{name}" with unit "{unit}" already exists')

@router.put("/{item_id}", dependencies=[Depends(require_admin)])
def update_item(item_id: int, data: ItemInput):
    name = clean_name(data.name)
    unit = clean_name(data.unit)
    try:
        with db() as conn:
            cursor = conn.execute('''
                UPDATE items 
                SET name = ?, category = ?, unit = ?, quantity = ?, reorder_level = ?, price_paisa = ?
                WHERE id = ?
            ''', (name, data.category, unit, data.quantity, data.reorder_level, data.price_paisa, item_id))
            if cursor.rowcount == 0:
                raise HTTPException(404, 'Item not found')
            return {'message': 'Item updated'}
    except sqlite3.IntegrityError:
        raise HTTPException(409, f'Item "{name}" with unit "{unit}" already exists')

@router.delete("/{item_id}", dependencies=[Depends(require_admin)])
def delete_item(item_id: int):
    with db() as conn:
        conn.execute('DELETE FROM movements WHERE item_id = ?', (item_id,))
        cursor = conn.execute('DELETE FROM items WHERE id = ?', (item_id,))
        if cursor.rowcount == 0:
            raise HTTPException(404, 'Item not found')
        return {'message': 'Item deleted'}

@router.post("/{item_id}/movements", status_code=201, dependencies=[Depends(require_admin)])
def add_movement(item_id: int, data: MovementInput):
    if data.change == 0:
        raise HTTPException(422, 'Change cannot be zero')
    with db() as conn:
        conn.execute('BEGIN IMMEDIATE')
        item = conn.execute('SELECT quantity FROM items WHERE id = ?', (item_id,)).fetchone()
        if item is None:
            raise HTTPException(404, 'Item not found')
        
        new_quantity = item['quantity'] + data.change
        if new_quantity < 0:
            raise HTTPException(409, f'Insufficient stock. Current: {item["quantity"]}')
        
        now = datetime.now(timezone.utc).isoformat()
        conn.execute(
            'INSERT INTO movements (item_id, change, reason, created_at) VALUES (?, ?, ?, ?)',
            (item_id, data.change, data.reason, now)
        )
        conn.execute('UPDATE items SET quantity = ? WHERE id = ?', (new_quantity, item_id))
        return {'new_quantity': new_quantity}

@router.get("/{item_id}/movements", dependencies=[Depends(require_admin)])
def list_movements(item_id: int):
    with db() as conn:
        return [dict(row) for row in conn.execute(
            'SELECT * FROM movements WHERE item_id = ? ORDER BY id DESC LIMIT 50', 
            (item_id,)
        )]
