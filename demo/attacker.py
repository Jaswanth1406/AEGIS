import httpx
import time
import sys

TARGET_URL = "http://127.0.0.1:8001"

def print_step(msg):
    print(f"\n[{time.strftime('%H:%M:%S')}] \033[1;36m{msg}\033[0m")

def print_success(msg):
    print(f"  \033[1;32m✓ {msg}\033[0m")

def print_error(msg):
    print(f"  \033[1;31m✗ {msg}\033[0m")

def main():
    print("""
    ================================================
          AEGIS LIVE DEMO: ATTACKER SCRIPT
    ================================================
    This script simulates an attacker targeting the 
    Corporate Portal (running on port 8001).
    """)

    client = httpx.Client(timeout=3.0)

    # STEP 1: Normal recon
    print_step("Step 1: Normal reconnaissance (pinging homepage)")
    try:
        resp = client.get(f"{TARGET_URL}/")
        if resp.status_code == 200:
            print_success(f"Homepage reachable. Response: {resp.json()}")
        else:
            print_error(f"Failed to reach homepage: HTTP {resp.status_code}")
    except Exception as e:
        print_error(f"Target system is down! Ensure 'python demo/target_app.py' is running. Error: {e}")
        sys.exit(1)

    time.sleep(2)

    # STEP 2: Use honeytoken
    print_step("Step 2: Attacker found leaked credentials and tries to log in...")
    print("  Attempting login with: admin_backup / XyZ123!dummy")
    
    try:
        resp = client.post(
            f"{TARGET_URL}/login", 
            json={"username": "admin_backup", "password": "XyZ123!dummy"}
        )
        print_success(f"Login request sent. Server replied: {resp.json()}")
        print("  \033[1;33m(Behind the scenes: The Target System just secretly alerted AEGIS!)\033[0m")
    except Exception as e:
        print_error(f"Login request failed: {e}")

    # STEP 3: Wait for AEGIS response playbook to block us
    print_step("Step 3: Attacker continues trying to access the site...")
    print("  Waiting for AEGIS admin to approve the suggested playbook...")
    print("  (Go to the AEGIS dashboard, find the new Critical Threat, and click Approve Playbook!)")
    
    attempts = 0
    while True:
        attempts += 1
        time.sleep(3)
        try:
            resp = client.get(f"{TARGET_URL}/")
            if resp.status_code == 200:
                print(f"  [Attempt {attempts}] Still have access... (HTTP 200)")
            elif resp.status_code == 403:
                print("\n\033[1;41m BOOM! ACCESS DENIED! \033[0m")
                print_success(f"AEGIS PLAYBOOK EXECUTED! The firewall blocked us: {resp.json()}")
                break
            else:
                print(f"  [Attempt {attempts}] Unexpected status: {resp.status_code}")
        except httpx.RequestError as e:
            print_error(f"Connection dropped: {e}")
            break

    print("\nDemo concluded successfully.")

if __name__ == "__main__":
    main()
