@echo off
echo Running backend...
cd backend
call venv\Scripts\activate.bat
uvicorn main:app --reload
pause
