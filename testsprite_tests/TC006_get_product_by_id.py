import requests

BASE_URL = "http://localhost:4000"
TIMEOUT = 30


def test_get_product_by_id():
    # First, get product list to obtain a valid product id
    product_list_url = f"{BASE_URL}/api/products"
    try:
        product_list_resp = requests.get(product_list_url, timeout=TIMEOUT)
        product_list_resp.raise_for_status()
        product_list = product_list_resp.json()
    except Exception as e:
        assert False, f"Failed to get product list: {e}"

    # Extract product ID - support list or dict with 'products' or 'data'
    product_id = None
    if isinstance(product_list, list) and len(product_list) > 0:
        product_id = product_list[0].get("id") if isinstance(product_list[0], dict) else None
    elif isinstance(product_list, dict):
        if "products" in product_list and isinstance(product_list["products"], list) and len(product_list["products"]) > 0:
            product_id = product_list["products"][0].get("id")
        elif "data" in product_list and isinstance(product_list["data"], list) and len(product_list["data"]) > 0:
            product_id = product_list["data"][0].get("id")
    assert product_id, "No product ID found to test get product by id"

    # Now get product by id (public, no auth)
    product_detail_url = f"{BASE_URL}/api/products/{product_id}"
    try:
        resp = requests.get(
            product_detail_url,
            timeout=TIMEOUT,
        )
        resp.raise_for_status()
    except requests.exceptions.HTTPError as he:
        assert False, f"HTTP error occurred: {he}"
    except Exception as e:
        assert False, f"Request failed: {e}"

    product = resp.json()
    # Validate product detail response structure and correctness
    assert product, "Empty response for product detail"
    if isinstance(product, dict):
        # Check that id matches
        assert "id" in product, "'id' field missing in product detail"
        assert product["id"] == product_id, "Product ID in response does not match requested ID"
        # Check mandatory fields presence - name, category, price, unitType, unitValue per schema
        required_fields = ["name", "category", "price", "unitType", "unitValue"]
        for field in required_fields:
            assert field in product, f"Mandatory field '{field}' missing in product detail"
    else:
        assert False, "Unexpected product detail response format"


test_get_product_by_id()
