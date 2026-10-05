# Snack City POS - C# .NET Framework Migration Plan

## Executive Summary
This document outlines the strategy to migrate the backend of the Snack City POS application from Python (FastAPI) to C# (.NET Framework). 

**Goal:** Achieve 100% native compatibility with Windows 7, reduce the executable file size, eliminate Python/PyInstaller dependency issues, and improve runtime stability.

**Key Strategy:** The React frontend remains completely unchanged. Only the backend API and web server will be replaced with C# equivalents.

## Technology Stack Mapping
| Component | Current (Python) | Proposed (C# .NET Framework) |
| :--- | :--- | :--- |
| **Target OS Environment** | Windows (PyInstaller bundled) | Windows 7, 8, 10, 11 (Native) |
| **Runtime Framework** | Python 3.8 / FastAPI | .NET Framework 4.7.2 / ASP.NET Web API 2 |
| **Local Web Server** | Uvicorn | Microsoft.Owin.SelfHost |
| **Database Engine** | SQLite3 | System.Data.SQLite + Dapper |
| **Data Serialization** | Pydantic | C# Classes (DTOs) + Newtonsoft.Json |
| **Standalone Packaging** | PyInstaller | MSBuild + Costura.Fody |

## Implementation Phases

### Phase 1: Project Architecture & Setup
- [ ] Create a new C# Console Application targeting `.NET Framework 4.7.2`.
- [ ] Install required NuGet packages: `Microsoft.AspNet.WebApi.OwinSelfHost`, `System.Data.SQLite.Core`, `Dapper`, `Newtonsoft.Json`, `Costura.Fody`.
- [ ] Configure OWIN Startup class to listen on `http://localhost:8000`.

### Phase 2: Database & Data Access Layer
- [ ] Replicate database initialization logic (creating tables if they don't exist).
- [ ] Translate Python Pydantic models to C# Data Transfer Objects (DTOs).
- [ ] Implement Dapper queries to match existing raw SQL logic, ensuring seamless compatibility with the existing `inventory.db` file.

### Phase 3: API Endpoint Translation
Replicate the REST API routes to ensure zero changes are required on the React frontend.
- [ ] **Auth:** `/api/login`, `/api/users/admin`
- [ ] **Inventory:** `/api/inventory/items`, `/api/inventory/movements`
- [ ] **Orders:** `/api/orders`
- [ ] **Menu & Reports:** `/api/menu`, `/api/reports/sales`, `/api/reports/financials`
- [ ] **Settings:** `/api/settings`, `/api/shutdown`

### Phase 4: Frontend Integration & Desktop Experience
- [ ] Configure `Microsoft.Owin.StaticFiles` to serve the compiled React `dist` folder.
- [ ] Write a C# bootstrapper to automatically open the default system web browser to `http://localhost:8000` on startup.
- [ ] Implement a Windows System Tray icon (NotifyIcon) to allow the user to gracefully stop the background server via a simple Right-Click -> "Exit" (replacing the need for Task Manager).

### Phase 5: Packaging & Deployment
- [ ] Embed the React `dist` folder into the C# project build process.
- [ ] Use `Costura.Fody` to weave all dependency DLLs (like SQLite and Newtonsoft) directly into the main `.exe`.
- [ ] Generate the final, lightweight, standalone `SnackCity.exe`.
