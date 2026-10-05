@echo off
echo ===================================================
echo Snack City POS - Initial Setup Script
echo ===================================================
echo.

:: Check if nuget.exe exists
if not exist "nuget.exe" (
    echo [1/3] Downloading NuGet...
    powershell -Command "Invoke-WebRequest 'https://dist.nuget.org/win-x86-commandline/latest/nuget.exe' -OutFile 'nuget.exe'"
) else (
    echo [1/3] NuGet already found.
)

:: Restore packages
echo [2/3] Restoring dependencies (SQLite, Dapper)...
nuget.exe restore SnacksCity\SnacksCity.sln

:: Verify database exists
if not exist "SnacksCity\SnacksCity\inventory.db" (
    echo [3/3] Copying database file...
    if exist "backend\dist\inventory.db" (
        copy "backend\dist\inventory.db" "SnacksCity\SnacksCity\inventory.db"
    ) else (
        echo WARNING: Could not find inventory.db!
    )
) else (
    echo [3/3] Database file is ready.
)

echo.
echo ===================================================
echo Setup Complete! You can now open SnacksCity.sln
echo in Visual Studio and click Start.
echo ===================================================
pause
