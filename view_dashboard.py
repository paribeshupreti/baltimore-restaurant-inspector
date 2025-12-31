#!/usr/bin/env python3
"""
Quick Dashboard Viewer
======================
Starts a local HTTP server and opens the analytics dashboard in your browser.

Usage:
    python3 view_dashboard.py

    Or make it executable:
    chmod +x view_dashboard.py
    ./view_dashboard.py
"""

import http.server
import socketserver
import webbrowser
import os
import sys
import signal
from pathlib import Path

# Configuration
PORT = 8000
DASHBOARD_FILE = "frontend/dashboard.html"

def find_available_port(start_port=8000, max_attempts=10):
    """Find an available port starting from start_port"""
    import socket
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            continue
    return None

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\n\n👋 Shutting down server...")
    sys.exit(0)

def main():
    # Check if dashboard exists
    if not os.path.exists(DASHBOARD_FILE):
        print(f"❌ Error: {DASHBOARD_FILE} not found in current directory")
        print(f"   Current directory: {os.getcwd()}")
        sys.exit(1)

    # Check if analytics.json exists (warn but don't stop)
    if not os.path.exists("analytics.json"):
        print("⚠️  Warning: analytics.json not found")
        print("   Run the scraper first to generate analytics data:")
        print("   python3 scraper.py --test\n")

    # Find available port
    port = find_available_port(PORT)
    if port is None:
        print(f"❌ Error: Could not find available port (tried {PORT} to {PORT+9})")
        sys.exit(1)

    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    # Set up signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)

    # Create server
    Handler = http.server.SimpleHTTPRequestHandler

    # Suppress server logs (optional - comment out to see requests)
    class QuietHandler(Handler):
        def log_message(self, format, *args):
            pass  # Suppress logs

    try:
        with socketserver.TCPServer(("", port), QuietHandler) as httpd:
            url = f"http://localhost:{port}/{DASHBOARD_FILE}"

            print("=" * 60)
            print("🍽️  Restaurant Scraper Analytics Dashboard")
            print("=" * 60)
            print(f"📊 Server started on port {port}")
            print(f"🌐 Dashboard URL: {url}")
            print(f"📂 Serving files from: {os.getcwd()}")
            print("\n💡 The dashboard will open in your browser automatically...")
            print("   (If it doesn't, copy the URL above and paste it in your browser)")
            print("\n🛑 Press Ctrl+C to stop the server")
            print("=" * 60)

            # Open browser
            webbrowser.open(url)

            # Start serving
            print("\n✅ Server running... Dashboard should be open in your browser!\n")
            httpd.serve_forever()

    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Error: Port {port} is already in use")
            print(f"   Try stopping other servers or use a different port")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
