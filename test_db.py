import sqlite3
import json

conn = sqlite3.connect('backend/inventory.db')
conn.row_factory = sqlite3.Row

# Insert a fake item and movement
conn.execute("INSERT INTO items (name, category, unit, quantity, reorder_level, price_paisa) VALUES ('Test', 'Cat', 'kg', 10, 5, 200)")
item_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
conn.execute("INSERT INTO movements (item_id, change, reason, created_at) VALUES (?, 10, 'Purchased', '2026-09-28T10:00:00Z')", (item_id,))
conn.commit()

rows = conn.execute('''
    SELECT substr(movements.created_at, 1, 10) as date, 
            SUM(movements.change * items.price_paisa) as total_cost,
            COUNT(movements.id) as movement_count
    FROM movements
    JOIN items ON items.id = movements.item_id
    WHERE movements.change > 0
    GROUP BY date
    ORDER BY date DESC
    LIMIT 100
''').fetchall()

print("Purchases:", [dict(row) for row in rows])

# Cleanup
conn.execute("DELETE FROM movements WHERE item_id = ?", (item_id,))
conn.execute("DELETE FROM items WHERE id = ?", (item_id,))
conn.commit()
