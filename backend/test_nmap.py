import requests
import json

try:
    print("Testing Nmap endpoint...")
    # Use 127.0.0.1 for speed
    response = requests.post("http://localhost:5000/nmap", json={"target": "127.0.0.1"}, timeout=10)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Response Keys:", data.keys())
        print("Host:", data.get("host"))
        print("OS:", data.get("os"))
        print("Ports:", len(data.get("ports", [])))
    else:
        print("Error:", response.text)
except Exception as e:
    print(f"Test Failed: {e}")
