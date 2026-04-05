from shodan import Shodan, APIError
import sys

key = 'PSKINdQe1GyxGgecYz2191H2JoS9qvgD'
api = Shodan(key)

print(f"Testing key: {key}")

# 1. Test API permissions/info
try:
    info = api.info()
    print(f"[SUCCESS] API Key Info: {info}")
except Exception as e:
    print(f"[FAILURE] API Info check failed: {e}")

# 2. Test Host Lookup (Start with generic)
try:
    host = api.host('8.8.8.8')
    print(f"[SUCCESS] Host 8.8.8.8 lookup successful. Org: {host.get('org')}")
except Exception as e:
    print(f"[FAILURE] Host 8.8.8.8 lookup failed: {e}")

# 3. Test Specific IP
target_ip = '50.63.8.150'
try:
    host = api.host(target_ip)
    print(f"[SUCCESS] Host {target_ip} lookup successful.")
except Exception as e:
    print(f"[FAILURE] Host {target_ip} lookup failed: {e}")
