import requests

def test_customer_login_with_valid_credentials():
    base_url = "http://localhost:4000"
    login_url = f"{base_url}/api/auth/login"
    identifier = "sam93901704@gmail.com"
    password = "Sameer@123"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    payload = {
        "identifier": identifier,
        "password": password
    }
    
    try:
        response = requests.post(login_url, json=payload, headers=headers, timeout=30)
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"
    
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
    
    try:
        response_data = response.json()
    except ValueError:
        assert False, "Response content is not valid JSON"
        
    assert isinstance(response_data, dict), "Response JSON is not a dictionary"
    assert response_data.get("success") is True, "Login success flag is not true"
    assert "token" in response_data and isinstance(response_data["token"], str) and response_data["token"], "Token missing or invalid in the response"
    assert "user" in response_data and isinstance(response_data["user"], dict), "User object missing or invalid in the response"

test_customer_login_with_valid_credentials()