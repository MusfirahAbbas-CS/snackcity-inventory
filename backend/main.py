from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB = Path(__file__).with_name('inventory.db')
app = FastAPI(title='Snack City API')
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)


@contextmanager
def db():
    conn = sqlite3.connect(DB, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


with db() as conn:
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            unit TEXT NOT NULL,
            quantity REAL NOT NULL DEFAULT 0 CHECK(quantity >= 0),
            reorder_level REAL NOT NULL DEFAULT 0 CHECK(reorder_level >= 0),
            UNIQUE(name, unit)
        );
        CREATE TABLE IF NOT EXISTS movements (
            id INTEGER PRIMARY KEY,
            item_id INTEGER NOT NULL REFERENCES items(id),
            change REAL NOT NULL,
            reason TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL COLLATE NOCASE UNIQUE,
            price_paisa INTEGER NOT NULL CHECK(price_paisa >= 0),
            active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1))
        );
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY,
            created_at TEXT NOT NULL,
            total_paisa INTEGER NOT NULL CHECK(total_paisa >= 0)
        );
        CREATE TABLE IF NOT EXISTS order_lines (
            id INTEGER PRIMARY KEY,
            order_id INTEGER NOT NULL REFERENCES orders(id),
            menu_item_id INTEGER REFERENCES menu_items(id),
            item_name TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK(quantity > 0),
            unit_price_paisa INTEGER NOT NULL CHECK(unit_price_paisa >= 0),
            line_total_paisa INTEGER NOT NULL CHECK(line_total_paisa >= 0)
        );
    ''')


def clean_name(value: str) -> str:
    name = value.strip()
    if not name:
        raise HTTPException(422, 'Name cannot be blank')
    return name


# Existing ingredient inventory API
class ItemCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=60)
    unit: str = Field(min_length=1, max_length=30)
    quantity: float = Field(ge=0)
    reorder_level: float = Field(ge=0)


class MovementCreate(BaseModel):
    change: float = Field(ne=0)
    reason: str = Field(min_length=1, max_length=150)


@app.get('/api/items')
def items():
    with db() as conn:
        return [dict(row) for row in conn.execute(
            'SELECT * FROM items ORDER BY name COLLATE NOCASE'
        )]


@app.post('/api/items', status_code=201)
def add_item(item: ItemCreate):
    data = item.model_dump()
    data.update({key: value.strip() for key, value in data.items() if isinstance(value, str)})
    if not all(data[key] for key in ('name', 'category', 'unit')):
        raise HTTPException(422, 'Name, category and unit cannot be blank')
    with db() as conn:
        try:
            cur = conn.execute('''
                INSERT INTO items (name, category, unit, quantity, reorder_level)
                VALUES (:name, :category, :unit, :quantity, :reorder_level)
            ''', data)
        except sqlite3.IntegrityError:
            raise HTTPException(409, 'An item with this name and unit already exists')
        if data['quantity']:
            conn.execute('''
                INSERT INTO movements (item_id, change, reason, created_at)
                VALUES (?, ?, ?, ?)
            ''', (cur.lastrowid, data['quantity'], 'Opening balance', datetime.now(timezone.utc).isoformat()))
        return dict(conn.execute('SELECT * FROM items WHERE id = ?', (cur.lastrowid,)).fetchone())


@app.post('/api/items/{item_id}/movements')
def change_stock(item_id: int, movement: MovementCreate):
    reason = movement.reason.strip()
    if not reason:
        raise HTTPException(422, 'Reason cannot be blank')
    with db() as conn:
        item = conn.execute('SELECT * FROM items WHERE id = ?', (item_id,)).fetchone()
        if item is None:
            raise HTTPException(404, 'Item not found')
        new_quantity = round(item['quantity'] + movement.change, 4)
        if new_quantity < 0:
            raise HTTPException(422, 'Insufficient stock')
        conn.execute('UPDATE items SET quantity = ? WHERE id = ?', (new_quantity, item_id))
        conn.execute('''
            INSERT INTO movements (item_id, change, reason, created_at)
            VALUES (?, ?, ?, ?)
        ''', (item_id, movement.change, reason, datetime.now(timezone.utc).isoformat()))
        return dict(conn.execute('SELECT * FROM items WHERE id = ?', (item_id,)).fetchone())


@app.get('/api/movements')
def movements():
    with db() as conn:
        return [dict(row) for row in conn.execute('''
            SELECT movements.*, items.name, items.unit FROM movements
            JOIN items ON items.id = movements.item_id
            ORDER BY movements.id DESC LIMIT 50
        ''')]


# Menu items: prices are stored as integer paisa (100 paisa = Rs 1).
class MenuItemInput(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    price_paisa: int = Field(ge=0)


def menu_row(row):
    result = dict(row)
    result['active'] = bool(result['active'])
    return result


@app.get('/api/menu-items')
def list_menu_items():
    with db() as conn:
        return [menu_row(row) for row in conn.execute('''
            SELECT * FROM menu_items WHERE active = 1 ORDER BY name
        ''')]


@app.post('/api/menu-items', status_code=201)
def create_menu_item(data: MenuItemInput):
    name = clean_name(data.name)
    with db() as conn:
        try:
            cursor = conn.execute('''
                INSERT INTO menu_items (name, price_paisa) VALUES (?, ?)
            ''', (name, data.price_paisa))
        except sqlite3.IntegrityError:
            raise HTTPException(409, 'This menu item name already exists')
        return menu_row(conn.execute(
            'SELECT * FROM menu_items WHERE id = ?', (cursor.lastrowid,)
        ).fetchone())


@app.put('/api/menu-items/{menu_item_id}')
def update_menu_item(menu_item_id: int, data: MenuItemInput):
    name = clean_name(data.name)
    with db() as conn:
        existing = conn.execute(
            'SELECT id FROM menu_items WHERE id = ? AND active = 1', (menu_item_id,)
        ).fetchone()
        if existing is None:
            raise HTTPException(404, 'Menu item not found')
        try:
            conn.execute('''
                UPDATE menu_items SET name = ?, price_paisa = ? WHERE id = ?
            ''', (name, data.price_paisa, menu_item_id))
        except sqlite3.IntegrityError:
            raise HTTPException(409, 'This menu item name already exists')
        return menu_row(conn.execute(
            'SELECT * FROM menu_items WHERE id = ?', (menu_item_id,)
        ).fetchone())


@app.delete('/api/menu-items/{menu_item_id}')
def remove_menu_item(menu_item_id: int):
    # Keep the row for old order records; hide it from the current menu.
    with db() as conn:
        cursor = conn.execute('''
            UPDATE menu_items SET active = 0 WHERE id = ? AND active = 1
        ''', (menu_item_id,))
        if cursor.rowcount == 0:
            raise HTTPException(404, 'Menu item not found')
        return {'message': 'Menu item removed'}


class OrderLineInput(BaseModel):
    menu_item_id: int = Field(gt=0)
    quantity: int = Field(gt=0, le=1000)


class OrderInput(BaseModel):
    lines: list[OrderLineInput] = Field(min_length=1)


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


@app.post('/api/orders', status_code=201)
def create_order(data: OrderInput):
    if len({line.menu_item_id for line in data.lines}) != len(data.lines):
        raise HTTPException(422, 'Add each menu item only once per order')
    with db() as conn:
        # The transaction prevents partly saved receipts.
        conn.execute('BEGIN IMMEDIATE')
        snapshots = []
        total_paisa = 0
        for line in data.lines:
            item = conn.execute('''
                SELECT id, name, price_paisa FROM menu_items
                WHERE id = ? AND active = 1
            ''', (line.menu_item_id,)).fetchone()
            if item is None:
                raise HTTPException(422, f'Menu item {line.menu_item_id} is unavailable')
            line_total = item['price_paisa'] * line.quantity
            total_paisa += line_total
            snapshots.append((item['id'], item['name'], line.quantity, item['price_paisa'], line_total))
        cursor = conn.execute('''
            INSERT INTO orders (created_at, total_paisa) VALUES (?, ?)
        ''', (datetime.now(timezone.utc).isoformat(), total_paisa))
        order_id = cursor.lastrowid
        conn.executemany('''
            INSERT INTO order_lines
                (order_id, menu_item_id, item_name, quantity, unit_price_paisa, line_total_paisa)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', [(order_id, *line) for line in snapshots])
        return order_detail(conn, order_id)


@app.get('/api/orders')
def list_orders():
    with db() as conn:
        return [dict(row) for row in conn.execute('''
            SELECT * FROM orders ORDER BY id DESC LIMIT 50
        ''')]


@app.get('/api/orders/{order_id}')
def get_order(order_id: int):
    with db() as conn:
        return order_detail(conn, order_id)
