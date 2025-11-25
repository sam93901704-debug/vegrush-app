import requests
import uuid

BASE_URL = "http://localhost:4000"
AUTH_USERNAME = "sam93901704@gmail.com"
AUTH_PASSWORD = "Sameer@123"
TIMEOUT = 30

def test_create_order_with_valid_items():
    session = requests.Session()
    # Authenticate user to get JWT token
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {
        "identifier": AUTH_USERNAME,
        "password": AUTH_PASSWORD
    }
    try:
        login_resp = session.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
        login_data = login_resp.json()
        assert login_data.get("success") is True, "Login response success flag is not True"
        token = login_data.get("token")
        assert isinstance(token, str) and token, "Token not found in login response"
        headers = {"Authorization": f"Bearer {token}"}

        # Fetch products to get at least one valid productId
        products_url = f"{BASE_URL}/api/products"
        products_resp = session.get(products_url, timeout=TIMEOUT)
        assert products_resp.status_code == 200, f"Fetching products failed with status {products_resp.status_code}"
        products_data = products_resp.json()
        # Must be a list or dict with list inside depending on API
        products_list = None
        if isinstance(products_data, dict):
            # Try common keys for product list
            if "products" in products_data and isinstance(products_data["products"], list):
                products_list = products_data["products"]
            else:
                # fallback to root object with list? Try to get list values
                if isinstance(products_data.get("data"), list):
                    products_list = products_data.get("data")
                else:
                    # maybe root is list directly? unlikely but safe check
                    products_list = products_data if isinstance(products_data, list) else None
        elif isinstance(products_data, list):
            products_list = products_data

        assert products_list and len(products_list) > 0, "No products available to add to order"

        # Prepare order items with at least one product and quantity
        items = []
        for product in products_list:
            product_id = product.get("id") or product.get("_id") or product.get("productId") or product.get("id")
            if product_id:
                # Use qty = 1 for test
                items.append({"productId": product_id, "qty": 1})
                break
        assert len(items) > 0, "No valid productId found in products"

        # Optionally get default user addressId
        address_id = None
        address_url = f"{BASE_URL}/api/user/address"
        address_resp = session.get(address_url, headers=headers, timeout=TIMEOUT)
        if address_resp.status_code == 200:
            address_data = address_resp.json()
            if address_data and "id" in address_data:
                addr_id = address_data.get("id")
                if isinstance(addr_id, str) and addr_id:
                    address_id = addr_id

        order_url = f"{BASE_URL}/api/orders"
        order_payload = {"items": items}
        if address_id:
            order_payload["addressId"] = address_id

        # Create order
        order_resp = session.post(order_url, headers=headers, json=order_payload, timeout=TIMEOUT)
        assert order_resp.status_code == 200, f"Create order failed with status {order_resp.status_code}"
        order_data = order_resp.json()
        assert "success" in order_data and order_data["success"] is True, "Order creation unsuccessful"
        # Validate returned order contains expected fields
        assert "order" in order_data or "id" in order_data or "orderId" in order_data, "Order ID missing in response"

    finally:
        session.close()

test_create_order_with_valid_items()
