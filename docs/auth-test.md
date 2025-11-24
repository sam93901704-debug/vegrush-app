# Authentication System - API Testing Guide

This document provides curl examples and testing instructions for the authentication system.

## Environment Variables Required

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for signing JWT tokens (min 32 chars)
- `JWT_EXPIRES_IN` - Token expiration time (optional, default: '7d')

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `https://vegrush-backend.onrender.com`)

## API Endpoints

### Base URL
Replace `{API_URL}` with your backend URL (e.g., `https://vegrush-backend.onrender.com`)

---

## 1. Customer Signup

**Endpoint:** `POST /api/auth/signup`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123"
}
```

**Note:** Either `email` OR `phone` is required (not both). `name` is optional.

**cURL Example:**
```bash
curl -X POST {API_URL}/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": null,
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Validation error (missing fields, invalid format)
- `409` - User already exists

---

## 2. Customer Login

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "identifier": "john@example.com",
  "password": "password123"
}
```

**Note:** `identifier` can be email or phone number.

**cURL Example:**
```bash
curl -X POST {API_URL}/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john@example.com",
    "password": "password123"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": null,
    "role": "customer"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Missing identifier or password
- `401` - Invalid credentials

---

## 3. Admin Login

**Endpoint:** `POST /api/auth/admin/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**cURL Example:**
```bash
curl -X POST {API_URL}/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "admin": {
    "id": "uuid",
    "username": "admin",
    "email": null,
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400` - Missing username or password
- `401` - Invalid credentials

---

## 4. Delivery Signup

**Endpoint:** `POST /api/auth/delivery/signup`

**Request Body:**
```json
{
  "name": "Delivery Boy",
  "phone": "9876543210",
  "password": "delivery123",
  "vehicleNumber": "MH-12-AB-1234"
}
```

**cURL Example:**
```bash
curl -X POST {API_URL}/api/auth/delivery/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Delivery Boy",
    "phone": "9876543210",
    "password": "delivery123",
    "vehicleNumber": "MH-12-AB-1234"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "delivery": {
    "id": "uuid",
    "name": "Delivery Boy",
    "phone": "9876543210",
    "vehicleNumber": "MH-12-AB-1234",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 5. Delivery Login

**Endpoint:** `POST /api/auth/delivery/login-password`

**Request Body:**
```json
{
  "phone": "9876543210",
  "password": "delivery123",
  "fcmToken": "optional-fcm-token"
}
```

**cURL Example:**
```bash
curl -X POST {API_URL}/api/auth/delivery/login-password \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "password": "delivery123"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "delivery": {
    "id": "uuid",
    "name": "Delivery Boy",
    "phone": "9876543210",
    "vehicleNumber": "MH-12-AB-1234",
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 6. Get Current User (Protected)

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**cURL Example:**
```bash
curl -X GET {API_URL}/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Success Response (200):**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": null,
    "profilePic": null,
    "phoneVerified": false
  }
}
```

**Error Responses:**
- `401` - No token or invalid token

---

## 7. Access Protected Admin Route

**Endpoint:** `GET /api/admin/products`

**Headers:**
```
Authorization: Bearer {admin_token}
```

**cURL Example:**
```bash
curl -X GET {API_URL}/api/admin/products \
  -H "Authorization: Bearer {admin_token}"
```

**Success Response (200):**
```json
{
  "data": [...products],
  "pagination": {...}
}
```

**Error Responses:**
- `401` - Not authenticated
- `403` - Not authorized (not admin)

---

## Testing Checklist

### ✅ Customer Flow
1. **Signup with email**
   - [ ] Create account with email and password
   - [ ] Verify token is returned
   - [ ] Verify user object is returned

2. **Signup with phone**
   - [ ] Create account with phone and password
   - [ ] Verify token is returned

3. **Login**
   - [ ] Login with email
   - [ ] Login with phone
   - [ ] Verify token is returned
   - [ ] Verify user object matches signup

4. **Get Current User**
   - [ ] Use token from login
   - [ ] Verify user data is returned
   - [ ] Test with invalid token (should return 401)

### ✅ Admin Flow
1. **Create Admin User** (via database seed or manual insert)
   ```sql
   INSERT INTO "AdminUser" (id, username, password, role)
   VALUES (gen_random_uuid(), 'admin', '$2a$10$hashed_password', 'admin');
   ```

2. **Admin Login**
   - [ ] Login with username and password
   - [ ] Verify admin token is returned
   - [ ] Test with wrong password (should return 401)

3. **Access Admin Routes**
   - [ ] Use admin token to access `/api/admin/products`
   - [ ] Verify products are returned
   - [ ] Test with customer token (should return 403)

### ✅ Delivery Flow
1. **Delivery Signup**
   - [ ] Create delivery account
   - [ ] Verify token is returned

2. **Delivery Login**
   - [ ] Login with phone and password
   - [ ] Verify token is returned

3. **Access Delivery Routes**
   - [ ] Use delivery token to access delivery endpoints
   - [ ] Verify access is granted

### ✅ Security Tests
1. **Token Validation**
   - [ ] Test expired token (should return 401)
   - [ ] Test invalid token format (should return 401)
   - [ ] Test missing token (should return 401)

2. **Password Security**
   - [ ] Test password minimum length (6 chars)
   - [ ] Test password hashing (verify stored hash != plain text)
   - [ ] Test password comparison (wrong password should fail)

3. **Role-Based Access**
   - [ ] Customer cannot access admin routes
   - [ ] Admin can access admin routes
   - [ ] Delivery cannot access admin routes

### ✅ Frontend Integration
1. **Signup Page** (`/auth/signup`)
   - [ ] Form validation works
   - [ ] Email/phone toggle works
   - [ ] Success redirects to `/customer`
   - [ ] Error messages display correctly

2. **Login Page** (`/auth/login`)
   - [ ] Form validation works
   - [ ] Success redirects to `/customer`
   - [ ] Error messages display correctly

3. **Admin Login Page** (`/admin/login`)
   - [ ] Form validation works
   - [ ] Success redirects to `/admin`
   - [ ] Error messages display correctly

4. **Protected Routes**
   - [ ] `/admin` requires admin role
   - [ ] Unauthenticated users redirected to login
   - [ ] Token persists in localStorage
   - [ ] Auto-login on page refresh works

5. **Token Storage**
   - [ ] Token stored in localStorage as `vegrush_token`
   - [ ] Token included in API requests automatically
   - [ ] Logout clears token

---

## Manual Testing Steps

### Step 1: Setup Database
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Step 2: Create Test Admin User
```bash
# Option 1: Use seed script
npm run seed

# Option 2: Manual SQL (replace password hash)
psql $DATABASE_URL
INSERT INTO "AdminUser" (id, username, password, role)
VALUES (gen_random_uuid(), 'admin', '$2a$10$hashed_password_here', 'admin');
```

### Step 3: Test Customer Signup
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Step 4: Test Customer Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"test123"}'
```

### Step 5: Test Get Current User
```bash
# Replace {token} with token from login response
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer {token}"
```

### Step 6: Test Admin Login
```bash
curl -X POST http://localhost:4000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Step 7: Test Protected Admin Route
```bash
# Replace {admin_token} with admin token
curl -X GET http://localhost:4000/api/admin/products \
  -H "Authorization: Bearer {admin_token}"
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "VEG RUSH Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Customer Signup",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "{{API_URL}}/api/auth/signup",
          "host": ["{{API_URL}}"],
          "path": ["api", "auth", "signup"]
        }
      }
    },
    {
      "name": "Customer Login",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"identifier\": \"john@example.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "{{API_URL}}/api/auth/login",
          "host": ["{{API_URL}}"],
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "Get Current User",
      "request": {
        "method": "GET",
        "header": [{"key": "Authorization", "value": "Bearer {{token}}"}],
        "url": {
          "raw": "{{API_URL}}/api/auth/me",
          "host": ["{{API_URL}}"],
          "path": ["api", "auth", "me"]
        }
      }
    },
    {
      "name": "Admin Login",
      "request": {
        "method": "POST",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"username\": \"admin\",\n  \"password\": \"admin123\"\n}"
        },
        "url": {
          "raw": "{{API_URL}}/api/auth/admin/login",
          "host": ["{{API_URL}}"],
          "path": ["api", "auth", "admin", "login"]
        }
      }
    }
  ],
  "variable": [
    {"key": "API_URL", "value": "http://localhost:4000"},
    {"key": "token", "value": ""}
  ]
}
```

---

## Troubleshooting

### Issue: "JWT_SECRET environment variable is not configured"
**Solution:** Set `JWT_SECRET` in your backend `.env` file (min 32 characters)

### Issue: "Password must be at least 6 characters"
**Solution:** Ensure password meets minimum length requirement

### Issue: "User with this email or phone already exists"
**Solution:** Use a different email/phone or login with existing credentials

### Issue: "Invalid token" on frontend
**Solution:** 
- Check token is stored correctly in localStorage
- Verify token hasn't expired
- Ensure `Authorization: Bearer {token}` header is sent

### Issue: "Admin access required" (403)
**Solution:** 
- Verify user has `role: 'admin'` in database
- Check token contains correct role
- Ensure using admin token, not customer token

---

## Security Notes

1. **Password Hashing**: All passwords are hashed using bcrypt (10 salt rounds)
2. **JWT Tokens**: Tokens expire after 7 days (configurable via `JWT_EXPIRES_IN`)
3. **Token Storage**: Frontend stores tokens in localStorage (consider httpOnly cookies for production)
4. **Role-Based Access**: Middleware checks user role before allowing access
5. **Input Validation**: All inputs validated on both client and server

---

## Next Steps (Future Enhancements)

1. **Refresh Tokens**: Implement refresh token flow for better security
2. **OTP Verification**: Add phone/email OTP verification
3. **Password Reset**: Implement forgot password flow
4. **2FA**: Add two-factor authentication for admin accounts
5. **Session Management**: Track active sessions and allow logout from all devices
6. **Rate Limiting**: Add rate limiting to auth endpoints
7. **httpOnly Cookies**: Move token storage to httpOnly cookies for better security

