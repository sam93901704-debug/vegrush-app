# Scripts Documentation

This directory contains utility scripts for local development and testing.

## test-orders.sh

A comprehensive test script that validates the order creation and assignment flow.

### Prerequisites

1. **Backend server running**: The script expects the backend to be running on `http://localhost:4000` (or set `BASE_URL` environment variable).

2. **Required tools**:
   - `curl` - for making HTTP requests
   - `jq` (optional) - for pretty-printing JSON responses

3. **Database setup**:
   - At least one active product
   - At least one delivery boy with active status
   - At least one user with an address

### Environment Variables

You can set these environment variables before running the script:

```bash
# Required for order creation
export USER_TOKEN="<jwt-token-from-google-login>"
export ADDRESS_ID="<user-address-uuid>"
export PRODUCT_ID="<product-uuid>"

# Required for assignment and status updates
export ADMIN_TOKEN="<admin-jwt-token>"
export DELIVERY_BOY_ID="<delivery-boy-uuid>"

# Optional: Custom backend URL
export BASE_URL="http://localhost:4000"
```

### How to Get Tokens

#### 1. Get User Token

```bash
curl -X POST http://localhost:4000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "<google-id-token-from-client>"
  }'
```

Response will include a `token` field. Copy this to `USER_TOKEN`.

#### 2. Get Admin Token

```bash
curl -X POST http://localhost:4000/api/auth/admin/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "<google-id-token-from-admin-google-account>"
  }'
```

Response will include a `token` field. Copy this to `ADMIN_TOKEN`.

#### 3. Get User Address ID

```bash
curl -X GET http://localhost:4000/api/user/address \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json"
```

Or create one:

```bash
curl -X POST http://localhost:4000/api/user/location \
  -H "Authorization: Bearer ${USER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 19.0760,
    "longitude": 72.8777,
    "fullAddress": "123 Test Street, Mumbai",
    "city": "Mumbai",
    "pincode": "400001"
  }'
```

#### 4. Get Product ID

```bash
curl -X GET http://localhost:4000/api/products?limit=1 \
  -H "Content-Type: application/json"
```

Copy the `id` field from the first product in the response.

#### 5. Get Delivery Boy ID

```bash
curl -X GET http://localhost:4000/api/admin/delivery-boys \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json"
```

Copy the `id` field from the first delivery boy in the response.

### Running the Script

#### Basic Usage

```bash
# Make script executable (first time only)
chmod +x scripts/test-orders.sh

# Run with environment variables
export USER_TOKEN="your-token"
export ADDRESS_ID="address-uuid"
export PRODUCT_ID="product-uuid"
export ADMIN_TOKEN="admin-token"
export DELIVERY_BOY_ID="delivery-boy-uuid"

./scripts/test-orders.sh
```

#### Partial Test (without tokens)

If you don't have tokens, the script will:
- Test server health
- Fetch products (if available)
- Skip order creation and assignment tests
- Show helpful messages about what's needed

#### One-liner with all variables

```bash
USER_TOKEN="..." \
ADDRESS_ID="..." \
PRODUCT_ID="..." \
ADMIN_TOKEN="..." \
DELIVERY_BOY_ID="..." \
./scripts/test-orders.sh
```

### What the Script Tests

1. **Server Health** - Checks if backend is running
2. **User Authentication** - Validates user token (if provided)
3. **Admin Authentication** - Validates admin token (if provided)
4. **Get User Address** - Fetches user's default address
5. **Get Products** - Fetches available products
6. **Get Delivery Boys** - Fetches active delivery boys (admin)
7. **Create Order** - Creates a test order with items
8. **Get Order Status** - Fetches order details
9. **Assign Delivery Boy** - Assigns a delivery boy to the order
10. **Update Order Status** - Tests status transitions
11. **Verify Status Transition** - Verifies invalid transitions are rejected

### Expected Output

The script will:
- Show colored output (green for success, red for errors, yellow for warnings)
- Display JSON responses (formatted with jq if available)
- Log HTTP status codes
- Export variables for subsequent tests
- Provide helpful error messages and suggestions

### Troubleshooting

#### Server not responding

```bash
# Make sure backend is running
cd backend
npm run dev
```

#### Missing dependencies

```bash
# Install curl (if missing)
# Ubuntu/Debian:
sudo apt-get install curl jq

# macOS:
brew install curl jq

# Windows:
# Use Git Bash or WSL
```

#### Token expired

If you get 401 Unauthorized errors, your token may have expired. Generate a new token using the login endpoints.

#### No products found

Make sure you've seeded the database:

```bash
cd backend
npm run seed
```

Or create products via the admin panel.

#### Address not found

Create an address first using the `POST /api/user/location` endpoint (see "Get User Address ID" above).

### Example Full Flow

```bash
# 1. Start backend server (in another terminal)
cd backend
npm run dev

# 2. Get tokens and IDs
USER_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"..."}' | jq -r '.token')

ADDRESS_ID=$(curl -s -X GET http://localhost:4000/api/user/address \
  -H "Authorization: Bearer ${USER_TOKEN}" | jq -r '.id')

PRODUCT_ID=$(curl -s -X GET http://localhost:4000/api/products?limit=1 | jq -r '.data[0].id')

ADMIN_TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/admin/google \
  -H "Content-Type: application/json" \
  -d '{"idToken":"..."}' | jq -r '.token')

DELIVERY_BOY_ID=$(curl -s -X GET http://localhost:4000/api/admin/delivery-boys \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.data[0].id')

# 3. Run test script
./scripts/test-orders.sh
```

### Notes

- The script uses environment variables that are exported, so they persist for the session
- All HTTP requests include proper headers and error handling
- The script exits on critical errors but continues with warnings for optional tests
- JSON output is formatted using `jq` if available, otherwise shows raw JSON

