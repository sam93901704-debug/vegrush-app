import requests
import uuid

BASE_URL = "http://localhost:4000"
ADMIN_LOGIN_ENDPOINT = "/api/auth/admin/login"
CREATE_PRODUCT_ENDPOINT = "/api/admin/products"
UPDATE_PRODUCT_STOCK_ENDPOINT = "/api/admin/products/{id}/stock"
DELETE_PRODUCT_ENDPOINT = "/api/admin/products/{id}"

USERNAME = "sam93901704@gmail.com"
PASSWORD = "Sameer@123"
TIMEOUT = 30


def test_update_product_stock_quantity():
    admin_token = None
    product_id = None

    try:
        # Admin login to get token
        login_payload = {
            "username": USERNAME,
            "password": PASSWORD
        }
        login_resp = requests.post(
            BASE_URL + ADMIN_LOGIN_ENDPOINT,
            json=login_payload,
            timeout=TIMEOUT
        )
        login_resp.raise_for_status()
        login_data = login_resp.json()
        assert login_data.get("success") is True
        admin_token = login_data.get("token")
        assert isinstance(admin_token, str) and admin_token != ""

        headers = {
            "Authorization": f"Bearer {admin_token}",
            "Content-Type": "application/json"
        }

        # Create a new product to update stockQty
        create_payload = {
            "name": f"Test Product {uuid.uuid4()}",
            "category": "Vegetables",
            "price": 100,
            "unitType": "kg",
            "unitValue": 1,
            "stockQty": 50,
            "description": "Test product description",
            "imageUrl": "http://example.com/image.jpg",
            "isActive": True
        }
        create_resp = requests.post(
            BASE_URL + CREATE_PRODUCT_ENDPOINT,
            headers=headers,
            json=create_payload,
            timeout=TIMEOUT
        )
        create_resp.raise_for_status()
        create_data = create_resp.json()

        # Extract product ID from response
        if "product" in create_data and isinstance(create_data["product"], dict) and "id" in create_data["product"]:
            product_id = create_data["product"]["id"]
        elif "id" in create_data:
            product_id = create_data["id"]
        else:
            raise AssertionError("Product ID not found in create response")

        # Prepare patch payload to update only stockQty
        new_stock_qty = 75
        update_payload = {
            "stockQty": new_stock_qty
        }

        # Make PATCH request to update stock quantity
        update_resp = requests.patch(
            BASE_URL + UPDATE_PRODUCT_STOCK_ENDPOINT.format(id=product_id),
            headers=headers,
            json=update_payload,
            timeout=TIMEOUT
        )
        update_resp.raise_for_status()
        update_data = update_resp.json()

        # Validate response status code 200
        assert update_resp.status_code == 200

        # Verify updated stock quantity by fetching product details
        get_resp = requests.get(
            f"{BASE_URL}/api/products/{product_id}",
            timeout=TIMEOUT
        )
        get_resp.raise_for_status()
        product_data = get_resp.json()

        # Check if product details nested under 'product' key
        if "product" in product_data and isinstance(product_data["product"], dict):
            product_details = product_data["product"]
        else:
            product_details = product_data

        assert "stockQty" in product_details, "Response missing stockQty"
        assert product_details["stockQty"] == new_stock_qty, f"Expected stockQty {new_stock_qty}, got {product_details['stockQty']}"

    finally:
        if product_id and admin_token:
            try:
                # Cleanup - delete created product
                del_headers = {
                    "Authorization": f"Bearer {admin_token}"
                }
                del_resp = requests.delete(
                    BASE_URL + DELETE_PRODUCT_ENDPOINT.format(id=product_id),
                    headers=del_headers,
                    timeout=TIMEOUT
                )
                del_resp.raise_for_status()
            except Exception:
                pass


test_update_product_stock_quantity()
