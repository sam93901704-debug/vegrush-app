# Admin Seed Setup Documentation

## Admin User Credentials

- **Email**: `sam93901703@gmail.com`
- **Username**: `admin`
- **Password**: `Sameer@123`

## Seed Script Location

The seed script is located at:
- **Path**: `backend/prisma/seed.ts`
- **Purpose**: Creates a single admin user with the credentials above
- **Idempotent**: Safe to run multiple times - will update existing admin if found

## Automatic Seeding

### Method 1: Server Startup (Recommended - Already Implemented)
The server automatically creates/updates the admin user on startup via `ensureDefaultAdmin()` in:
- **File**: `backend/src/utils/adminSeeder.ts`
- **Location**: Called in `backend/src/server.ts` after server starts

### Method 2: Manual Seed Command
To manually run the seed script:
```bash
cd backend
npm run seed
```

### Method 3: After Migrations (For Render Deployment)
In Render, configure the build command to run migrations and seed:
```bash
npm run prisma:migrate:seed
```

Or in Render dashboard:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start` (seed runs automatically on startup via ensureDefaultAdmin)

**Note**: The seed script requires database connection, so it cannot run during `postinstall` (no DB available during build). It runs automatically on server startup instead.

## Admin Login Only

✅ **Admin signup is NOT available** - Admins can only login, not signup.

- ✅ Admin login route exists: `POST /api/auth/admin/login`
- ✅ Admin login page exists: `/admin/login`
- ❌ Admin signup route: **DOES NOT EXIST**
- ❌ Admin signup page: **DOES NOT EXIST**

## Files Modified

1. **backend/prisma/seed.ts** - Updated email to `sam93901703@gmail.com`
2. **backend/src/utils/adminSeeder.ts** - Updated email to `sam93901703@gmail.com`
3. **backend/package.json** - Added `prisma:migrate:seed` script (optional)

## Verification

After deployment, verify admin user exists:
1. Try logging in at `/admin/login` with credentials above
2. Check server logs for: `✅ Default admin user created/updated successfully`
3. Verify admin can access `/admin` dashboard

