import requests

BASE_URL = "http://localhost:4000"
ADMIN_USERNAME = "sam93901704@gmail.com"
ADMIN_PASSWORD = "Sameer@123"
TIMEOUT = 30

def test_update_product_details():
    # Admin login to get auth token
    login_url = f"{BASE_URL}/api/auth/admin/login"
    login_payload = {
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    }
    try:
        login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        login_resp.raise_for_status()
    except Exception as e:
        raise Exception(f"Admin login failed: {e}")
    login_data = login_resp.json()
    assert login_data.get("success") is True, "Login success is False"
    token = login_data.get("token")
    assert token, "Missing token in login response"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # First create a new product to update
    create_url = f"{BASE_URL}/api/admin/products"
    new_product_payload = {
        "name": "Test Product Update",
        "description": "Initial description",
        "category": "Test Category",
        "price": 100,
        "unitType": "kg",
        "unitValue": 1.0,
        "stockQty": 50,
        "imageUrl": "http://example.com/image.jpg",
        "isActive": True
    }
    product_id = None
    try:
        create_resp = requests.post(create_url, json=new_product_payload, headers=headers, timeout=TIMEOUT)
        create_resp.raise_for_status()
        create_data = create_resp.json()
        assert create_resp.status_code == 200, f"Unexpected status code on product creation: {create_resp.status_code}"
        # The response schema is not fully detailed for creation success, assume it returns the product details with id
        # So try to extract product id from response
        if isinstance(create_data, dict) and 'id' in create_data:
            product_id = create_data['id']
        else:
            # Try to find id in deeper response (fallback)
            keys = list(create_data.keys())
            if keys:
                possible_obj = create_data[keys[0]]
                if isinstance(possible_obj, dict) and 'id' in possible_obj:
                    product_id = possible_obj['id']
        assert product_id, "Created product does not have an id"
        
        # Now update the product details
        update_url = f"{BASE_URL}/api/admin/products/{product_id}"
        update_payload = {
            "name": "Updated Product Name",
            "description": "Updated description of the product",
            "category": "Updated Category",
            "price": 150,
            "unitType": "piece",
            "unitValue": 2.5,
            "stockQty": 75,
            "imageUrl": "http://example.com/updated-image.jpg",
            "isActive": False
        }
        update_resp = requests.put(update_url, json=update_payload, headers=headers, timeout=TIMEOUT)
        update_resp.raise_for_status()
        update_data = update_resp.json()
        assert update_resp.status_code == 200, f"Unexpected status code on product update: {update_resp.status_code}"

        # Verify updated data by getting product details
        get_url = f"{BASE_URL}/api/products/{product_id}"
        get_resp = requests.get(get_url, timeout=TIMEOUT)
        get_resp.raise_for_status()
        product_data = get_resp.json()
        # Verify the updated fields match what was sent
        assert product_data.get("name") == update_payload["name"], "Name not updated correctly"
        assert product_data.get("description") == update_payload["description"], "Description not updated correctly"
        assert product_data.get("category") == update_payload["category"], "Category not updated correctly"
        assert product_data.get("price") == update_payload["price"], "Price not updated correctly"
        assert product_data.get("unitType") == update_payload["unitType"], "unitType not updated correctly"
        assert product_data.get("unitValue") == update_payload["unitValue"], "unitValue not updated correctly"
        assert product_data.get("stockQty") == update_payload["stockQty"], "stockQty not updated correctly"
        assert product_data.get("imageUrl") == update_payload["imageUrl"], "imageUrl not updated correctly"
        assert product_data.get("isActive") == update_payload["isActive"], "isActive not updated correctly"

    finally:
        # Cleanup: delete created product if created
        if product_id:
            delete_url = f"{BASE_URL}/api/admin/products/{product_id}"
            try:
                del_resp = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
                if del_resp.status_code not in (200,204):
                    print(f"Warning: Failed to delete product with id {product_id} during cleanup, status code: {del_resp.status_code}")
            except Exception as e:
                print(f"Warning: Exception deleting product with id {product_id} during cleanup: {e}")

test_update_product_details()