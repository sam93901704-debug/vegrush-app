import requests

BASE_URL = "http://localhost:4000"
TIMEOUT = 30

def test_list_products_with_pagination_and_filters():
    url = f"{BASE_URL}/api/products"

    # Test parameters for pagination and filters
    params_list = [
        {"page": 1, "limit": 5},  # basic pagination
        {"category": "vegetables"},  # category filter
        {"search": "tomato"},  # search keyword filter
        {"in_stock": "true"},  # in_stock filter true
        {"in_stock": "false"},  # in_stock filter false
        {"page": 2, "limit": 3, "category": "fruits", "search": "apple", "in_stock": "1"}  # combined filters
    ]

    for params in params_list:
        try:
            response = requests.get(url, params=params, timeout=TIMEOUT)
            # The /api/products endpoint is a public route and does not require auth
            assert response.status_code == 200, f"Failed for params {params} with status {response.status_code}"
            data = response.json()
            # Expecting a list or dictionary with products array/key
            # At minimum, ensure response is JSON and contains some form of product data
            assert isinstance(data, dict) or isinstance(data, list), "Response JSON is not a dict or list"
            # If dict, it should have products or similar key - heuristic checks
            if isinstance(data, dict):
                if "products" in data:
                    assert isinstance(data["products"], list), "'products' key is not a list"
                elif "data" in data:
                    # sometimes response might wrap products inside data
                    assert isinstance(data["data"], list), "'data' key is not a list"
            # If list, it is directly the products list
        except requests.exceptions.RequestException as e:
            assert False, f"HTTP request failed: {e}"

test_list_products_with_pagination_and_filters()
