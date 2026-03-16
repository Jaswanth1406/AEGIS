#!/usr/bin/env python3
"""
AEGIS Host Sensor — File Integrity Monitor (FIM)
-------------------------------------------------
Acts like a real EDR agent. Watches a protected directory
for any unauthorized file changes and reports them to AEGIS.

Usage:
    python demo/host_sensor.py [--vault /path/to/vault]
"""
import os
import sys
import time
import json
import hashlib
import argparse
import httpx

AEGIS_URL = "http://127.0.0.1:8000/api/internal/threats"
DEFAULT_VAULT = "/tmp/aegis_secure_vault"
POLL_INTERVAL = 1  # seconds

RED    = "\033[1;31m"
GREEN  = "\033[1;32m"
YELLOW = "\033[1;33m"
CYAN   = "\033[1;36m"
RESET  = "\033[0m"


def compute_snapshot(vault_path: str) -> dict:
    """Return a dict of {filepath: (size, mtime)} for all files in vault."""
    snapshot = {}
    for fname in os.listdir(vault_path):
        fpath = os.path.join(vault_path, fname)
        if os.path.isfile(fpath):
            stat = os.stat(fpath)
            snapshot[fpath] = (stat.st_size, stat.st_mtime)
    return snapshot


def report_to_aegis(vault_path: str, changed_file: str, source_ip: str = "127.0.0.1"):
    payload = {
        "threat_type": f"Unauthorized File Modification: {os.path.basename(changed_file)}",
        "severity": "CRITICAL",
        "source_ip": source_ip,
        "target_system": vault_path,
        "confidence_score": 0.97,
        "anomaly_score": 0.95,
        "explanation": {
            "changed_file": changed_file,
            "context": "File in secured vault was modified without authorization.",
        },
        "shap_values": [],
        "threat_fingerprint": [1.0, 0.95, 1.0, 0.9],
    }
    try:
        resp = httpx.post(AEGIS_URL, json=payload, timeout=5.0)
        if resp.status_code in (200, 201):
            print(f"{GREEN}  ✓ AEGIS alerted! Threat ID: {resp.json().get('id')}{RESET}")
        else:
            print(f"{YELLOW}  ✗ AEGIS responded with {resp.status_code}{RESET}")
    except Exception as e:
        print(f"{YELLOW}  ✗ Could not reach AEGIS: {e}{RESET}")


def main():
    parser = argparse.ArgumentParser(description="AEGIS FIM Host Sensor")
    parser.add_argument("--vault", default=DEFAULT_VAULT, help="Path to the protected vault directory")
    args = parser.parse_args()
    vault = args.vault

    if not os.path.isdir(vault):
        print(f"{RED}Error: Vault directory '{vault}' does not exist.{RESET}")
        print(f"  Run: mkdir -p {vault} && echo 'CONFIDENTIAL' > {vault}/payroll.csv")
        sys.exit(1)

    print(f"""
{CYAN}╔══════════════════════════════════════════════╗
║       AEGIS HOST SENSOR — FIM MODE           ║
╚══════════════════════════════════════════════╝{RESET}
  Protected vault : {YELLOW}{vault}{RESET}
  Reporting to    : {YELLOW}{AEGIS_URL}{RESET}
  Polling every   : {YELLOW}{POLL_INTERVAL}s{RESET}

  {GREEN}Sensor is active. Watching for unauthorized changes...{RESET}
    """)

    baseline = compute_snapshot(vault)

    alerted_files = set()  # Avoid spam for the same file

    while True:
        time.sleep(POLL_INTERVAL)

        try:
            current = compute_snapshot(vault)
        except PermissionError:
            print(f"\n{GREEN}[AEGIS] Vault is LOCKED (Permission Denied). Sensor standing down.{RESET}")
            break

        for fpath, (size, mtime) in current.items():
            if fpath in alerted_files:
                continue
            if fpath not in baseline or baseline[fpath] != (size, mtime):
                print(f"\n{RED}[!] INTRUSION DETECTED!{RESET}")
                print(f"    File changed : {fpath}")
                print(f"    Notifying AEGIS Central...")
                report_to_aegis(vault, fpath)
                alerted_files.add(fpath)
                # Update baseline so we don't re-alert the same change
                baseline[fpath] = (size, mtime)

        # Also detect new files
        for fpath in current:
            if fpath not in baseline and fpath not in alerted_files:
                print(f"\n{RED}[!] NEW FILE DETECTED!{RESET}")
                print(f"    File created : {fpath}")
                report_to_aegis(vault, fpath)
                alerted_files.add(fpath)
                baseline[fpath] = current[fpath]

    print("  Sensor stopped.")


if __name__ == "__main__":
    main()
