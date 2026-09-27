from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DB = Path(__file__).with_name('inventory.db')
app = FastAPI(title='Snack City Inventory API')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'], allow_credentials=False, allow_methods=['*'], allow_headers=['*'])

@contextmanager
def db():
    conn = sqlite3.connect(DB)
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
        id INTEGER PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL,
        unit TEXT NOT NULL, quantity REAL NOT NULL DEFAULT 0 CHECK(quantity >= 0),
        reorder_level REAL NOT NULL DEFAULT 0 CHECK(reorder_level >= 0),
        UNIQUE(name, unit)
      );
      CREATE TABLE IF NOT EXISTS movements (
        id INTEGER PRIMARY KEY, item_id INTEGER NOT NULL REFERENCES items(id),
        change REAL NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL
      );
    ''')

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
        return [dict(row) for row in conn.execute('SELECT * FROM items ORDER BY name COLLATE NOCASE')]

@app.post('/api/items', status_code=201)
def add_item(item: ItemCreate):
    data = item.model_dump()
    data.update({key: value.strip() for key, value in data.items() if isinstance(value, str)})
    if not all(data[key] for key in ('name', 'category', 'unit')):
        raise HTTPException(422, 'Name, category and unit cannot be blank')
    with db() as conn:
        try:
            cur = conn.execute('INSERT INTO items (name, category, unit, quantity, reorder_level) VALUES (:name, :category, :unit, :quantity, :reorder_level)', data)
        except sqlite3.IntegrityError:
            raise HTTPException(409, 'An item with this name and unit already exists')
        if data['quantity']:
            conn.execute('INSERT INTO movements (item_id, change, reason, created_at) VALUES (?, ?, ?, ?)', (cur.lastrowid, data['quantity'], 'Opening balance', datetime.now(timezone.utc).isoformat()))
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
        conn.execute('INSERT INTO movements (item_id, change, reason, created_at) VALUES (?, ?, ?, ?)', (item_id, movement.change, reason, datetime.now(timezone.utc).isoformat()))
        return dict(conn.execute('SELECT * FROM items WHERE id = ?', (item_id,)).fetchone())

@app.get('/api/movements')
def movements():
    with db() as conn:
        return [dict(row) for row in conn.execute('''SELECT movements.*, items.name, items.unit FROM movements
            JOIN items ON items.id = movements.item_id ORDER BY movements.id DESC LIMIT 50''')]
