from fastapi import APIRouter, Depends

from database import db
from dependencies import require_admin

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/sales", dependencies=[Depends(require_admin)])
def report_sales(period: str = 'daily'):
    with db() as conn:
        if period == 'yearly':
            group_expr = "substr(created_at, 1, 4)"
        elif period == 'monthly':
            group_expr = "substr(created_at, 1, 7)"
        elif period == 'all_time':
            group_expr = "'All Time'"
        else:
            group_expr = "substr(created_at, 1, 10)"
            
        rows = conn.execute(f'''
            SELECT {group_expr} as date, SUM(total_paisa) as total_sales, COUNT(id) as order_count
            FROM orders
            GROUP BY date
            ORDER BY date DESC
            LIMIT 100
        ''').fetchall()
        return [dict(row) for row in rows]

@router.get("/purchases", dependencies=[Depends(require_admin)])
def report_purchases(period: str = 'daily'):
    with db() as conn:
        if period == 'yearly':
            group_expr = "substr(movements.created_at, 1, 4)"
        elif period == 'monthly':
            group_expr = "substr(movements.created_at, 1, 7)"
        elif period == 'all_time':
            group_expr = "'All Time'"
        else:
            group_expr = "substr(movements.created_at, 1, 10)"
            
        rows = conn.execute(f'''
            SELECT {group_expr} as date, 
                   SUM(movements.change * items.price_paisa) as total_cost,
                   COUNT(movements.id) as movement_count
            FROM movements
            JOIN items ON items.id = movements.item_id
            WHERE movements.change > 0
            GROUP BY date
            ORDER BY date DESC
            LIMIT 100
        ''').fetchall()
        return [dict(row) for row in rows]
