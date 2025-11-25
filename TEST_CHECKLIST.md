# VEG RUSH - Complete Test Checklist

## Pre-Deployment Checklist

### 1. Environment Variables

#### Backend (Render)
- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Secret key for JWT tokens
- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `SUPABASE_BUCKET` - Storage bucket name (default: `product-images`)
- [ ] `FRONTEND_URL` - Your Vercel frontend URL (optional, for CORS)

#### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `https://vegrush-backend.onrender.com`)

---

## Authentication Tests

### Customer Signup
1. [ ] Navigate to `/auth/signup`
2. [ ] Fill form with:
   - Name: "Test User"
   - Email: "test@example.com" OR Phone: "+1234567890"
   - Password: "Test123"
   - Confirm Password: "Test123"
3. [ ] Submit form
4. [ ] Verify: Redirects to customer homepage
5. [ ] Verify: Token stored in localStorage (`vegrush_token`)
6. [ ] Verify: User data available in auth context

### Customer Login
1. [ ] Navigate to `/auth/login`
2. [ ] Enter email/phone and password
3. [ ] Submit form
4. [ ] Verify: Redirects to customer homepage
5. [ ] Verify: Token stored in localStorage
6. [ ] Verify: User data loaded

### Admin Login
1. [ ] Navigate to `/admin/login`
2. [ ] Enter:
   - Email: `sam93901704@gmail.com`
   - Password: `Sameer@123`
3. [ ] Submit form
4. [ ] Verify: Redirects to `/admin` dashboard
5. [ ] Verify: Admin token stored
6. [ ] Verify: Can access admin routes

### Auto-Login (Token Persistence)
1. [ ] Login as customer or admin
2. [ ] Refresh the page
3. [ ] Verify: User remains logged in
4. [ ] Verify: No redirect to login page

### Logout
1. [ ] Click logout button (if available)
2. [ ] Verify: Token removed from localStorage
3. [ ] Verify: Redirected to login/homepage
4. [ ] Verify: Cannot access protected routes

---

## Customer Flow Tests

### Product Browsing
1. [ ] Navigate to `/customer` or `/`
2. [ ] Verify: Products list loads
3. [ ] Verify: Product cards display correctly
4. [ ] Verify: Images load (if available)
5. [ ] Verify: Prices display correctly (₹ format)

### Product Search
1. [ ] Type in search bar
2. [ ] Verify: Results update after 300ms debounce
3. [ ] Verify: Empty search shows all products
4. [ ] Verify: Search works across name, description, category

### Product Detail Page
1. [ ] Click on any product card
2. [ ] Verify: Navigates to `/customer/products/[id]`
3. [ ] Verify: Product details display correctly
4. [ ] Verify: Quantity selector works
5. [ ] Verify: "Add to Cart" button works

### Cart Functionality
1. [ ] Add product to cart (without login)
2. [ ] Verify: Cart count updates in header
3. [ ] Verify: Cart persists after page refresh
4. [ ] Verify: Open cart sidebar shows items
5. [ ] Verify: Update quantity in cart
6. [ ] Verify: Remove item from cart
7. [ ] Verify: Total price calculates correctly

### Category Filtering
1. [ ] Click on category chip
2. [ ] Verify: Products filter by category
3. [ ] Verify: "All" category shows all products

---

## Admin Panel Tests

### Admin Dashboard
1. [ ] Login as admin
2. [ ] Navigate to `/admin`
3. [ ] Verify: Dashboard tab shows stats
4. [ ] Verify: Total products count displays
5. [ ] Verify: Orders today count displays

### View Products
1. [ ] Click "Products" tab
2. [ ] Verify: Product list loads
3. [ ] Verify: Products display in table (desktop) or cards (mobile)
4. [ ] Verify: Search works in product list
5. [ ] Verify: Stock can be updated inline
6. [ ] Verify: "Edit" button exists for each product
7. [ ] Verify: "Delete" button works with confirmation

### Add Product
1. [ ] Click "Add Product" tab
2. [ ] Fill form:
   - Name: "Test Product"
   - Description: "Test description"
   - Category: Select from dropdown
   - Price: 100.00
   - Unit Type: kg
   - Unit Value: 1
   - Stock: 10
   - Image: Upload test image
3. [ ] Submit form
4. [ ] Verify: Product created successfully
5. [ ] Verify: Redirects to Products tab
6. [ ] Verify: New product appears in list
7. [ ] Verify: Image uploaded to Supabase

### Edit Product
1. [ ] Click "Edit" button on any product
2. [ ] Verify: Navigates to `/admin/products/[id]/edit`
3. [ ] Verify: Form pre-filled with product data
4. [ ] Modify fields (name, price, stock, etc.)
5. [ ] Upload new image (optional)
6. [ ] Submit form
7. [ ] Verify: Product updated successfully
8. [ ] Verify: Redirects back to admin dashboard
9. [ ] Verify: Changes reflected in product list

### Orders Management
1. [ ] Click "Orders" tab
2. [ ] Verify: Orders list loads
3. [ ] Verify: Order details display correctly
4. [ ] Verify: Order status visible
5. [ ] Verify: Customer name visible

### Image Uploads
1. [ ] Click "Uploads" tab
2. [ ] Upload an image
3. [ ] Verify: Image uploads successfully
4. [ ] Verify: Public URL returned
5. [ ] Verify: URL can be used in product form

---

## API Endpoint Tests

### Customer Endpoints
- [ ] `POST /api/auth/signup` - Returns token + user
- [ ] `POST /api/auth/login` - Returns token + user
- [ ] `GET /api/auth/me` - Returns current user (with auth header)
- [ ] `GET /api/products` - Returns product list
- [ ] `GET /api/products?q=search` - Returns filtered products
- [ ] `GET /api/products/[id]` - Returns single product

### Admin Endpoints
- [ ] `POST /api/auth/admin/login` - Returns admin token
- [ ] `GET /api/admin/products` - Returns admin product list (requires auth)
- [ ] `POST /api/admin/products` - Creates product (requires auth)
- [ ] `PUT /api/admin/products/[id]` - Updates product (requires auth)
- [ ] `DELETE /api/admin/products/[id]` - Deletes product (requires auth)
- [ ] `POST /api/admin/upload-product-image` - Uploads image (requires auth)
- [ ] `GET /api/admin/orders` - Returns orders list (requires auth)

---

## Mobile Responsiveness Tests

### Customer Side
- [ ] Product grid: 1 column on mobile, 2 on tablet, 3+ on desktop
- [ ] Cart button visible and accessible
- [ ] Product cards readable on small screens
- [ ] Search bar works on mobile
- [ ] Navigation doesn't break layout

### Admin Side
- [ ] Admin tabs scrollable on mobile
- [ ] Product table converts to cards on mobile
- [ ] Forms usable on mobile
- [ ] Edit/Delete buttons accessible

---

## Error Handling Tests

### Authentication Errors
- [ ] Invalid credentials show error message
- [ ] Expired token redirects to login
- [ ] Unauthorized access shows 403 error

### API Errors
- [ ] Network errors show user-friendly message
- [ ] 500 errors handled gracefully
- [ ] Validation errors display correctly

### Form Validation
- [ ] Required fields show errors
- [ ] Email format validated
- [ ] Password length validated (min 6 chars)
- [ ] Price/stock must be numbers

---

## Performance Tests

- [ ] Page load time < 3 seconds
- [ ] Product list loads without lag
- [ ] Search debounce works (no excessive API calls)
- [ ] Images lazy load
- [ ] Cart operations instant

---

## Security Tests

- [ ] JWT tokens not exposed in console/logs
- [ ] Admin routes protected (redirect if not admin)
- [ ] Customer routes accessible without login
- [ ] CORS configured correctly
- [ ] Passwords hashed (not plain text)

---

## Default Admin User

### Verify Admin Seeder
1. [ ] Backend starts successfully
2. [ ] Check logs for: "✅ Default admin user created/updated successfully"
3. [ ] Login with:
   - Email: `sam93901704@gmail.com`
   - Password: `Sameer@123`
4. [ ] Verify: Login successful

---

## Deployment Verification

### Backend (Render)
- [ ] Build completes successfully
- [ ] Server starts on port (from PORT env var)
- [ ] Health check `/health` returns 200
- [ ] Database migrations applied
- [ ] Admin user seeded

### Frontend (Vercel)
- [ ] Build completes successfully
- [ ] All pages accessible
- [ ] API calls go to correct backend URL
- [ ] Environment variables injected
- [ ] No console errors

---

## Critical Path Tests (Must Pass)

1. ✅ Admin can login
2. ✅ Admin can create product
3. ✅ Admin can edit product
4. ✅ Admin can delete product
5. ✅ Customer can browse products
6. ✅ Customer can view product details
7. ✅ Customer can add to cart (without login)
8. ✅ Cart persists across page refreshes
9. ✅ Customer can signup/login
10. ✅ Product images upload and display

---

## Notes

- All tests should be performed in both development and production environments
- Test with different browsers (Chrome, Firefox, Safari)
- Test on different devices (desktop, tablet, mobile)
- Clear localStorage/cookies between test sessions
- Use different test accounts for customer/admin tests

---

## Quick Smoke Test (5 minutes)

1. Admin login → Create product → Edit product → Delete product
2. Customer browse → View product → Add to cart → Checkout flow
3. Search products → Filter by category
4. Verify cart persists after refresh

If all smoke tests pass, the application is ready for deployment! 🚀

