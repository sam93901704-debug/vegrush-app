import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:4000"

def test_admin_login_with_valid_credentials():
    url = f"{BASE_URL}/api/auth/admin/login"
    payload = {
        "username": "sam93901704@gmail.com",
        "password": "Sameer@123"
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert isinstance(data, dict), "Response JSON is not an object"
    assert "success" in data and data["success"] is True, "'success' field missing or not True in response"
    assert "admin" in data and isinstance(data["admin"], dict), "'admin' field missing or not an object in response"
    assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0, "'token' field missing or empty in response"

test_admin_login_with_valid_credentials()
