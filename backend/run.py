import os
import sys
import threading
import webbrowser
import time
import uvicorn
import subprocess

# --- CRITICAL FIX FOR --noconsole MODE ---
# When running a PyInstaller app without a console, Windows sets sys.stdout and sys.stderr to None.
class DummyOutput:
    def write(self, *args, **kwargs): pass
    def flush(self, *args, **kwargs): pass
    def isatty(self): return False

if sys.stdout is None:
    sys.stdout = DummyOutput()
if sys.stderr is None:
    sys.stderr = DummyOutput()
# -----------------------------------------

# --- Hidden imports for PyInstaller ---
import uvicorn.logging
import uvicorn.loops
import uvicorn.loops.auto
import uvicorn.protocols.http.auto
import uvicorn.protocols.websockets.auto
import uvicorn.lifespan.on
import uvicorn.lifespan.off
# --------------------------------------

# --- AUTO KILL OLD INSTANCES ---
# If the user double-clicks the .exe while an old version is running hidden in the background,
# the new .exe will crash because port 8000 is occupied. 
# We kill any other processes named "SnackCity.exe" before starting.
try:
    current_pid = os.getpid()
    subprocess.run(f'taskkill /F /IM SnackCity.exe /FI "PID ne {current_pid}"', shell=True, capture_output=True)
except Exception:
    pass
# -------------------------------

from main import app

def open_browser():
    time.sleep(1.5)  # Wait for server to start
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    # Ensure no local python.exe is blocking port 8000 (mainly for development safety)
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        if s.connect_ex(('127.0.0.1', 8000)) == 0:
            # Port is still occupied (maybe by a python.exe dev server, or taskkill failed)
            import ctypes
            ctypes.windll.user32.MessageBoxW(0, "Port 8000 is still occupied! The app might already be running in the background. Please close any running instances in Task Manager.", "Snack City POS", 0x10)
    
    # Start the browser in a background thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run the FastAPI server
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
