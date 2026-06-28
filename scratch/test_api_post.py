import requests
import json

base_url = "http://127.0.0.1:8000/api"

# 1. Login
print("Logging in...")
login_payload = {
    "email": "yasseeward@gmail.com",
    "password": "password123"
}
r = requests.post(f"{base_url}/auth/login/", json=login_payload)
tokens = r.json()
access_token = tokens["access"]
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# 2. Get Stores
r = requests.get(f"{base_url}/stores/", headers=headers)
stores = r.json()
store_id = stores[0]["id"]

# 3. Get Companies
r = requests.get(f"{base_url}/delivery/companies/", headers=headers)
companies = r.json()
yalidine_id = None
for c in companies:
    if c["name"] == "yalidine":
        yalidine_id = c["id"]
        break

# 4. Fetch current configurations
print("\nFetching current configurations...")
r = requests.get(f"{base_url}/delivery/{store_id}/configs/", headers=headers)
data = r.json()
configs = data if isinstance(data, list) else data.get("results", [])
print(f"Configs found: {len(configs)}")

if configs:
    config_id = configs[0]["id"]
    payload = {
        "company": yalidine_id,
        "api_key": "updated_key_123",
        "api_secret": "updated_secret_456",
        "api_id": "updated_id_789",
        "is_active": True,
        "is_default": False,
        "webhook_url": ""
    }
    print(f"\nSending PUT request to config ID {config_id}...")
    r = requests.put(f"{base_url}/delivery/{store_id}/configs/{config_id}/", json=payload, headers=headers)
    print(f"PUT Status: {r.status_code}")
    print(r.text)
