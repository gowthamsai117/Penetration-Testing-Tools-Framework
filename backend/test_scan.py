import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_flow():
    print("1. Checking initial history...")
    try:
        r = requests.get(f"{BASE_URL}/history")
        print(f"Initial History: {r.json()}")
    except Exception as e:
        print(f"Failed to connect: {e}")
        return

    print("\n2. Running a Dig scan (simulated)...")
    payload = {"domain": "google.com"}
    try:
        r = requests.post(f"{BASE_URL}/dig", json=payload)
        if r.status_code == 200:
            print("Scan success!")
        else:
            print(f"Scan failed: {r.text}")
    except Exception as e:
        print(f"Request failed: {e}")

    print("\n3. Checking history again...")
    try:
        r = requests.get(f"{BASE_URL}/history")
        history = r.json()
        print(f"History count: {len(history)}")
        if len(history) > 0:
            print("Latest entry:", json.dumps(history[0], indent=2))
        else:
            print("ERROR: History is still empty!")
    except Exception as e:
        print(f"Failed to fetch history: {e}")

if __name__ == "__main__":
    test_flow()
