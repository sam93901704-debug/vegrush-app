# QA Test Checklist

This document provides a comprehensive testing checklist for all features of the Fresh Veggies app.

## Table of Contents

1. [Customer App](#customer-app)
2. [Admin App](#admin-app)
3. [Delivery App](#delivery-app)
4. [Performance Tests](#performance-tests)
5. [Crash Tests](#crash-tests)
6. [Offline Behavior](#offline-behavior)
7. [Cross-Platform Testing](#cross-platform-testing)

---

## Customer App

### Login

#### Google Login
- [ ] Onboarding screens display correctly (3 slides)
- [ ] Swipe gestures work between onboarding slides
- [ ] Skip button works on onboarding
- [ ] "Continue with Google" button is visible after onboarding
- [ ] Google Sign-In popup appears when button is clicked
- [ ] User can successfully authenticate with Google
- [ ] User is redirected to home page after successful login
- [ ] Token is stored in localStorage after login
- [ ] User session persists on app restart (auto-login with stored token)
- [ ] Logout functionality works correctly
- [ ] Error messages display correctly for failed authentication
- [ ] Loading states show during authentication
- [ ] One Tap prompt appears (if enabled)
- [ ] Multiple Google accounts can be used
- [ ] User can switch accounts

#### Session Management
- [ ] Token refresh works correctly
- [ ] Session expires after token expiry
- [ ] User is redirected to login on token expiry
- [ ] Concurrent login from multiple devices works
- [ ] Logout clears all user data

### Phone Update

#### Phone Number Update
- [ ] Phone update screen is accessible from account settings
- [ ] Phone input field accepts 10 digits only
- [ ] Phone validation shows error for invalid formats
- [ ] Phone validation shows error for less than 10 digits
- [ ] Phone validation shows error for more than 10 digits
- [ ] Phone validation shows error for non-numeric characters
- [ ] Submit button is disabled when phone is invalid
- [ ] Phone update API call works correctly
- [ ] Success message displays after phone update
- [ ] Phone field shows updated phone number
- [ ] PhoneVerified status resets to false after phone update
- [ ] Error message displays if phone is already registered
- [ ] Error message displays if phone belongs to another user (409 Conflict)
- [ ] Loading state shows during phone update
- [ ] Form validation prevents empty submissions

#### Phone Verification (if implemented)
- [ ] OTP is sent after phone update
- [ ] OTP input field is visible
- [ ] OTP validation works correctly
- [ ] Resend OTP functionality works
- [ ] PhoneVerified updates to true after verification

### Location Update

#### Address Update
- [ ] Location update screen is accessible
- [ ] Map displays correctly
- [ ] User can drag pin to select location
- [ ] Reverse geocoding updates address when pin is moved
- [ ] Latitude and longitude values are correct
- [ ] Full address field displays correctly
- [ ] City field auto-fills from geocoding
- [ ] Pincode field accepts 6 digits only
- [ ] Pincode validation works correctly
- [ ] Save button updates address successfully
- [ ] Success message displays after address update
- [ ] Default address is set correctly
- [ ] Existing default address is updated if one exists
- [ ] New address is created if no default exists
- [ ] Error messages display for validation failures
- [ ] Loading state shows during address update
- [ ] Map markers display correctly
- [ ] Map zoom controls work
- [ ] GPS location detection works (if enabled)

#### Address Validation
- [ ] Full address is required
- [ ] Latitude/longitude must be numbers
- [ ] Pincode must be exactly 6 digits
- [ ] City field is optional
- [ ] Form prevents submission with invalid data

### Product Load

#### Product Listing
- [ ] Product list loads correctly on home page
- [ ] Products display with images
- [ ] Product images load correctly
- [ ] Placeholder images show for products without images
- [ ] Product name displays correctly
- [ ] Product description displays (if available)
- [ ] Product price displays correctly (formatted in rupees)
- [ ] Product category displays correctly
- [ ] Product stock status displays correctly
- [ ] Out of stock products are marked clearly
- [ ] Product cards are clickable
- [ ] Product cards navigate to product detail page
- [ ] Loading skeleton shows while products load
- [ ] Empty state displays when no products found
- [ ] Error message displays on API failure

#### Pagination
- [ ] Pagination works correctly
- [ ] More products load on scroll
- [ ] Loading indicator shows when loading more products
- [ ] No infinite scroll when all products loaded
- [ ] Page parameter increments correctly
- [ ] Limit parameter works correctly (default 20)

#### Search Functionality
- [ ] Search bar is visible
- [ ] Search input accepts text
- [ ] Search is debounced (300ms delay)
- [ ] Search filters products by name
- [ ] Search filters products by description
- [ ] Search filters products by category
- [ ] Search is case-insensitive
- [ ] Search results update as user types
- [ ] Search clears correctly
- [ ] Empty search shows all products
- [ ] Search icon is clickable

#### Category Filtering
- [ ] Category chips are visible
- [ ] Category chips are scrollable horizontally
- [ ] "All" category shows all products
- [ ] Individual categories filter products correctly
- [ ] Active category is highlighted
- [ ] Category selection updates product list
- [ ] Multiple categories work (if supported)
- [ ] Category names match product categories
- [ ] Default categories show if none found

#### Sorting
- [ ] Sort menu is accessible
- [ ] "Price low-high" sorts correctly
- [ ] "Price high-low" sorts correctly
- [ ] "Recommended" shows default order
- [ ] Sort changes update UI smoothly
- [ ] Sort state persists during session

#### Pull to Refresh
- [ ] Pull to refresh works on mobile
- [ ] Refresh indicator appears during refresh
- [ ] Products reload after refresh
- [ ] Loading state shows during refresh

### Product Detail

#### Product Information Display
- [ ] Product detail page loads correctly
- [ ] Product image displays (full size)
- [ ] Product name displays correctly
- [ ] Product description displays correctly
- [ ] Product category displays correctly
- [ ] Product price displays correctly
- [ ] Price breakdown shows (per unit / total)
- [ ] Unit type displays correctly (kg, g, piece)
- [ ] Unit value displays correctly
- [ ] Stock quantity displays correctly
- [ ] Out of stock indicator shows when applicable
- [ ] Freshness tag displays (if implemented)
- [ ] Nutritional info displays (if implemented)

#### Parallax Hero Image
- [ ] Hero image displays correctly
- [ ] Parallax effect works on scroll
- [ ] Zoom effect works on scroll
- [ ] Image scales correctly

#### Unit Selector
- [ ] Unit selector is visible (for kg/g products)
- [ ] User can select between kg and g
- [ ] Selected unit is highlighted
- [ ] Price updates when unit changes
- [ ] Quantity recalculates on unit change

#### Quantity Selector
- [ ] Quantity selector is visible
- [ ] Increment button increases quantity
- [ ] Decrement button decreases quantity
- [ ] Quantity cannot go below 1
- [ ] Quantity cannot exceed stock quantity
- [ ] Quantity displays correctly
- [ ] Total price updates with quantity change
- [ ] Animations work on quantity change

#### Add to Cart
- [ ] Add to cart button is visible
- [ ] Button is disabled when product is out of stock
- [ ] Button shows loading state during add
- [ ] Pop animation plays when item added
- [ ] Success message displays (toast/notification)
- [ ] Cart count updates after adding item
- [ ] Cart drawer opens after adding (optional)
- [ ] Item is added with correct quantity
- [ ] Item is added with correct unit
- [ ] Multiple additions update quantity correctly
- [ ] Error message displays on failure

#### Similar Products
- [ ] Similar products section displays
- [ ] Similar products show products from same category
- [ ] Similar products exclude current product
- [ ] Similar products carousel is scrollable
- [ ] Similar products cards are clickable
- [ ] Similar products navigate to detail page
- [ ] Maximum 10 similar products show

### Cart Logic

#### Cart Context
- [ ] Cart items persist in localStorage
- [ ] Cart loads from localStorage on app start
- [ ] Cart state is shared across pages
- [ ] Cart button shows item count badge
- [ ] Cart button shows total amount
- [ ] Cart button navigates to cart drawer

#### Cart Drawer
- [ ] Cart drawer opens from cart button
- [ ] Cart drawer slides up from bottom
- [ ] Cart drawer shows all items
- [ ] Each item shows product image
- [ ] Each item shows product name
- [ ] Each item shows quantity
- [ ] Each item shows unit price
- [ ] Each item shows subtotal
- [ ] Quantity controls work in cart
- [ ] Remove item button works
- [ ] Subtotal displays correctly
- [ ] Delivery fee displays correctly
- [ ] Total amount displays correctly
- [ ] Empty cart message displays when empty
- [ ] Checkout button navigates to checkout
- [ ] Drawer closes on backdrop click
- [ ] Drawer closes on swipe down

#### Cart Operations
- [ ] Add item to cart works
- [ ] Remove item from cart works
- [ ] Update quantity works in cart
- [ ] Update quantity respects stock limits
- [ ] Total price updates on quantity change
- [ ] Cart clears correctly
- [ ] Cart persists after page refresh
- [ ] Cart persists after app restart
- [ ] Duplicate items are merged correctly
- [ ] Items from different units are separate

### Checkout

#### Checkout Page
- [ ] Checkout page loads correctly
- [ ] User's default address displays
- [ ] Address edit button works
- [ ] Cart items display correctly
- [ ] Item quantities display correctly
- [ ] Item prices display correctly
- [ ] Subtotal calculates correctly
- [ ] Delivery fee displays correctly
- [ ] Total amount calculates correctly
- [ ] Payment section displays
- [ ] "Cash on Delivery" is pre-selected
- [ ] "QR on Delivery" option is available (informative only)
- [ ] Delivery instructions textarea is visible
- [ ] Time estimate displays ("Delivery in 20-30 minutes")
- [ ] Place Order button is visible
- [ ] Place Order button is enabled
- [ ] Loading state shows during order placement
- [ ] Success message displays after order placement
- [ ] User is redirected to order tracking after success
- [ ] Error messages display on failure

#### Order Creation
- [ ] Order API call works correctly
- [ ] Order includes all cart items
- [ ] Order includes correct quantities
- [ ] Order includes default address
- [ ] Order includes payment method
- [ ] Order includes delivery instructions
- [ ] Order number is generated
- [ ] Order status is set to "pending"
- [ ] Stock is validated before order creation
- [ ] Stock is reduced after order creation
- [ ] Insufficient stock error displays correctly
- [ ] Cart is cleared after successful order
- [ ] User is redirected to order tracking

#### Payment Options
- [ ] Cash on Delivery option works
- [ ] QR on Delivery option is visible (informative)
- [ ] Payment method is saved with order
- [ ] Payment method validation works

### Order Tracking

#### Order Status Tracker
- [ ] Order status tracker displays correctly
- [ ] 4 steps show: Placed, Accepted, Out for Delivery, Delivered
- [ ] Current status is highlighted
- [ ] Completed steps show checkmark
- [ ] Progress line animates between steps
- [ ] Each step is clickable to expand
- [ ] Timestamp displays for each step
- [ ] Message displays for each step
- [ ] Status updates automatically (polling every 10s)
- [ ] Status transition animations work
- [ ] "Call Delivery Boy" button appears when assigned
- [ ] "Track on Map" button works
- [ ] Celebratory animation plays when delivered
- [ ] Order items display correctly
- [ ] Order address displays correctly
- [ ] Order total displays correctly

#### Order Detail Display
- [ ] Order number displays correctly
- [ ] Order date/time displays correctly
- [ ] Order status displays correctly
- [ ] Order items list displays
- [ ] Each item shows product name
- [ ] Each item shows quantity
- [ ] Each item shows unit price
- [ ] Each item shows subtotal
- [ ] Delivery address displays
- [ ] Map link opens Google Maps correctly
- [ ] Total amount displays correctly

#### Status Polling
- [ ] Order status polls every 10 seconds
- [ ] Status updates without page refresh
- [ ] Polling stops on unmount
- [ ] Polling resumes on mount
- [ ] Network errors handled gracefully during polling

### Push Notifications

#### Notification Registration
- [ ] Notification permission is requested
- [ ] Permission request dialog displays
- [ ] FCM token is generated after permission grant
- [ ] FCM token is sent to backend
- [ ] Token is saved to user profile
- [ ] Token refresh works correctly
- [ ] Error handling works for permission denied
- [ ] Error handling works for token generation failure

#### Notification Reception
- [ ] Push notifications are received
- [ ] Notification title displays correctly
- [ ] Notification body displays correctly
- [ ] Notification icon displays correctly
- [ ] Notification opens app when tapped
- [ ] Notification navigates to relevant page
- [ ] Order status change notifications work
- [ ] Delivery assigned notifications work
- [ ] Notifications work in foreground
- [ ] Notifications work in background
- [ ] Notifications work when app is closed
- [ ] Notification sound plays (if enabled)
- [ ] Notification badge updates (if enabled)

#### Notification Deep Linking
- [ ] Notification data includes orderId
- [ ] App navigates to order detail on tap
- [ ] Correct order loads when opened from notification
- [ ] Deep linking works when app is closed
- [ ] Deep linking works when app is in background

---

## Admin App

### Product CRUD

#### Create Product
- [ ] Create product page is accessible
- [ ] Form fields are visible: name, description, category, price, unit type, unit value, stock qty, image
- [ ] Name field is required
- [ ] Description field is optional
- [ ] Category dropdown shows available categories
- [ ] Price input accepts numbers only
- [ ] Price converts from rupees to paise correctly
- [ ] Unit type selector works (kg, g, piece)
- [ ] Unit value input accepts decimals
- [ ] Stock qty input accepts decimals
- [ ] Image upload button works
- [ ] Image preview displays after selection
- [ ] Image validation works (jpg, png, webp only)
- [ ] Image uploads to Supabase correctly
- [ ] Image URL is saved with product
- [ ] Form validation prevents invalid submissions
- [ ] Success message displays after creation
- [ ] User is redirected to product list after creation
- [ ] Error messages display for failures
- [ ] Loading states show during operations

#### Read Products
- [ ] Product list loads correctly
- [ ] Products display with images
- [ ] Product details display correctly
- [ ] Pagination works correctly
- [ ] Search filters products correctly
- [ ] Category filter works correctly
- [ ] Inactive products are visible (admin view)
- [ ] Products can be clicked to view details
- [ ] Product detail page displays correctly

#### Update Product
- [ ] Edit product page is accessible
- [ ] Form pre-fills with existing product data
- [ ] All fields are editable
- [ ] Price converts from paise to rupees for display
- [ ] Image preview shows existing image
- [ ] Image can be changed
- [ ] New image uploads correctly
- [ ] Changes are saved correctly
- [ ] Success message displays after update
- [ ] User is redirected after update
- [ ] Error messages display for failures
- [ ] Stock can be adjusted inline (+1, -1, +10, -10)
- [ ] Inline stock updates work correctly

#### Delete Product (Optional)
- [ ] Delete button is accessible (if implemented)
- [ ] Confirmation dialog displays before delete
- [ ] Soft delete works (sets isActive = false)
- [ ] Hard delete works (if implemented)
- [ ] Product is removed from list after delete
- [ ] Error messages display for failures

### Image Upload

#### Image Upload Flow
- [ ] Upload button triggers file picker
- [ ] File picker accepts images only
- [ ] Image validation works (jpg, png, webp)
- [ ] Image size validation works (5MB limit)
- [ ] Image preview displays before upload
- [ ] Upload API call works correctly
- [ ] Image uploads to Supabase storage
- [ ] Public URL is returned correctly
- [ ] Image URL is saved with product
- [ ] Loading state shows during upload
- [ ] Progress indicator shows (if implemented)
- [ ] Error messages display for upload failures
- [ ] Error messages display for invalid file types
- [ ] Error messages display for file size exceeded

#### Image Display
- [ ] Uploaded images display correctly
- [ ] Image URLs are accessible
- [ ] Image CDN URLs work correctly
- [ ] Placeholder images show for missing images
- [ ] Image lazy loading works (if implemented)

### Order List

#### Order Listing
- [ ] Order list page loads correctly
- [ ] Orders display in table format
- [ ] Order number displays correctly
- [ ] Customer name displays correctly
- [ ] Customer phone displays correctly
- [ ] Order amount displays correctly
- [ ] Order status displays correctly
- [ ] Assigned delivery boy displays (if assigned)
- [ ] Order date/time displays correctly
- [ ] Pagination works correctly
- [ ] Search filters orders correctly (by order number, customer name, phone)
- [ ] Status filter works correctly
- [ ] Orders poll every 8 seconds for updates
- [ ] New orders are highlighted
- [ ] Optimistic UI updates work for status changes

#### Order Detail
- [ ] Order detail drawer/page is accessible
- [ ] Full order information displays
- [ ] Order items list displays correctly
- [ ] Customer address displays correctly
- [ ] Map link opens Google Maps correctly
- [ ] Call button dials customer phone
- [ ] Assign delivery boy section is visible
- [ ] Delivery boy dropdown shows active delivery boys
- [ ] Search works in delivery boy dropdown
- [ ] Assignment works correctly
- [ ] Notification is sent to delivery boy on assignment

### Assignment

#### Manual Assignment
- [ ] Assign modal/drawer opens
- [ ] Active delivery boys list loads
- [ ] Delivery boys display with name and phone
- [ ] Search filters delivery boys correctly
- [ ] Assignment button assigns delivery boy
- [ ] Order status updates to "out_for_delivery" (or configured status)
- [ ] Notification is sent to assigned delivery boy
- [ ] Assignment is saved correctly
- [ ] Success message displays
- [ ] Error messages display for failures
- [ ] Assignment only works for orders in "pending" or "confirmed" status

#### Auto Assignment (if configured)
- [ ] Auto assignment works when enabled
- [ ] Round-robin assignment works (if configured)
- [ ] Nearest delivery boy assignment works (if configured)
- [ ] Assignment strategy is configurable
- [ ] Auto assignment respects active status
- [ ] Auto assignment respects last assigned time

### Status Change

#### Status Updates
- [ ] Status dropdown/buttons are accessible
- [ ] Allowed statuses are: confirmed, preparing, out_for_delivery, delivered, cancelled
- [ ] Status transition validation works
- [ ] Invalid transitions are prevented
- [ ] Status updates work correctly
- [ ] Status change API call works
- [ ] Success message displays after status change
- [ ] Notification is sent to customer on status change
- [ ] Notification is sent to delivery boy on status change (if applicable)
- [ ] Timestamps are saved (outForDeliveryAt, deliveredAt)
- [ ] Optimistic UI updates work
- [ ] UI reverts on error
- [ ] Error messages display for failures

#### Status Transition Rules
- [ ] placed (pending) → confirmed works
- [ ] confirmed → preparing works
- [ ] preparing → out_for_delivery works
- [ ] out_for_delivery → delivered works
- [ ] Any status → cancelled works (except delivered)
- [ ] Invalid transitions are rejected
- [ ] Error messages show for invalid transitions

---

## Delivery App

### Login

#### Phone Login
- [ ] Login page is accessible
- [ ] Phone input field accepts 10 digits
- [ ] Phone validation works correctly
- [ ] FCM token input is optional
- [ ] Login API call works correctly
- [ ] JWT token is returned correctly
- [ ] Token is stored in localStorage
- [ ] Delivery boy profile is returned
- [ ] User is redirected to orders list after login
- [ ] Session persists on app restart
- [ ] Error message displays for invalid phone
- [ ] Error message displays for unregistered phone (404)
- [ ] Error message displays for inactive delivery boy
- [ ] Loading state shows during login

#### FCM Token Registration
- [ ] FCM token is sent during login (if provided)
- [ ] FCM token is saved to delivery boy profile
- [ ] FCM token is updated on subsequent logins
- [ ] Push notifications work after token registration

### Assigned List

#### Orders List
- [ ] Orders list page loads correctly
- [ ] Only assigned orders are displayed
- [ ] Orders with status "confirmed", "picked", "out_for_delivery" are shown
- [ ] Order cards display correctly
- [ ] Order number displays correctly
- [ ] Customer name displays correctly
- [ ] Customer phone displays correctly
- [ ] Order items summary displays correctly
- [ ] Order amount displays correctly
- [ ] Order status displays correctly
- [ ] Order address displays correctly
- [ ] Distance displays correctly (if calculated)
- [ ] ETA placeholder displays
- [ ] New orders are highlighted
- [ ] Orders poll every 10 seconds
- [ ] Empty state displays when no orders assigned
- [ ] Error messages display on API failure

#### Order Actions
- [ ] "Start Delivery" button is visible
- [ ] "View Details" button navigates to order detail
- [ ] "Navigate" button opens Google Maps
- [ ] "Call" button dials customer phone
- [ ] Badge shows for new/urgent orders
- [ ] Order cards are tappable

### Status Transitions

#### Status Updates
- [ ] Status buttons are accessible
- [ ] "Picked" button works
- [ ] "Out for Delivery" button works (optional)
- [ ] "Delivered" button works
- [ ] Status transition validation works
- [ ] Invalid transitions are prevented
- [ ] Status updates work correctly
- [ ] Timestamps are saved (pickedAt, outForDeliveryAt, deliveredAt)
- [ ] Notification is sent to customer on status change
- [ ] Success message displays after status change
- [ ] Error messages display for failures
- [ ] Loading states show during status updates

#### Status Transition Rules
- [ ] confirmed → picked works
- [ ] picked → out_for_delivery works
- [ ] out_for_delivery → delivered works
- [ ] Invalid transitions are rejected
- [ ] Error messages show for invalid transitions

### QR/COD Confirmation

#### Payment Confirmation
- [ ] Payment confirmation modal/drawer opens on deliver
- [ ] "Cash on Delivery" option is available
- [ ] "QR on Delivery" option is available
- [ ] Payment type selection works
- [ ] Payment type is saved with order
- [ ] "Collected Cash" button works
- [ ] "Scanned QR" button works
- [ ] Payment confirmation proceeds to delivery confirmation
- [ ] Photo proof upload works (if implemented)
- [ ] Signature confirmation works (if implemented)
- [ ] Order status updates to "delivered" after confirmation
- [ ] Notification is sent to customer after delivery
- [ ] Success message displays after delivery

#### Order Delivery Flow
- [ ] Order detail page shows delivery actions
- [ ] "Mark as Picked" button works
- [ ] "Mark Out for Delivery" button works
- [ ] "Mark as Delivered" button opens payment confirmation
- [ ] Full delivery flow works end-to-end
- [ ] All status updates are saved correctly
- [ ] All timestamps are recorded correctly

### Delivery Summary

#### Summary Page
- [ ] Summary page is accessible
- [ ] Today's delivered orders count displays correctly
- [ ] Total COD collected displays correctly
- [ ] Total QR payments displays correctly
- [ ] Distance travelled displays correctly (if implemented)
- [ ] Total collection amount displays correctly
- [ ] Today's deliveries list displays correctly
- [ ] CSV export button works
- [ ] CSV file downloads correctly
- [ ] CSV contains all required fields
- [ ] Data refreshes correctly
- [ ] Empty state displays when no deliveries today

---

## Performance Tests

### Load Time Tests
- [ ] App loads in < 3 seconds on 4G connection
- [ ] App loads in < 5 seconds on 3G connection
- [ ] Initial bundle size is < 2MB
- [ ] Images lazy load correctly
- [ ] Code splitting works correctly
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Time to Interactive (TTI) < 3.8s
- [ ] Largest Contentful Paint (LCP) < 2.5s

### API Response Times
- [ ] Product list API responds in < 500ms
- [ ] Product detail API responds in < 300ms
- [ ] Order creation API responds in < 1s
- [ ] Order list API responds in < 500ms
- [ ] Image upload API responds in < 3s
- [ ] Authentication API responds in < 1s

### Rendering Performance
- [ ] Product list scrolls smoothly (60fps)
- [ ] Image carousel scrolls smoothly
- [ ] Animations run at 60fps
- [ ] No jank during interactions
- [ ] No layout shifts (CLS < 0.1)

### Memory Usage
- [ ] App memory usage < 150MB
- [ ] No memory leaks during extended use
- [ ] Images are properly disposed
- [ ] Event listeners are cleaned up
- [ ] Timers/intervals are cleared

### Network Performance
- [ ] API calls are debounced/throttled correctly
- [ ] Duplicate API calls are prevented
- [ ] Failed requests retry correctly
- [ ] Offline state is handled gracefully
- [ ] Request caching works correctly

### Database Performance
- [ ] Database queries are optimized
- [ ] No N+1 query problems
- [ ] Pagination works efficiently
- [ ] Indexes are used correctly
- [ ] Database connection pool is sized correctly

---

## Crash Tests

### Error Handling
- [ ] App handles network errors gracefully
- [ ] App handles API errors (400, 401, 403, 404, 500) gracefully
- [ ] App handles invalid JSON responses
- [ ] App handles timeout errors
- [ ] App handles authentication errors
- [ ] App handles permission denied errors
- [ ] App handles invalid data gracefully
- [ ] App handles missing required fields
- [ ] App handles unexpected server responses

### Edge Cases
- [ ] App handles empty responses
- [ ] App handles null values
- [ ] App handles undefined values
- [ ] App handles very large data sets
- [ ] App handles very small screens
- [ ] App handles landscape orientation
- [ ] App handles rapid button clicks
- [ ] App handles concurrent API calls
- [ ] App handles rapid navigation

### Input Validation
- [ ] App handles extremely long text inputs
- [ ] App handles special characters in inputs
- [ ] App handles SQL injection attempts (sanitized)
- [ ] App handles XSS attempts (sanitized)
- [ ] App handles invalid email formats
- [ ] App handles invalid phone formats
- [ ] App handles negative numbers where not allowed
- [ ] App handles zero values where not allowed

### State Management
- [ ] App handles undefined state gracefully
- [ ] App handles state updates after unmount
- [ ] App handles concurrent state updates
- [ ] App handles state persistence errors
- [ ] App handles localStorage quota exceeded

### Image Handling
- [ ] App handles missing images gracefully
- [ ] App handles broken image URLs
- [ ] App handles very large images
- [ ] App handles unsupported image formats
- [ ] App handles image upload failures

### Memory Management
- [ ] App doesn't crash on low memory devices
- [ ] App handles memory warnings gracefully
- [ ] App releases unused resources correctly
- [ ] App doesn't retain large objects in memory

---

## Offline Behavior

### Offline Detection
- [ ] App detects offline state correctly
- [ ] Offline indicator displays when offline
- [ ] App detects online state correctly
- [ ] Online indicator displays when online
- [ ] Network state changes are detected immediately

### Offline Data Storage
- [ ] Cart data persists offline (localStorage)
- [ ] User preferences persist offline
- [ ] Authentication token persists offline
- [ ] Recent orders cache works offline
- [ ] Product cache works offline (if implemented)

### Offline Queue
- [ ] Failed API calls are queued offline
- [ ] Queue persists across app restarts
- [ ] Queue retries when back online
- [ ] Queue processes in correct order
- [ ] Queue shows pending sync indicator
- [ ] Queue handles conflicts correctly
- [ ] Queue can be manually retried
- [ ] Queue shows error status for failed items

### Offline Functionality
- [ ] User can browse cached products offline
- [ ] User can view order history offline
- [ ] User can view profile offline
- [ ] User cannot create orders offline (expected)
- [ ] User cannot update profile offline (expected)
- [ ] User sees appropriate offline messages

### Online Synchronization
- [ ] Data syncs automatically when back online
- [ ] Sync indicator shows during synchronization
- [ ] Sync errors are handled gracefully
- [ ] User is notified when sync completes
- [ ] Conflicts are resolved correctly
- [ ] Sync works for all queue items

### Offline UI
- [ ] Offline banner/message displays clearly
- [ ] Disabled buttons show appropriate state
- [ ] Error messages are user-friendly
- [ ] Loading states are clear
- [ ] Retry buttons are visible

### Delivery App Offline
- [ ] Delivery boy can view assigned orders offline (cached)
- [ ] Delivery boy cannot update status offline
- [ ] Status updates are queued offline
- [ ] Status updates sync when back online
- [ ] Pending sync badge shows offline updates
- [ ] Manual retry works for failed updates

---

## Cross-Platform Testing

### Android
- [ ] App works on Android 8.0+ (API 26+)
- [ ] App works on Android 12+ (API 31+)
- [ ] App works on Android 13+ (API 33+)
- [ ] App handles Android permissions correctly
- [ ] App handles Android back button correctly
- [ ] App handles Android system bars correctly
- [ ] App handles Android keyboard correctly
- [ ] App handles Android split screen mode
- [ ] App handles Android dark mode
- [ ] App works on tablets (if supported)

### iOS (if applicable)
- [ ] App works on iOS 13+
- [ ] App works on iOS 15+
- [ ] App works on iOS 16+
- [ ] App handles iOS permissions correctly
- [ ] App handles iOS safe areas correctly
- [ ] App handles iOS keyboard correctly
- [ ] App handles iOS dark mode
- [ ] App works on iPad (if supported)

### Web Browsers
- [ ] App works in Chrome (latest)
- [ ] App works in Firefox (latest)
- [ ] App works in Safari (latest)
- [ ] App works in Edge (latest)
- [ ] App works on mobile browsers
- [ ] App handles browser back/forward correctly
- [ ] App handles browser refresh correctly

### Device Sizes
- [ ] App works on small screens (320px width)
- [ ] App works on medium screens (768px width)
- [ ] App works on large screens (1024px width)
- [ ] App works on extra large screens (1920px width)
- [ ] App handles orientation changes correctly

---

## Additional Test Scenarios

### Security Tests
- [ ] JWT tokens are stored securely
- [ ] API keys are not exposed in client code
- [ ] User data is not logged in console
- [ ] Sensitive data is not cached inappropriately
- [ ] HTTPS is enforced (production)
- [ ] Input sanitization works correctly
- [ ] CSRF protection works (if implemented)

### Accessibility Tests
- [ ] App is keyboard navigable
- [ ] Screen readers work correctly
- [ ] Color contrast meets WCAG standards
- [ ] Text is readable at different sizes
- [ ] Touch targets are adequately sized (44x44px minimum)

### Localization (if applicable)
- [ ] App displays in default language correctly
- [ ] Language switching works (if implemented)
- [ ] Dates/times format correctly
- [ ] Currency displays correctly
- [ ] Text doesn't overflow in different languages

---

## Test Execution Notes

### Test Environment
- **Development**: `http://localhost:4000` (Backend), `http://localhost:3000` (Frontend)
- **Staging**: Update URLs in configuration
- **Production**: Update URLs in configuration

### Test Data
- Create test users for each role (customer, admin, delivery)
- Create test products with various attributes
- Create test orders in various states
- Use test credit cards/payment methods (if applicable)

### Test Tools
- **API Testing**: Postman, Thunder Client
- **Mobile Testing**: Android Studio Emulator, Physical devices
- **Performance**: Chrome DevTools, Lighthouse
- **Network**: Chrome DevTools Network tab, Charles Proxy

### Reporting Issues
When reporting issues, include:
- Device/OS version
- App version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots/videos (if applicable)
- Network logs (if applicable)
- Console logs (if applicable)

---

**Last Updated**: [Current Date]
**Version**: 1.0.0

