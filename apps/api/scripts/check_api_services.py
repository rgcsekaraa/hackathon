#!/usr/bin/env python3
"""
API service readiness checker for backend-only validation.

Usage:
  cd apps/api
  .venv/bin/python scripts/check_api_services.py
  .venv/bin/python scripts/check_api_services.py --base-url http://localhost:8000 --strict
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request


def fetch_json(url: str, timeout: float = 6.0) -> dict:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        body = resp.read().decode("utf-8")
        return json.loads(body)


def main() -> int:
    parser = argparse.ArgumentParser(description="Check API health and service readiness.")
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="API base URL")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Fail when any integration is not fully ready ('ok' or 'configured').",
    )
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    health_url = f"{base_url}/health"
    ready_url = f"{base_url}/health/ready"

    try:
        health = fetch_json(health_url)
    except urllib.error.URLError as exc:
        print(f"[FAIL] Could not reach {health_url}: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:
        print(f"[FAIL] Invalid /health response: {exc}", file=sys.stderr)
        return 2

    if health.get("status") != "healthy":
        print(f"[FAIL] /health returned unexpected payload: {health}")
        return 2

    print(f"[OK] /health: {health}")

    try:
        ready = fetch_json(ready_url)
    except urllib.error.URLError as exc:
        print(f"[FAIL] Could not reach {ready_url}: {exc}", file=sys.stderr)
        return 2
    except Exception as exc:
        print(f"[FAIL] Invalid /health/ready response: {exc}", file=sys.stderr)
        return 2

    services = ready.get("services") or {}
    if not isinstance(services, dict):
        print(f"[FAIL] /health/ready services field invalid: {ready}")
        return 2

    print(f"[INFO] /health/ready status: {ready.get('status')}")
    print("[INFO] Integration states:")

    ok_like = {"ok", "configured"}
    pass_like = ok_like | {"no_key"}
    failures: list[tuple[str, str]] = []

    for name in sorted(services.keys()):
        state = str(services[name])
        if state in ok_like:
            mark = "OK"
        elif state == "no_key":
            mark = "SKIP"
        else:
            mark = "FAIL"
        print(f"  - {name:14} {mark:4} {state}")

        if args.strict:
            if state not in ok_like:
                failures.append((name, state))
        else:
            if state not in pass_like:
                failures.append((name, state))

    if failures:
        print("[FAIL] Readiness check failed for:")
        for name, state in failures:
            print(f"  - {name}: {state}")
        return 1

    print("[OK] API services check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
