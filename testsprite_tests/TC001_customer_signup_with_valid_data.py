import requests
import uuid

BASE_URL = "http://localhost:4000"
TIMEOUT = 30

def test_customer_signup_with_valid_data():
    signup_url = f"{BASE_URL}/api/auth/signup"
    
    headers = {
        "Content-Type": "application/json"
    }

    unique_suffix = str(uuid.uuid4()).replace("-", "")[:8]
    name = "Test User"
    email = f"testuser_{unique_suffix}@example.com"
    phone = f"99999{str(uuid.uuid4().int)[:5]}"
    password = "strongPass123"
    
    payload = {
        "name": name,
        "email": email,
        "phone": phone,
        "password": password
    }

    try:
        response = requests.post(signup_url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to signup endpoint failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    resp_json = response.json()
    assert isinstance(resp_json, dict), "Response is not a JSON object"

    assert "success" in resp_json and resp_json["success"] is True, "Signup success flag missing or false"

    assert "user" in resp_json and isinstance(resp_json["user"], dict), "User object missing or not a dict"
    user = resp_json["user"]
    assert "email" in user and user["email"] == email, "User email mismatch"
    assert "phone" in user and user["phone"] == phone, "User phone mismatch"
    assert "name" in user and user["name"] == name, "User name mismatch"

    assert "token" in resp_json and isinstance(resp_json["token"], str) and len(resp_json["token"]) > 0, "Token missing or invalid"

test_customer_signup_with_valid_data()