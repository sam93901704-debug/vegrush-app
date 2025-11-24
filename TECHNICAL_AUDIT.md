# TECHNICAL AUDIT REPORT - VEGRUSH APP
**Date:** 2024-12-20  
**Status:** CRITICAL ISSUES IDENTIFIED

---

## 1. PROJECT OVERVIEW

### What exactly does this app do?
**VegRush** is a **vegetable delivery e-commerce platform** with three user roles:
- **Customer**: Browse products, place orders, track deliveries
- **Admin**: Manage products, orders, assign delivery boys
- **Delivery**: View assigned orders, update order status, track deliveries

### Main Features
✅ **Implemented:**
- Product catalog (browse, search, filter by category)
- Shopping cart (client-side only)
- Order creation and management
- Admin product CRUD (CREATE, READ, UPDATE, DELETE)
- Admin order management and delivery assignment
- Delivery order tracking and status updates
- Address management
- Push notifications (FCM) - partially implemented
- Offline queue for delivery app

❌ **Partially Implemented:**
- Authentication (DISABLED - dev mode only)
- Image uploads (requires Supabase - WILL FAIL if not configured)
- Google Maps integration (requires API key)

❌ **Not Implemented:**
- Payment processing (orders created but no payment gateway)
- Order cancellation by customer
- Product reviews/ratings
- User profile management UI
- Admin dashboard analytics

### Routes (Frontend + Backend)

#### **FRONTEND ROUTES** (Next.js App Router)
```
/onboarding              → Onboarding slides + login (auth disabled)
/customer                → Product catalog homepage
/customer/products/[id]  → Product detail page
/customer/checkout       → Order checkout
/customer/orders/[id]    → Order tracking
/customer/account        → User profile
/customer/account/address/edit → Address editor
/admin                   → Admin dashboard (redirects to /admin/orders)
/admin/products          → Product list
/admin/products/new      → Create product
/admin/products/[id]     → Edit product
/admin/orders            → Order list
/admin/orders/[id]       → Order detail + assignment
/delivery                → Delivery dashboard (redirects to /delivery/orders)
/delivery/orders         → Assigned orders list
/delivery/orders/[id]    → Order detail + status update
/delivery/summary        → Daily delivery summary
```

#### **BACKEND API ROUTES** (Express.js)

**Authentication:**
- `POST /api/auth/google` - Google login (REQUIRES GOOGLE_CLIENT_ID)
- `POST /api/auth/admin/google` - Admin Google login
- `POST /api/auth/delivery/login` - Delivery phone login
- `GET /api/auth/me` - Get current user (REQUIRES AUTH)

**Products:**
- `GET /api/products` - List products (PUBLIC)
- `GET /api/products/:id` - Get product (PUBLIC)
- `GET /api/admin/products` - List all products including inactive (AUTH DISABLED)
- `POST /api/admin/products` - Create product (AUTH DISABLED)
- `PUT /api/admin/products/:id` - Update product (AUTH DISABLED)
- `PATCH /api/admin/products/:id/stock` - Update stock (AUTH DISABLED)
- `DELETE /api/admin/products/:id` - Delete product (AUTH DISABLED)

**Orders:**
- `POST /api/orders` - Create order (REQUIRES USER AUTH)
- `GET /api/orders` - Get user orders (REQUIRES USER AUTH)
- `GET /api/orders/:id` - Get order (REQUIRES USER/ADMIN AUTH)
- `GET /api/admin/orders` - List all orders (REQUIRES ADMIN AUTH)
- `GET /api/admin/orders/:id` - Get order (REQUIRES ADMIN AUTH)
- `PATCH /api/admin/orders/:id/status` - Update order status (REQUIRES ADMIN AUTH)
- `POST /api/admin/orders/:id/assign` - Assign delivery boy (REQUIRES ADMIN AUTH)

**Delivery:**
- `GET /api/delivery/orders` - Get assigned orders (REQUIRES DELIVERY AUTH)
- `GET /api/delivery/orders/:id` - Get order detail (REQUIRES DELIVERY AUTH)
- `PATCH /api/delivery/orders/:id/status` - Update order status (REQUIRES DELIVERY AUTH)
- `GET /api/delivery/summary` - Get daily summary (REQUIRES DELIVERY AUTH)

**User:**
- `POST /api/user/phone` - Update phone (REQUIRES USER AUTH)
- `POST /api/user/location` - Update address (REQUIRES USER AUTH)
- `GET /api/user/address` - Get default address (REQUIRES USER AUTH)
- `POST /api/user/fcm-token` - Update FCM token (REQUIRES USER AUTH)

**Admin:**
- `GET /api/admin/delivery-boys` - List delivery boys (REQUIRES ADMIN AUTH)
- `POST /api/admin/uploads` - Generate upload URL (AUTH DISABLED - REQUIRES SUPABASE)
- `POST /api/admin/upload-product-image` - Upload image (AUTH DISABLED - REQUIRES SUPABASE)

### APIs: Implemented vs Placeholders

**✅ FULLY IMPLEMENTED:**
- Product CRUD operations
- Order creation and management
- Delivery assignment
- Address management
- User authentication (backend only - frontend disabled)

**⚠️ PARTIALLY IMPLEMENTED:**
- Image uploads (code exists but REQUIRES Supabase config)
- Push notifications (FCM service exists but REQUIRES Firebase config)
- Google Maps (code exists but REQUIRES API key)

**❌ NOT IMPLEMENTED:**
- Payment gateway integration
- Email notifications
- SMS notifications (code exists but REQUIRES MSG91 config)
- Webhooks (code exists but not configured)

---

## 2. DATABASE

### Database Used
✅ **PostgreSQL** via Prisma ORM

### Full Prisma Schema

```prisma
model User {
  id            String    @id @default(uuid())
  googleId      String    @unique
  name          String
  email         String    @unique
  phone         String?   @unique
  phoneVerified Boolean   @default(false)
  profilePic    String?
  fcmToken      String?
  addresses     Address[]
  orders        Order[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Address {
  id          String   @id @default(uuid())
  user        User     @relation(fields: [userId], references: [id])
  userId      String
  label       String?
  latitude    Decimal
  longitude   Decimal
  fullAddress String
  city        String?
  pincode     String?
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  orders      Order[]
}

model Product {
  id          String      @id @default(uuid())
  name        String
  description String?
  category    String
  price       Int         // paise
  unitType    String
  unitValue   Decimal
  stockQty    Decimal
  imageUrl    String?
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  orderItems  OrderItem[]
}

model Order {
  id                  String        @id @default(uuid())
  orderNumber         String        @unique
  user                User          @relation(fields: [userId], references: [id])
  userId              String
  address             Address       @relation(fields: [addressId], references: [id])
  addressId           String
  totalAmount         Int
  deliveryFee         Int
  paymentMethod       String
  status              String
  assignedDeliveryId  String?
  assignedDelivery    DeliveryBoy?  @relation(fields: [assignedDeliveryId], references: [id])
  pickedAt            DateTime?
  outForDeliveryAt    DateTime?
  deliveredAt         DateTime?
  items               OrderItem[]
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
}

model OrderItem {
  id        String   @id @default(uuid())
  order     Order    @relation(fields: [orderId], references: [id])
  orderId   String
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  qty       Decimal
  unitPrice Int
  subtotal  Int
}

model DeliveryBoy {
  id            String    @id @default(uuid())
  name          String
  phone         String    @unique
  vehicleNumber String?
  fcmToken      String?
  isActive      Boolean   @default(true)
  lastAssignedAt DateTime?
  orders        Order[]
  createdAt     DateTime  @default(now())
}

model AuditLog {
  id        String   @id @default(uuid())
  actorId   String?
  actorRole String?
  action    String
  meta      Json?
  createdAt DateTime @default(now())
  @@index([actorId])
  @@index([actorRole])
  @@index([action])
  @@index([createdAt])
}

model AdminUser {
  id        String   @id @default(uuid())
  email     String   @unique
  googleId  String   @unique
  role      String   @default("admin")
  createdAt DateTime @default(now())
}

model Setting {
  id           String  @id @default(uuid())
  deliveryFee  Int     @default(0)
  minOrderValue Int    @default(0)
  openFrom     String?
  openTo       String?
}
```

### Model Usage Analysis

**✅ ACTIVELY USED:**
- `User` - Used by auth, orders, addresses
- `Product` - Core model, used everywhere
- `Order` - Core model, used by all roles
- `OrderItem` - Used with orders
- `Address` - Used by orders and user profile
- `DeliveryBoy` - Used by delivery routes and admin assignment
- `AdminUser` - Used by admin auth

**⚠️ PARTIALLY USED:**
- `AuditLog` - Model exists, service exists (`auditService.ts`), but **NOT CALLED** in controllers
- `Setting` - Model exists, but **NO ROUTES** to read/update settings

**❌ UNUSED:**
- None (all models have relationships)

### API Routes → Model Mapping

| Route | Models Used |
|-------|------------|
| `/api/auth/*` | User, AdminUser |
| `/api/products` | Product |
| `/api/admin/products` | Product |
| `/api/orders` | Order, OrderItem, Product, User, Address |
| `/api/admin/orders` | Order, OrderItem, Product, User, Address, DeliveryBoy |
| `/api/delivery/orders` | Order, OrderItem, Product, User, Address, DeliveryBoy |
| `/api/user/*` | User, Address |
| `/api/admin/delivery-boys` | DeliveryBoy |

### Missing Migrations / Schema-Code Mismatches

**⚠️ CRITICAL:**
- `AuditLog` model exists but **NO CONTROLLER** uses it
- `Setting` model exists but **NO ROUTES** to manage settings
- Migration folder exists but **EMPTY** (using `prisma db push` instead)

**✅ NO MISMATCHES FOUND:**
- All models match their usage in controllers
- All relations are properly defined

---

## 3. AUTHENTICATION

### Current Auth System

**BACKEND:**
- ✅ JWT-based authentication (`jsonwebtoken`)
- ✅ Google OAuth token verification (`google-auth-library`)
- ✅ Role-based access control (user, admin, delivery)
- ✅ Middleware: `authenticateUser`, `requireRole`, `adminAuth`, `deliveryAuth`

**FRONTEND:**
- ❌ **AUTHENTICATION DISABLED** - All auth checks bypassed
- ❌ GoogleLoginButton replaced with dummy "Continue" button
- ❌ Token checks removed from onboarding
- ❌ Admin/delivery pages set fake tokens (`dev-admin`, `dev-delivery`)

### Google Login References

**BACKEND:**
- ✅ `backend/src/routes/authRoutes.ts` - `/api/auth/google` route exists
- ✅ `backend/src/services/googleService.ts` - Google token verification exists
- ✅ `backend/src/controllers/authController.ts` - Google login handler exists
- ✅ `backend/src/middleware/adminAuth.ts` - Checks AdminUser table

**FRONTEND:**
- ✅ `app/onboarding/components/GoogleLoginButton.tsx` - **BUT DISABLED** (just calls `onSuccess()`)
- ❌ No Google scripts loaded
- ❌ No `NEXT_PUBLIC_GOOGLE_CLIENT_ID` references in frontend code

**DEAD CODE:**
- `backend/src/routes/auth.ts` - **DUPLICATE** of `authRoutes.ts` (not mounted in server.ts)
- Frontend Google login code exists but **NEVER EXECUTED**

### Middlewares Expecting Logged-In User

**✅ STILL ACTIVE (but bypassed in frontend):**
- `authenticateUser` - Used by: orders, user routes, admin routes, delivery routes
- `requireRole(['user'])` - Used by: `/api/orders`
- `requireRole(['admin'])` - Used by: `/api/admin/orders`, `/api/admin/delivery-boys`
- `requireRole(['delivery'])` - Used by: `/api/delivery/*`
- `adminAuth` - Used by: productRoutes.ts (but commented out)

**❌ DISABLED:**
- Admin product routes (commented out)
- Admin upload routes (commented out)

### Dead Auth Files

**❌ UNUSED:**
- `backend/src/routes/auth.ts` - **DUPLICATE** - Not mounted in server.ts (only `authRoutes.ts` is used)

**✅ ACTIVE:**
- All other auth files are used

---

## 4. FILE STORAGE

### Where Product Images Are Uploaded

**Storage System:** Supabase Storage (bucket: `products`)

**Upload Flow:**
1. Frontend: `app/admin/products/new/page.tsx` → `POST /api/admin/upload-product-image`
2. Backend: `backend/src/routes/adminUploads.ts` → `multerUpload.single('image')`
3. Service: `backend/src/services/storageService.ts` → `uploadImage()`
4. Supabase: Uploads to bucket `products` with path `{timestamp}-{filename}`

### Exact Code Lines Using Supabase

**File: `backend/src/services/storageService.ts`**
- Line 8: `process.env.SUPABASE_URL` - **REQUIRED** (throws error if missing)
- Line 20: `process.env.SUPABASE_KEY` - **REQUIRED** (throws error if missing)
- Line 32-36: `getSupabaseClient()` - Creates Supabase client
- Line 74: `supabase.storage.from(PRODUCT_IMAGES_BUCKET)` - Upload URL generation
- Line 138: `supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl()` - Public URL
- Line 186: `supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload()` - File upload
- Line 243: `supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl()` - Get public URL

**File: `backend/src/routes/adminUploads.ts`**
- Line 96: Comment says "Upload to Supabase storage"
- Line 97: Calls `uploadImage()` from storageService

**File: `app/admin/products/new/page.tsx`**
- Line 107: `fetch(`${API_URL}/api/admin/upload-product-image`)` - Calls upload endpoint

### Is Supabase Required?

**❌ YES - REQUIRED** for image uploads. If not configured:
- `generatePresignedUpload()` will throw: `"SUPABASE_URL environment variable is not configured"`
- `uploadImage()` will throw: `"SUPABASE_KEY environment variable is not configured"`
- Product creation with images **WILL FAIL**

**✅ CAN BE REPLACED** with:
- AWS S3
- Cloudinary
- Local file storage (for dev)
- Any storage service with similar API

### Environment Variables for Upload System

**REQUIRED:**
- `SUPABASE_URL` - Supabase project URL (e.g., `https://xxx.supabase.co`)
- `SUPABASE_KEY` - Supabase anonymous/service key

**USED IN:**
- `backend/src/services/storageService.ts` (lines 8, 20)

---

## 5. BACKEND STRUCTURE

### All Backend Routes

| File | Route | Method | Auth | Payload | Validations |
|------|-------|--------|------|---------|-------------|
| `authRoutes.ts` | `/api/auth/google` | POST | None | `{idToken: string}` | idToken required, string |
| `authRoutes.ts` | `/api/auth/me` | GET | User | None | None |
| `authRoutes.ts` | `/api/auth/admin/google` | POST | None | `{idToken: string}` | idToken required, string |
| `authRoutes.ts` | `/api/auth/delivery/login` | POST | None | `{phone: string, fcmToken?: string}` | phone required, string |
| `products.ts` | `/api/products` | GET | None | Query: `page?, limit?, category?, in_stock?` | page int, limit 1-100 |
| `products.ts` | `/api/products/:id` | GET | None | None | id required |
| `products.ts` | `/api/admin/products` | POST | **DISABLED** | `{name, category, price, unitType, unitValue, stockQty, imageUrl?, isActive?}` | Full validation |
| `products.ts` | `/api/admin/products/:id/stock` | PATCH | **DISABLED** | `{stockQty: number}` | stockQty float >= 0 |
| `products.ts` | `/api/admin/products/:id` | PUT | **DISABLED** | Partial product fields | Optional validations |
| `productRoutes.ts` | `/api/admin/products` | GET | **DISABLED** | Query: `page?, limit?, category?, search?, inStockOnly?` | Full validation |
| `productRoutes.ts` | `/api/admin/products` | POST | **DISABLED** | Same as products.ts | Same |
| `productRoutes.ts` | `/api/admin/products/:id/stock` | PATCH | **DISABLED** | Same as products.ts | Same |
| `productRoutes.ts` | `/api/admin/products/:id` | PUT | **DISABLED** | Same as products.ts | Same |
| `productRoutes.ts` | `/api/admin/products/:id` | DELETE | **DISABLED** | Query: `hardDelete?` | id UUID |
| `orders.ts` | `/api/orders` | POST | User | `{items: [{productId, qty}], addressId?}` | items array, productId UUID, qty > 0 |
| `orders.ts` | `/api/orders` | GET | User | Query: `page?, limit?` | page int, limit 1-100 |
| `orders.ts` | `/api/orders/:id` | GET | User/Admin | None | id UUID |
| `adminOrders.ts` | `/api/admin/orders` | GET | Admin | Query: `page?, limit?, status?, search?` | Full validation |
| `adminOrders.ts` | `/api/admin/orders/:id` | GET | Admin | None | id UUID |
| `adminOrders.ts` | `/api/admin/orders/:id/status` | PATCH | Admin | `{status, assignedDeliveryId?}` | status enum, deliveryId UUID |
| `adminOrders.ts` | `/api/admin/orders/:id/assign` | POST | Admin | `{deliveryBoyId: string}` | deliveryBoyId UUID |
| `deliveryOrders.ts` | `/api/delivery/orders` | GET | Delivery | None | None |
| `deliveryOrders.ts` | `/api/delivery/orders/:id` | GET | Delivery | None | id UUID |
| `deliveryOrders.ts` | `/api/delivery/orders/:id/status` | PATCH | Delivery | `{status, paymentType?}` | status enum, paymentType enum |
| `delivery.ts` | `/api/delivery/login` | POST | None | `{phone: string, fcmToken?}` | phone string |
| `delivery.ts` | `/api/delivery/orders` | GET | Delivery | None | None |
| `delivery.ts` | `/api/delivery/orders/:id/status` | PATCH | Delivery | `{status}` | status enum |
| `deliverySummary.ts` | `/api/delivery/summary` | GET | Delivery | None | None |
| `adminDelivery.ts` | `/api/admin/delivery-boys` | GET | Admin | None | None |
| `userRoutes.ts` | `/api/user/phone` | POST | User | `{phone: string}` | phone exactly 10 digits |
| `userRoutes.ts` | `/api/user/location` | POST | User | `{latitude, longitude, fullAddress, city, pincode}` | Full validation |
| `userRoutes.ts` | `/api/user/address` | GET | User | None | None |
| `userRoutes.ts` | `/api/user/fcm-token` | POST | User | `{token: string}` | token string, min length 1 |
| `adminUploads.ts` | `/api/admin/uploads` | POST | **DISABLED** | `{fileName, contentType}` | fileName 1-255 chars, contentType image/* |
| `adminUploads.ts` | `/api/admin/upload-product-image` | POST | **DISABLED** | FormData: `image` file | File validation |

### Dependencies Per Route

**Supabase:**
- `/api/admin/uploads` - `generatePresignedUpload()`
- `/api/admin/upload-product-image` - `uploadImage()`

**Prisma:**
- All routes use Prisma via `db` import

**Google Auth:**
- `/api/auth/google` - `verifyGoogleIdToken()`
- `/api/auth/admin/google` - `verifyGoogleIdToken()`

**JWT:**
- All authenticated routes use JWT via `authenticateUser` middleware

**FCM:**
- `/api/user/fcm-token` - Updates FCM token
- Notification service uses FCM (optional)

**SMS:**
- Notification service uses MSG91 (optional)

### Broken/Unreachable Routes

**❌ DUPLICATE ROUTES:**
- `products.ts` and `productRoutes.ts` both define `/api/admin/products` POST/PUT/PATCH
- **ISSUE:** Both mounted at `/api/admin/products` in server.ts (line 120)
- **RESULT:** `productRoutes.ts` routes take precedence (mounted second)

**❌ UNUSED ROUTE FILE:**
- `backend/src/routes/auth.ts` - **NOT MOUNTED** in server.ts
- `backend/src/routes/authRoutes.ts` is used instead

**❌ CONFLICTING ROUTES:**
- `/api/delivery/orders` defined in both `delivery.ts` (line 40) and `deliveryOrders.ts` (line 19)
- **RESULT:** `deliveryOrders.ts` takes precedence (mounted after `delivery.ts`)

### Hidden Errors / Unhandled Exceptions

**⚠️ CRITICAL:**

1. **Supabase Storage Errors:**
   - `storageService.ts` throws errors if `SUPABASE_URL` or `SUPABASE_KEY` missing
   - **NO GRACEFUL FALLBACK** - Product image uploads will crash

2. **Google Auth Errors:**
   - `googleService.ts` throws if `GOOGLE_CLIENT_ID` missing
   - Auth routes will return 500 errors (not caught properly)

3. **Database Connection:**
   - No connection retry logic
   - If DB is down, all routes fail immediately

4. **Missing Error Handling:**
   - `AuditLog` service exists but **NEVER CALLED** - silent failure
   - `Setting` model exists but **NO ROUTES** - settings can't be managed

5. **Frontend Auth Bypass:**
   - Frontend sends fake tokens (`dev-admin`, `dev-delivery`)
   - Backend will reject these tokens (JWT verification fails)
   - **RESULT:** Admin/delivery routes will return 401 errors

---

## 6. FRONTEND STRUCTURE

### All Frontend Pages

| Page | Purpose | Auth Status | API Calls |
|------|---------|-------------|-----------|
| `/onboarding` | Onboarding slides + login | **DISABLED** | None |
| `/customer` | Product catalog | **DISABLED** | `GET /api/products` |
| `/customer/products/[id]` | Product detail | **DISABLED** | `GET /api/products/:id` |
| `/customer/checkout` | Order checkout | **DISABLED** | `POST /api/orders`, `GET /api/user/address` |
| `/customer/orders/[id]` | Order tracking | **DISABLED** | `GET /api/orders/:id` |
| `/customer/account` | User profile | **DISABLED** | `GET /api/auth/me`, `GET /api/user/address`, `GET /api/orders` |
| `/customer/account/address/edit` | Address editor | **DISABLED** | `GET /api/user/address`, `POST /api/user/location` |
| `/admin` | Admin redirect | **DISABLED** | None (redirects) |
| `/admin/products` | Product list | **DISABLED** | `GET /api/admin/products` |
| `/admin/products/new` | Create product | **DISABLED** | `POST /api/admin/upload-product-image`, `POST /api/admin/products` |
| `/admin/products/[id]` | Edit product | **DISABLED** | `GET /api/admin/products/:id`, `PUT /api/admin/products/:id`, `POST /api/admin/upload-product-image` |
| `/admin/orders` | Order list | **DISABLED** | `GET /api/admin/orders`, `GET /api/admin/delivery-boys` |
| `/admin/orders/[id]` | Order detail | **DISABLED** | `GET /api/admin/orders/:id`, `POST /api/admin/orders/:id/assign` |
| `/delivery` | Delivery redirect | **DISABLED** | None (redirects) |
| `/delivery/orders` | Assigned orders | **DISABLED** | `GET /api/delivery/orders` |
| `/delivery/orders/[id]` | Order detail | **DISABLED** | `GET /api/delivery/orders/:id`, `PATCH /api/delivery/orders/:id/status` |
| `/delivery/summary` | Daily summary | **DISABLED** | `GET /api/delivery/summary` |

### Product Creation Flow (Frontend)

**File:** `app/admin/products/new/page.tsx`

1. **User fills form** (name, category, price, unitType, unitValue, stockQty, image)
2. **Image upload** (if selected):
   - Line 92-127: `uploadImage()` function
   - Line 107: `POST /api/admin/upload-product-image` with FormData
   - **REQUIRES:** `Authorization: Bearer {token}` header (but auth disabled)
   - **REQUIRES:** Supabase configured (will fail if not)
3. **Product creation**:
   - Line 203: `POST /api/admin/products` with JSON body
   - Converts price from rupees to paise (line 200)
   - **REQUIRES:** `Authorization: Bearer {token}` header (but auth disabled)

**ISSUES:**
- Frontend still sends `Authorization` header (line 110, 206) even though auth is disabled
- Image upload will fail if Supabase not configured
- No error handling for Supabase failures

### References to Auth, Supabase, Backend URLs

**Auth References:**
- `app/onboarding/components/GoogleLoginButton.tsx` - **DISABLED** (dummy button)
- `app/admin/products/new/page.tsx` - Still sends auth headers (lines 110, 206)
- `app/admin/products/[id]/page.tsx` - Still sends auth headers
- `app/customer/account/page.tsx` - Wrapped in try-catch (graceful failure)

**Supabase References:**
- **NONE** in frontend (only backend uses Supabase)

**Backend URL References:**
- `app/config/api.ts` - `API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vegrush-backend.onrender.com'`
- All API calls use `${API_URL}/api/...`

### Missing .env Variables / Incorrect Names

**FRONTEND (.env.local or Vercel):**
- `NEXT_PUBLIC_API_URL` - **OPTIONAL** (has fallback to Render URL)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - **NOT USED** (auth disabled)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - **REQUIRED** for address editor (line 105 of `app/customer/account/address/edit/page.tsx`)
- `NEXT_PUBLIC_FIREBASE_*` - **OPTIONAL** (FCM silently fails if missing)

**BACKEND (.env):**
- `DATABASE_URL` - **REQUIRED**
- `JWT_SECRET` - **REQUIRED**
- `GOOGLE_CLIENT_ID` - **REQUIRED** for Google auth (but auth disabled in frontend)
- `SUPABASE_URL` - **REQUIRED** for image uploads
- `SUPABASE_KEY` - **REQUIRED** for image uploads
- `PORT` - Optional (defaults to 4000)
- `NODE_ENV` - Optional
- `FCM_SERVER_KEY` - Optional (for push notifications)
- `MSG91_AUTH_KEY` - Optional (for SMS)
- `FRONTEND_URL` - Optional (for notification links)
- `WEBHOOK_URL`, `WEBHOOK_SECRET` - Optional

**INCORRECT NAMES:**
- None found (all variables match their usage)

---

## 7. ENVIRONMENT VARIABLES

### Complete List

#### **FRONTEND** (Vercel / .env.local)

| Variable | Required | Used In | Status |
|----------|----------|---------|--------|
| `NEXT_PUBLIC_API_URL` | No | `app/config/api.ts` | ✅ Has fallback |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | None (auth disabled) | ❌ Not used |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Yes | `app/customer/account/address/edit/page.tsx` | ⚠️ Missing = Maps broken |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | No | `app/services/fcmService.ts` | ⚠️ Optional (silent fail) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | No | `app/services/fcmService.ts` | ⚠️ Optional |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | No | `app/services/fcmService.ts` | ⚠️ Optional |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | No | `app/services/fcmService.ts` | ⚠️ Optional |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | No | `app/services/fcmService.ts` | ⚠️ Optional |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | No | `app/services/fcmService.ts` | ⚠️ Optional |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | No | `app/services/fcmService.ts` | ⚠️ Optional |

#### **BACKEND** (.env)

| Variable | Required | Used In | Status |
|----------|----------|---------|--------|
| `DATABASE_URL` | **YES** | Prisma, all routes | ✅ Required |
| `JWT_SECRET` | **YES** | `backend/src/utils/jwt.ts` | ✅ Required |
| `GOOGLE_CLIENT_ID` | **YES** | `backend/src/services/googleService.ts` | ⚠️ Required but auth disabled |
| `SUPABASE_URL` | **YES** | `backend/src/services/storageService.ts` | ❌ **MISSING = IMAGE UPLOADS FAIL** |
| `SUPABASE_KEY` | **YES** | `backend/src/services/storageService.ts` | ❌ **MISSING = IMAGE UPLOADS FAIL** |
| `PORT` | No | `backend/src/server.ts` | ✅ Defaults to 4000 |
| `NODE_ENV` | No | Multiple files | ✅ Defaults to development |
| `LOG_LEVEL` | No | `backend/src/server.ts` | ✅ Optional |
| `FCM_SERVER_KEY` | No | `backend/src/services/notificationService.ts` | ⚠️ Optional (notifications fail) |
| `MSG91_AUTH_KEY` | No | `backend/src/services/smsService.ts` | ⚠️ Optional (SMS disabled) |
| `MSG91_SENDER_ID` | No | `backend/src/services/smsService.ts` | ✅ Defaults to "ORDERS" |
| `SMS_ENABLED` | No | `backend/src/services/smsService.ts` | ✅ Defaults to false |
| `FRONTEND_URL` | No | `backend/src/services/notificationService.ts` | ✅ Defaults to localhost:3000 |
| `WEBHOOK_URL` | No | `backend/src/services/webhookService.ts` | ⚠️ Optional |
| `WEBHOOK_SECRET` | No | `backend/src/services/webhookService.ts` | ⚠️ Optional |
| `WEBHOOK_ENABLED` | No | `backend/src/services/webhookService.ts` | ✅ Defaults to false |
| `WEBHOOK_TIMEOUT_MS` | No | `backend/src/services/webhookService.ts` | ✅ Defaults to 5000 |

### Required but Missing

**CRITICAL:**
- `SUPABASE_URL` - **IMAGE UPLOADS WILL FAIL**
- `SUPABASE_KEY` - **IMAGE UPLOADS WILL FAIL**

**IMPORTANT:**
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Address editor maps won't work

**OPTIONAL (but recommended):**
- `FCM_SERVER_KEY` - Push notifications won't work
- `GOOGLE_CLIENT_ID` - Google auth won't work (but auth disabled anyway)

### Incorrectly Named

**✅ NONE** - All variable names match their usage

### Unused

**FRONTEND:**
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Not used (auth disabled)

**BACKEND:**
- None (all variables are used if configured)

---

## 8. ERRORS & ROOT CAUSES

### "Invalid supabaseUrl" Error

**ROOT CAUSE:**
- `SUPABASE_URL` environment variable is **MISSING** or **EMPTY**
- `backend/src/services/storageService.ts` line 8-12 throws error if not set

**WHERE IT FAILS:**
- `POST /api/admin/upload-product-image` - Image upload endpoint
- `POST /api/admin/uploads` - Presigned URL generation
- Any product creation/update with image upload

**FIX:**
- Set `SUPABASE_URL` in backend `.env` file
- Or replace Supabase with alternative storage

### Image Upload 500 Errors

**ROOT CAUSES:**

1. **Missing Supabase Config:**
   - `SUPABASE_URL` or `SUPABASE_KEY` not set
   - Error: `"SUPABASE_URL environment variable is not configured"`

2. **Supabase Bucket Not Created:**
   - Bucket `products` doesn't exist in Supabase
   - Error: `"Image upload failed: {error message}"`

3. **Supabase Permissions:**
   - Anonymous key doesn't have upload permissions
   - Error: `"Image upload failed: new row violates row-level security policy"`

4. **File Size/Type Validation:**
   - Frontend validates (5MB max, image types only)
   - Backend validates via multer middleware

**FIX:**
- Configure Supabase: Create bucket `products`, set RLS policies, add env vars
- Or replace with alternative storage (S3, Cloudinary, local files)

### Authentication-Related Errors

**CURRENT STATE:**
- Frontend auth **DISABLED** - sends fake tokens
- Backend auth **ENABLED** - expects real JWT tokens

**ERRORS YOU'LL SEE:**

1. **401 Unauthorized:**
   - Frontend sends `Authorization: Bearer dev-admin`
   - Backend JWT verification fails
   - **RESULT:** Admin routes return 401

2. **Token Verification Failed:**
   - `authenticateUser` middleware tries to verify fake token
   - JWT library rejects it
   - **RESULT:** All protected routes return 401

3. **Admin Access Required:**
   - Even if token verified, `adminAuth` checks AdminUser table
   - Fake tokens don't have valid user IDs
   - **RESULT:** Admin routes return 403

**ROOT CAUSE:**
- **MISMATCH:** Frontend bypasses auth, backend enforces it
- **SOLUTION:** Either disable backend auth OR enable frontend auth

---

## 9. FIX PLAN

### Simplest Working Architecture

**RECOMMENDED:**
1. **Remove Supabase dependency** - Use local file storage or Cloudinary
2. **Keep auth disabled** - For dev/testing only
3. **Simplify storage** - Use public URLs or base64 images
4. **Remove unused code** - Delete duplicate routes, unused services

### Services to Remove

**❌ REMOVE:**
- Supabase Storage (replace with simpler solution)
- `backend/src/routes/auth.ts` (duplicate, unused)
- AuditLog service (not called anywhere)
- Webhook service (not configured)

**✅ KEEP:**
- Prisma/PostgreSQL (core database)
- JWT auth (backend structure)
- FCM (optional, can be disabled)
- SMS service (optional, can be disabled)

### What Needs Rewriting

**CRITICAL:**

1. **Storage Service** (`backend/src/services/storageService.ts`):
   - Replace Supabase with:
     - **Option A:** Local file storage (save to `public/uploads/`)
     - **Option B:** Cloudinary (simpler API)
     - **Option C:** AWS S3 (if already using AWS)

2. **Admin Upload Routes** (`backend/src/routes/adminUploads.ts`):
   - Update to use new storage service
   - Remove Supabase client initialization

3. **Frontend Product Creation** (`app/admin/products/new/page.tsx`):
   - Update to handle new storage response format
   - Add error handling for storage failures

**OPTIONAL:**

4. **Remove Duplicate Routes:**
   - Delete `backend/src/routes/auth.ts`
   - Consolidate `products.ts` and `productRoutes.ts` (keep one)

5. **Fix Auth Mismatch:**
   - Either enable frontend auth OR disable backend auth completely

### Required Environment Variables

**MINIMUM (to get app running):**
```env
# Backend
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
PORT=4000

# Frontend
NEXT_PUBLIC_API_URL="http://localhost:4000"  # or your backend URL
```

**FOR IMAGE UPLOADS (choose one):**
```env
# Option 1: Local storage (no extra service)
UPLOAD_DIR="./public/uploads"  # Add this

# Option 2: Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Option 3: Keep Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_KEY="xxx"
```

**OPTIONAL:**
```env
GOOGLE_CLIENT_ID="..."  # Only if enabling auth
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="..."  # Only if using address editor
FCM_SERVER_KEY="..."  # Only if using push notifications
```

### Backend Changes Required

1. **Replace Storage Service:**
   ```typescript
   // backend/src/services/storageService.ts
   // Replace Supabase calls with:
   // - Local file system (fs.writeFile)
   // - Cloudinary SDK
   // - AWS S3 SDK
   ```

2. **Remove Supabase Dependency:**
   ```bash
   npm uninstall @supabase/supabase-js
   ```

3. **Delete Unused Files:**
   - `backend/src/routes/auth.ts` (duplicate)

4. **Fix Route Conflicts:**
   - Choose one: `products.ts` OR `productRoutes.ts`
   - Remove duplicate route definitions

5. **Add Error Handling:**
   - Wrap storage calls in try-catch
   - Return meaningful error messages

### Frontend Changes Required

1. **Update Image Upload:**
   - Handle new storage response format
   - Add error messages for upload failures

2. **Fix Auth Headers:**
   - Remove `Authorization` headers if auth disabled
   - OR enable proper auth flow

3. **Add Missing Env Var:**
   - Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` if using address editor

### Step-by-Step Repair Plan

#### **PHASE 1: Fix Storage (CRITICAL)**

1. **Choose storage solution:**
   - **Local:** Save to `public/uploads/` (simplest)
   - **Cloudinary:** Free tier available
   - **S3:** If already using AWS

2. **Update `backend/src/services/storageService.ts`:**
   - Remove Supabase imports
   - Implement new storage method
   - Update `uploadImage()` function
   - Update `getPublicUrl()` function

3. **Test image upload:**
   - Create product with image
   - Verify image accessible via URL

#### **PHASE 2: Clean Up Code**

4. **Remove duplicate routes:**
   - Delete `backend/src/routes/auth.ts`
   - Consolidate product routes (keep `productRoutes.ts`)

5. **Remove unused dependencies:**
   - `npm uninstall @supabase/supabase-js`

6. **Update environment variables:**
   - Remove `SUPABASE_URL`, `SUPABASE_KEY`
   - Add new storage env vars

#### **PHASE 3: Fix Auth (Optional)**

7. **Decide on auth strategy:**
   - **Option A:** Keep auth disabled (dev mode)
   - **Option B:** Enable proper auth (restore Google login)

8. **If keeping disabled:**
   - Remove `Authorization` headers from frontend
   - Keep backend auth commented out

9. **If enabling auth:**
   - Restore `GoogleLoginButton.tsx`
   - Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - Set `GOOGLE_CLIENT_ID` in backend
   - Uncomment auth middleware

#### **PHASE 4: Testing**

10. **Test all flows:**
    - Product creation with image
    - Product update
    - Order creation
    - Admin order assignment
    - Delivery status updates

11. **Fix any remaining errors:**
    - Check console for missing env vars
    - Verify all API calls work
    - Test image uploads/downloads

---

## SUMMARY

### Critical Issues

1. ❌ **Supabase Storage Missing** - Image uploads will fail
2. ❌ **Auth Mismatch** - Frontend disabled, backend enabled
3. ❌ **Duplicate Routes** - `auth.ts` unused, `products.ts` vs `productRoutes.ts` conflict
4. ⚠️ **Missing Env Vars** - `SUPABASE_URL`, `SUPABASE_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### What Works

✅ Product CRUD (without images)  
✅ Order management  
✅ Delivery assignment  
✅ Database schema  
✅ Basic frontend pages  

### What's Broken

❌ Image uploads (Supabase not configured)  
❌ Admin/delivery auth (frontend sends fake tokens)  
❌ Google Maps (missing API key)  
❌ Push notifications (optional, but not configured)  

### Quick Wins

1. Replace Supabase with local file storage (30 min)
2. Remove duplicate route files (5 min)
3. Fix auth headers in frontend (10 min)
4. Add missing env vars (5 min)

**Total time to fix critical issues: ~1 hour**

---

**END OF AUDIT**

