import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB = Path(__file__).with_name('inventory.db')

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

def init_db():
    with db() as conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS items (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                unit TEXT NOT NULL,
                quantity REAL NOT NULL DEFAULT 0 CHECK(quantity >= 0),
                reorder_level REAL NOT NULL DEFAULT 0 CHECK(reorder_level >= 0),
                price_paisa INTEGER NOT NULL DEFAULT 0,
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
                total_paisa INTEGER NOT NULL CHECK(total_paisa >= 0),
                amount_tendered_paisa INTEGER NOT NULL DEFAULT 0 CHECK(amount_tendered_paisa >= 0),
                daily_number INTEGER NOT NULL DEFAULT 1,
                customer_name TEXT,
                customer_phone TEXT,
                printed INTEGER NOT NULL DEFAULT 0
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
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
        ''')
