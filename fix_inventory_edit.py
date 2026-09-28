import re

# Update models.py
with open('backend/models.py', 'r', encoding='utf-8') as f:
    content = f.read()

update_input_code = """class ItemUpdateInput(BaseModel):
    name: str = Field(min_length=1)
    category: str = Field(min_length=1)
    unit: str = Field(min_length=1)
    reorder_level: float = Field(ge=0)
    price_paisa: int = Field(default=0, ge=0)
"""

if "ItemUpdateInput" not in content:
    content = content.replace("class MovementInput", update_input_code + "\nclass MovementInput")
    with open('backend/models.py', 'w', encoding='utf-8') as f:
        f.write(content)

# Update inventory.py
with open('backend/routers/inventory.py', 'r', encoding='utf-8') as f:
    inv_content = f.read()

inv_content = inv_content.replace("ItemInput, MovementInput", "ItemInput, ItemUpdateInput, MovementInput")

old_update = """def update_item(item_id: int, data: ItemInput):
    name = clean_name(data.name)
    unit = clean_name(data.unit)
    try:
        with db() as conn:
            cursor = conn.execute('''
                UPDATE items 
                SET name = ?, category = ?, unit = ?, quantity = ?, reorder_level = ?, price_paisa = ?
                WHERE id = ?
            ''', (name, data.category, unit, data.quantity, data.reorder_level, data.price_paisa, item_id))"""

new_update = """def update_item(item_id: int, data: ItemUpdateInput):
    name = clean_name(data.name)
    unit = clean_name(data.unit)
    try:
        with db() as conn:
            cursor = conn.execute('''
                UPDATE items 
                SET name = ?, category = ?, unit = ?, reorder_level = ?, price_paisa = ?
                WHERE id = ?
            ''', (name, data.category, unit, data.reorder_level, data.price_paisa, item_id))"""

inv_content = inv_content.replace(old_update, new_update)

with open('backend/routers/inventory.py', 'w', encoding='utf-8') as f:
    f.write(inv_content)

print("Inventory edit backend logic updated")
