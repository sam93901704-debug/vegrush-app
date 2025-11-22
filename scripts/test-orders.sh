#!/bin/bash

# Test Orders Script
# This script tests order creation and assignment flow using curl
# Prerequisites:
# - Backend server running on http://localhost:4000
# - A demo user with JWT token (login via POST /api/auth/google)
# - At least one product in database
# - At least one delivery boy in database
# - At least one address for the user
# - Admin JWT token for assignment operations

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:4000}"
USER_TOKEN="${USER_TOKEN:-}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
USER_ID="${USER_ID:-}"
ADDRESS_ID="${ADDRESS_ID:-}"
PRODUCT_ID="${PRODUCT_ID:-}"
DELIVERY_BOY_ID="${DELIVERY_BOY_ID:-}"

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Print section header
section_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Test 1: Check if server is running
test_server_health() {
    section_header "Test 1: Server Health Check"
    
    log_info "Checking server health..."
    if curl -s -f "${BASE_URL}/health" > /dev/null; then
        log_success "Server is running and healthy"
        return 0
    else
        log_error "Server is not responding. Make sure backend is running on ${BASE_URL}"
        return 1
    fi
}

# Test 2: Get demo user token (if not provided)
get_user_token() {
    section_header "Test 2: User Authentication"
    
    if [ -z "$USER_TOKEN" ]; then
        log_warning "USER_TOKEN not provided. Skipping user auth test."
        log_info "To get a user token, use:"
        log_info "  curl -X POST ${BASE_URL}/api/auth/google \\"
        log_info "    -H 'Content-Type: application/json' \\"
        log_info "    -d '{\"idToken\": \"<google-id-token>\"}'"
        return 1
    else
        log_success "Using provided USER_TOKEN"
        return 0
    fi
}

# Test 3: Get admin token (if not provided)
get_admin_token() {
    section_header "Test 3: Admin Authentication"
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log_warning "ADMIN_TOKEN not provided. Skipping admin auth test."
        log_info "To get an admin token, use:"
        log_info "  curl -X POST ${BASE_URL}/api/auth/admin/google \\"
        log_info "    -H 'Content-Type: application/json' \\"
        log_info "    -d '{\"idToken\": \"<google-id-token>\"}'"
        return 1
    else
        log_success "Using provided ADMIN_TOKEN"
        return 0
    fi
}

# Test 4: Get user's address
get_user_address() {
    section_header "Test 4: Get User Address"
    
    if [ -z "$USER_TOKEN" ]; then
        log_warning "USER_TOKEN required. Skipping address fetch."
        return 1
    fi
    
    log_info "Fetching user's default address..."
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X GET "${BASE_URL}/api/user/address" \
        -H "Authorization: Bearer ${USER_TOKEN}" \
        -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        ADDRESS_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        log_success "Address found: ${ADDRESS_ID}"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        return 0
    else
        log_error "Failed to get address. HTTP $HTTP_CODE"
        echo "$BODY"
        log_warning "You may need to create an address first via POST /api/user/location"
        return 1
    fi
}

# Test 5: Get available products
get_products() {
    section_header "Test 5: Get Available Products"
    
    log_info "Fetching products..."
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X GET "${BASE_URL}/api/products?limit=5" \
        -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        PRODUCT_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        if [ -n "$PRODUCT_ID" ]; then
            log_success "Products found. Using first product: ${PRODUCT_ID}"
            echo "$BODY" | jq '.data[0]' 2>/dev/null || echo "$BODY" | head -20
            return 0
        else
            log_error "No products found in response"
            echo "$BODY"
            return 1
        fi
    else
        log_error "Failed to get products. HTTP $HTTP_CODE"
        echo "$BODY"
        return 1
    fi
}

# Test 6: Get delivery boys (admin)
get_delivery_boys() {
    section_header "Test 6: Get Active Delivery Boys"
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log_warning "ADMIN_TOKEN required. Skipping delivery boys fetch."
        return 1
    fi
    
    log_info "Fetching active delivery boys..."
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X GET "${BASE_URL}/api/admin/delivery-boys" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        DELIVERY_BOY_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        if [ -n "$DELIVERY_BOY_ID" ]; then
            log_success "Delivery boys found. Using first: ${DELIVERY_BOY_ID}"
            echo "$BODY" | jq '.data[0]' 2>/dev/null || echo "$BODY" | head -20
            return 0
        else
            log_error "No delivery boys found in response"
            echo "$BODY"
            return 1
        fi
    else
        log_error "Failed to get delivery boys. HTTP $HTTP_CODE"
        echo "$BODY"
        return 1
    fi
}

# Test 7: Create an order
create_order() {
    section_header "Test 7: Create Order"
    
    if [ -z "$USER_TOKEN" ] || [ -z "$ADDRESS_ID" ] || [ -z "$PRODUCT_ID" ]; then
        log_error "Missing required data: USER_TOKEN, ADDRESS_ID, or PRODUCT_ID"
        return 1
    fi
    
    log_info "Creating order with product ${PRODUCT_ID} at address ${ADDRESS_ID}..."
    
    ORDER_BODY=$(cat <<EOF
{
  "items": [
    {
      "productId": "${PRODUCT_ID}",
      "qty": 2
    }
  ],
  "addressId": "${ADDRESS_ID}"
}
EOF
)
    
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST "${BASE_URL}/api/orders" \
        -H "Authorization: Bearer ${USER_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${ORDER_BODY}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 201 ]; then
        ORDER_ID=$(echo "$BODY" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        ORDER_NUMBER=$(echo "$BODY" | grep -o '"orderNumber":"[^"]*' | head -1 | cut -d'"' -f4)
        log_success "Order created successfully!"
        log_success "Order ID: ${ORDER_ID}"
        log_success "Order Number: ${ORDER_NUMBER}"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        
        # Export order ID for next test
        export ORDER_ID
        export ORDER_NUMBER
        return 0
    else
        log_error "Failed to create order. HTTP $HTTP_CODE"
        echo "$BODY"
        return 1
    fi
}

# Test 8: Get order status
get_order_status() {
    section_header "Test 8: Get Order Status"
    
    if [ -z "$ORDER_ID" ] || [ -z "$USER_TOKEN" ]; then
        log_warning "ORDER_ID or USER_TOKEN missing. Skipping order status check."
        return 1
    fi
    
    log_info "Fetching order ${ORDER_ID}..."
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X GET "${BASE_URL}/api/orders/${ORDER_ID}" \
        -H "Authorization: Bearer ${USER_TOKEN}" \
        -H "Content-Type: application/json")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        ORDER_STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
        log_success "Order status: ${ORDER_STATUS}"
        echo "$BODY" | jq '{id, orderNumber, status, totalAmount, assignedDeliveryId}' 2>/dev/null || echo "$BODY" | head -10
        export ORDER_STATUS
        return 0
    else
        log_error "Failed to get order. HTTP $HTTP_CODE"
        echo "$BODY"
        return 1
    fi
}

# Test 9: Assign delivery boy (admin)
assign_delivery_boy() {
    section_header "Test 9: Assign Delivery Boy"
    
    if [ -z "$ORDER_ID" ] || [ -z "$ADMIN_TOKEN" ] || [ -z "$DELIVERY_BOY_ID" ]; then
        log_error "Missing required data: ORDER_ID, ADMIN_TOKEN, or DELIVERY_BOY_ID"
        return 1
    fi
    
    log_info "Assigning delivery boy ${DELIVERY_BOY_ID} to order ${ORDER_ID}..."
    
    ASSIGN_BODY=$(cat <<EOF
{
  "deliveryBoyId": "${DELIVERY_BOY_ID}"
}
EOF
)
    
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST "${BASE_URL}/api/admin/orders/${ORDER_ID}/assign" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${ASSIGN_BODY}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        NEW_STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
        ASSIGNED_DELIVERY_ID=$(echo "$BODY" | grep -o '"assignedDeliveryId":"[^"]*' | head -1 | cut -d'"' -f4)
        log_success "Delivery boy assigned successfully!"
        log_success "New status: ${NEW_STATUS}"
        log_success "Assigned delivery ID: ${ASSIGNED_DELIVERY_ID}"
        echo "$BODY" | jq '{id, orderNumber, status, assignedDeliveryId, outForDeliveryAt}' 2>/dev/null || echo "$BODY" | head -15
        export ORDER_STATUS="${NEW_STATUS}"
        return 0
    else
        log_error "Failed to assign delivery boy. HTTP $HTTP_CODE"
        echo "$BODY"
        return 1
    fi
}

# Test 10: Update order status (admin)
update_order_status() {
    section_header "Test 10: Update Order Status"
    
    if [ -z "$ORDER_ID" ] || [ -z "$ADMIN_TOKEN" ]; then
        log_error "Missing required data: ORDER_ID or ADMIN_TOKEN"
        return 1
    fi
    
    # Determine next status based on current status
    CURRENT_STATUS="${ORDER_STATUS:-pending}"
    case "$CURRENT_STATUS" in
        "pending")
            NEXT_STATUS="confirmed"
            ;;
        "confirmed")
            NEXT_STATUS="preparing"
            ;;
        "preparing")
            NEXT_STATUS="out_for_delivery"
            ;;
        "out_for_delivery")
            NEXT_STATUS="delivered"
            ;;
        *)
            log_warning "Current status '${CURRENT_STATUS}' doesn't allow status update. Skipping."
            return 1
            ;;
    esac
    
    log_info "Updating order ${ORDER_ID} status from '${CURRENT_STATUS}' to '${NEXT_STATUS}'..."
    
    STATUS_BODY=$(cat <<EOF
{
  "status": "${NEXT_STATUS}"
}
EOF
)
    
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X PATCH "${BASE_URL}/api/admin/orders/${ORDER_ID}/status" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${STATUS_BODY}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 200 ]; then
        NEW_STATUS=$(echo "$BODY" | grep -o '"status":"[^"]*' | head -1 | cut -d'"' -f4)
        log_success "Order status updated successfully!"
        log_success "New status: ${NEW_STATUS}"
        echo "$BODY" | jq '{id, orderNumber, status, pickedAt, outForDeliveryAt, deliveredAt}' 2>/dev/null || echo "$BODY" | head -15
        export ORDER_STATUS="${NEW_STATUS}"
        return 0
    else
        log_error "Failed to update order status. HTTP $HTTP_CODE"
        echo "$BODY"
        return 1
    fi
}

# Test 11: Verify status transition
verify_status_transition() {
    section_header "Test 11: Verify Status Transition"
    
    if [ -z "$ORDER_ID" ]; then
        log_warning "ORDER_ID missing. Skipping verification."
        return 1
    fi
    
    log_info "Verifying order status transitions..."
    
    # Test invalid transition
    log_info "Attempting invalid transition (delivered -> pending)..."
    INVALID_BODY='{"status": "pending"}'
    
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X PATCH "${BASE_URL}/api/admin/orders/${ORDER_ID}/status" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${INVALID_BODY}")
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -eq 400 ]; then
        log_success "Invalid transition correctly rejected (HTTP 400)"
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
        return 0
    else
        log_error "Invalid transition was not rejected. HTTP $HTTP_CODE"
        echo "$BODY"
        return 1
    fi
}

# Main test flow
main() {
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║           Order Creation & Assignment Test Suite          ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        log_error "curl is not installed. Please install curl first."
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed. JSON output will be unformatted."
        log_warning "Install jq for better output: apt-get install jq (Linux) or brew install jq (Mac)"
    fi
    
    # Run tests
    test_server_health || exit 1
    
    # Optional: Get tokens if not provided
    get_user_token
    get_admin_token
    
    # Get required data
    if [ -z "$ADDRESS_ID" ]; then
        get_user_address || log_warning "Address not found. Set ADDRESS_ID manually."
    fi
    
    if [ -z "$PRODUCT_ID" ]; then
        get_products || exit 1
    fi
    
    if [ -z "$DELIVERY_BOY_ID" ] && [ -n "$ADMIN_TOKEN" ]; then
        get_delivery_boys || log_warning "Delivery boy not found. Set DELIVERY_BOY_ID manually."
    fi
    
    # Create order (if we have all required data)
    if [ -n "$USER_TOKEN" ] && [ -n "$ADDRESS_ID" ] && [ -n "$PRODUCT_ID" ]; then
        create_order || exit 1
        
        # Get order status
        get_order_status
        
        # Assign delivery boy (if admin token and delivery boy available)
        if [ -n "$ADMIN_TOKEN" ] && [ -n "$DELIVERY_BOY_ID" ] && [ -n "$ORDER_ID" ]; then
            assign_delivery_boy
            
            # Update status
            if [ -n "$ORDER_ID" ]; then
                update_order_status
                get_order_status
                
                # Test invalid transition
                verify_status_transition
            fi
        else
            log_warning "Skipping assignment and status update tests (missing ADMIN_TOKEN or DELIVERY_BOY_ID)"
        fi
    else
        log_warning "Skipping order creation (missing USER_TOKEN, ADDRESS_ID, or PRODUCT_ID)"
        log_info "Set these environment variables and run again:"
        log_info "  export USER_TOKEN='<your-user-jwt-token>'"
        log_info "  export ADDRESS_ID='<user-address-id>'"
        log_info "  export PRODUCT_ID='<product-id>'"
        log_info "  export ADMIN_TOKEN='<admin-jwt-token>'"
        log_info "  export DELIVERY_BOY_ID='<delivery-boy-id>'"
    fi
    
    # Summary
    section_header "Test Summary"
    if [ -n "$ORDER_ID" ]; then
        log_success "Order ${ORDER_ID} was created and tested"
        log_info "You can view the order at: ${BASE_URL}/api/orders/${ORDER_ID}"
    else
        log_warning "Order creation was skipped. Set required environment variables and run again."
    fi
    
    echo ""
    log_info "All tests completed!"
}

# Run main function
main

