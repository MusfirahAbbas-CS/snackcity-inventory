@echo off
echo ========================================================
echo   Snack City POS - Setup Script
echo ========================================================

echo 1. Restoring NuGet packages...
dotnet restore SnacksCity.sln

echo.
echo 2. Building the project (Debug)...
dotnet build SnacksCity.sln

echo.
echo ========================================================
echo Setup finished! You can now open SnacksCity.sln in Visual Studio
echo or run the application from SnacksCity\bin\Debug\SnacksCity.exe
echo ========================================================
pause
