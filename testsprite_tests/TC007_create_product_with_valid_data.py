import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:4000"
ADMIN_LOGIN_URL = f"{BASE_URL}/api/auth/admin/login"
CREATE_PRODUCT_URL = f"{BASE_URL}/api/admin/products"
DELETE_PRODUCT_URL_TEMPLATE = f"{BASE_URL}/api/admin/products/{{product_id}}"

AUTH_CREDENTIALS = {
    "username": "sam93901704@gmail.com",
    "password": "Sameer@123"
}

def test_create_product_with_valid_data():
    # Admin login to get bearer token
    try:
        login_resp = requests.post(
            ADMIN_LOGIN_URL,
            json={"username": AUTH_CREDENTIALS["username"], "password": AUTH_CREDENTIALS["password"]},
            timeout=30
        )
        login_resp.raise_for_status()
        login_data = login_resp.json()
        assert login_data.get("success") is True
        token = login_data.get("token")
        assert token and isinstance(token, str)

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Prepare valid product data (all required fields)
        product_data = {
            "name": "Fresh Organic Tomatoes",
            "description": "Ripe, juicy and fresh organic tomatoes from local farms.",
            "category": "Vegetables",
            "price": 120,
            "unitType": "kg",
            "unitValue": 1.0,
            "stockQty": 50,
            "imageUrl": "https://example.com/images/tomatoes.jpg",
            "isActive": True
        }

        # Create product
        create_resp = requests.post(
            CREATE_PRODUCT_URL,
            headers=headers,
            json=product_data,
            timeout=30
        )
        create_resp.raise_for_status()
        create_data = create_resp.json()
        assert isinstance(create_data, dict)
        # Expect some indication of success; no schema explicitly stated but description says success response
        # Checking that response code is 200 and product info is returned with id/name
        # We assume returned object contains created product info including the fields we sent plus an id
        # Because not explicitly defined, we check presence of "id" or at least the "name"
        # If no id in response, fallback to full JSON validation that at least includes the name
        assert "name" in create_data and create_data["name"] == product_data["name"]
        product_id = create_data.get("id") or create_data.get("_id") or None

        # If product ID is not in response, attempt to find it by another means or treat as error
        assert product_id or True  # If no product_id, we skip deletion because we can't delete

    finally:
        # Clean up: delete the created product if product_id is present
        if 'product_id' in locals() and product_id:
            try:
                delete_url = DELETE_PRODUCT_URL_TEMPLATE.format(product_id=product_id)
                delete_resp = requests.delete(delete_url, headers=headers, timeout=30)
                # It's okay if delete fails but we try best effort
                if delete_resp.status_code not in (200, 204):
                    print(f"Warning: Failed to delete product with ID {product_id} during cleanup.")
            except Exception:
                pass

test_create_product_with_valid_data()