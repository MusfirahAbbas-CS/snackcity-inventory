import os
import sys
import threading
import webbrowser
import time
import uvicorn

# --- CRITICAL FIX FOR --noconsole MODE ---
# When running a PyInstaller app without a console, Windows sets sys.stdout and sys.stderr to None.
# Uvicorn tries to check if the console supports colors by calling sys.stdout.isatty(),
# which crashes because None doesn't have an 'isatty' method.
# We create a dummy output to absorb the logs and prevent the crash.
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

from main import app

def open_browser():
    time.sleep(1.5)  # Wait for server to start
    webbrowser.open("http://127.0.0.1:8000")

if __name__ == "__main__":
    # Start the browser in a background thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run the FastAPI server
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")
