import re

with open('backend/routers/menu.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace create_menu_item
old_create = """@router.post("", status_code=201, dependencies=[Depends(require_admin)])
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
        raise HTTPException(409, f'Menu item "{name}" already exists')"""

new_create = """@router.post("", status_code=201, dependencies=[Depends(require_admin)])
def create_menu_item(data: MenuItemInput):
    name = clean_name(data.name)
    with db() as conn:
        existing = conn.execute('SELECT id, active FROM menu_items WHERE name = ?', (name,)).fetchone()
        if existing:
            if existing['active'] == 1:
                raise HTTPException(409, f'Menu item "{name}" already exists')
            else:
                conn.execute('UPDATE menu_items SET active = 1, price_paisa = ? WHERE id = ?', (data.price_paisa, existing['id']))
                return {'id': existing['id']}
        else:
            cursor = conn.execute(
                'INSERT INTO menu_items (name, price_paisa) VALUES (?, ?)',
                (name, data.price_paisa)
            )
            return {'id': cursor.lastrowid}"""

content = content.replace(old_create, new_create)

with open('backend/routers/menu.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated create_menu_item logic")
