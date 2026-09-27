from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends

from database import db
from dependencies import require_admin, require_staff_or_admin, get_current_role
from models import OrderInput

router = APIRouter(prefix="/api/orders", tags=["orders"])

def order_detail(conn, order_id: int):
    order = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
    if order is None:
        raise HTTPException(404, 'Order not found')
    result = dict(order)
    result['lines'] = [dict(row) for row in conn.execute('''
        SELECT menu_item_id, item_name, quantity, unit_price_paisa, line_total_paisa
        FROM order_lines WHERE order_id = ? ORDER BY id
    ''', (order_id,))]
    return result

@router.post("", status_code=201, dependencies=[Depends(require_staff_or_admin)])
def create_order(data: OrderInput):
    if len({line.menu_item_id for line in data.lines}) != len(data.lines):
        raise HTTPException(422, 'Add each menu item only once per order')
    with db() as conn:
        conn.execute('BEGIN IMMEDIATE')
        snapshots = []
        total_paisa = 0
        for line in data.lines:
            item = conn.execute('SELECT id, name, price_paisa FROM menu_items WHERE id = ? AND active = 1', (line.menu_item_id,)).fetchone()
            if item is None:
                raise HTTPException(422, f'Menu item {line.menu_item_id} is unavailable')
            line_total = item['price_paisa'] * line.quantity
            total_paisa += line_total
            snapshots.append((item['id'], item['name'], line.quantity, item['price_paisa'], line_total))
        
        if data.amount_tendered_paisa < total_paisa:
            raise HTTPException(422, 'Amount tendered cannot be less than total')

        now = datetime.now(timezone.utc).isoformat()
        today = now[:10]
        max_daily = conn.execute('SELECT MAX(daily_number) FROM orders WHERE date(created_at) = ?', (today,)).fetchone()[0] or 0
        daily_number = max_daily + 1

        cursor = conn.execute('''
            INSERT INTO orders (created_at, total_paisa, amount_tendered_paisa, daily_number, customer_name, customer_phone, printed) VALUES (?, ?, ?, ?, ?, ?, 0)
        ''', (now, total_paisa, data.amount_tendered_paisa, daily_number, data.customer_name, data.customer_phone))
        order_id = cursor.lastrowid
        conn.executemany('''
            INSERT INTO order_lines
                (order_id, menu_item_id, item_name, quantity, unit_price_paisa, line_total_paisa)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', [(order_id, *line) for line in snapshots])
        return order_detail(conn, order_id)

@router.get("", dependencies=[Depends(require_admin)])
def list_orders():
    with db() as conn:
        return [dict(row) for row in conn.execute('''
            SELECT * FROM orders ORDER BY id DESC LIMIT 50
        ''')]

@router.get("/{order_id}", dependencies=[Depends(require_staff_or_admin)])
def get_order(order_id: int):
    with db() as conn:
        return order_detail(conn, order_id)

@router.delete("/{order_id}", dependencies=[Depends(require_admin)])
def delete_order(order_id: int):
    with db() as conn:
        conn.execute('DELETE FROM order_lines WHERE order_id = ?', (order_id,))
        cursor = conn.execute('DELETE FROM orders WHERE id = ?', (order_id,))
        if cursor.rowcount == 0:
            raise HTTPException(404, 'Order not found')
        return {'message': 'Order deleted'}

@router.post("/{order_id}/print")
def print_order(order_id: int, role: str = Depends(get_current_role)):
    with db() as conn:
        order = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
        if not order:
            raise HTTPException(404, 'Order not found')
        
        if order['printed'] == 1 and role == 'staff':
            raise HTTPException(403, 'Receipt has already been printed. Only admin can view past receipts.')
            
        conn.execute('UPDATE orders SET printed = 1 WHERE id = ?', (order_id,))
        return order_detail(conn, order_id)
