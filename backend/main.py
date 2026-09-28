import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import init_db
from routers import auth, inventory, menu, orders, reports, settings

# Initialize database schema
init_db()

app = FastAPI(title='Snack City API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=False,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(inventory.router)
app.include_router(inventory.movements_router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(reports.router)
app.include_router(settings.router)

# --- STATIC FILE SERVING FOR EXE ---

if getattr(sys, 'frozen', False):
    # If running inside PyInstaller bundle
    BASE_DIR = sys._MEIPASS
    FRONTEND_DIR = os.path.join(BASE_DIR, "dist")
else:
    # If running normally (development)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    FRONTEND_DIR = os.path.join(BASE_DIR, "frontend", "dist")

if os.path.isdir(FRONTEND_DIR):
    # Mount assets so they load correctly
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")
    
    # Catch-all route for React Router (Single Page Application)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        path = os.path.join(FRONTEND_DIR, full_path)
        # Serve the requested file if it exists, otherwise fallback to index.html
        if os.path.isfile(path):
            return FileResponse(path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
