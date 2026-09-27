# Snack City inventory prototype

A dark-themed standalone React + Tailwind CSS + Vite + PostCSS frontend and FastAPI + SQLite backend. Features: add ingredients, record received/used stock, show low-stock alerts, search inventory, and view recent activity. The food background images are in `frontend/public/images/`. Demo data is entered through the UI; no account or external service is required.

## Run on Windows PowerShell

Terminal 1:

```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Terminal 2:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. API docs: http://127.0.0.1:8000/docs.

On macOS/Linux, activate Python with `source .venv/bin/activate`, then use the same pip and uvicorn commands. Data persists in `backend/inventory.db`. This is a local demo: add authentication, permissions, a production database, and decimal or integer stock units before operational use.
