from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import auth, inventory, menu, orders, reports, settings

# Initialize database schema
init_db()

app = FastAPI(title='Snack City API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router)
app.include_router(inventory.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(reports.router)
app.include_router(settings.router)
