import requests

BASE_URL = "http://localhost:4000"
LOGIN_URL = f"{BASE_URL}/api/auth/admin/login"
CURRENT_USER_URL = f"{BASE_URL}/api/auth/me"

USERNAME = "sam93901704@gmail.com"
PASSWORD = "Sameer@123"


def test_get_current_authenticated_user():
    # Login to get JWT token
    try:
        login_payload = {
            "username": USERNAME,
            "password": PASSWORD
        }
        login_resp = requests.post(LOGIN_URL, json=login_payload, timeout=30)
        login_resp.raise_for_status()
        login_data = login_resp.json()
        assert login_data.get("success") is True, "Login success flag mismatch"
        token = login_data.get("token")
        assert token and isinstance(token, str), "Token not found in login response"

        headers = {
            "Authorization": f"Bearer {token}"
        }

        # Get current authenticated user info
        user_resp = requests.get(CURRENT_USER_URL, headers=headers, timeout=30)
        user_resp.raise_for_status()
        user_data = user_resp.json()
        user = user_data.get("user")
        assert user is not None, "User field missing in response"
        assert isinstance(user, dict), "User field is not an object"
        # Validate user fields presence and types
        assert "id" in user and isinstance(user["id"], str), "User id missing or not string"
        assert "name" in user and (user["name"] is None or isinstance(user["name"], str)), "User name missing or invalid"
        assert "email" in user and isinstance(user["email"], str), "User email missing or not string"
        assert "phone" in user and (user["phone"] is None or isinstance(user["phone"], str)), "User phone missing or invalid"
        assert "profilePic" in user and (user["profilePic"] is None or isinstance(user["profilePic"], str)), "User profilePic missing or invalid"
        assert "phoneVerified" in user and isinstance(user["phoneVerified"], bool), "User phoneVerified missing or not boolean"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    except AssertionError:
        raise


test_get_current_authenticated_user()
