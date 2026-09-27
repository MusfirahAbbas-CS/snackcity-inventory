# Snack City POS System

A complete Point-of-Sale (POS) system built for Snack City.

## Features

- **Point of Sale (POS):** Take orders, manage cart, calculate total and change due.
- **Modern UI & Design:** Sleek side navigation bar with four tabs (Orders, Menu, Orders History, Settings) utilizing Lucide icons, plus an auto-sliding background of beautiful pizza photography from Unsplash.
- **Thermal Printer Support:** Generates and prints cleanly formatted receipts (58mm or 80mm sizes) tailored for thermal printers.
- **Order Management:** Daily resetting receipt numbers, order history, and delete options for cancelled orders.
- **Menu Management:** Add, edit, or remove menu items with dynamic pricing (saved securely in the database).
- **Customizable Settings:** Dynamic Light/Dark themes, configurable restaurant details (name, address, contact, email, website), and optional customer names on receipts.

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite, Lucide Icons
- **Backend:** Python, FastAPI, SQLite (local database `inventory.db`)

## Quick Start (Windows)

We have created convenient batch scripts to set up and run the application.

### 1. Setup
Run these once to install all dependencies:
- **Backend:** Double-click `setup_backend.bat`
- **Frontend:** Double-click `setup_frontend.bat`

### 2. Run the App
- **Backend:** Double-click `run_backend.bat` (Starts the API on `http://127.0.0.1:8000`)
- **Frontend:** Double-click `run_frontend.bat` (Starts the UI on `http://localhost:5173`)

*Note: The backend must be running for the frontend to save and load data.*

## Manual Setup (macOS/Linux)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` to view the app. API docs are available at `http://127.0.0.1:8000/docs`. Data persists locally in `backend/inventory.db`.
