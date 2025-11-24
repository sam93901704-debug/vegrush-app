# Render Deployment Guide - Authentication System

## ✅ Prisma Seed Configuration Complete

### Files Created/Updated

1. **`backend/prisma/seed.ts`** ✅
   - Creates/updates admin user with username "admin" and password "Admin@123"
   - Uses bcrypt with 10 salt rounds for password hashing
   - Idempotent (safe to run multiple times)
   - Proper error handling and logging

2. **`backend/package.json`** ✅
   - Updated seed script: `"seed": "ts-node prisma/seed.ts"`
   - Added Prisma seed configuration:
     ```json
     "prisma": {
       "seed": "ts-node prisma/seed.ts"
     }
     ```

3. **`backend/prisma/schema.prisma`** ✅
   - Already configured correctly
   - Generator and datasource properly set
   - All required models exist with correct fields

### Admin User Credentials

After running the seed script:
- **Username**: `admin`
- **Password**: `Admin@123`

### Running the Seed Script

#### Local Development
```bash
cd backend
npm run seed
```

#### On Render (Automatic)
The seed script will run automatically after migrations if configured in Render's build command.

#### Manual Run on Render
If you need to run it manually, add this to your Render build command:
```bash
npm install && npm run build && npx prisma migrate deploy && npm run seed && npm start
```

### Prisma Schema Status

All required models exist:
- ✅ **User** - Has `password`, `email`, `phone`, `role` fields
- ✅ **AdminUser** - Has `username`, `password`, `role` fields  
- ✅ **DeliveryBoy** - Has `password`, `phone`, `name` fields

**Note**: Password fields are optional (`String?`) to support both password-based and Google OAuth authentication. This is intentional and maintains backward compatibility.

### Render Build Command

Recommended build command for Render:
```bash
npm install && npm run build && npx prisma migrate deploy && npm run seed
```

Or if you want to use `db push` instead:
```bash
npm install && npm run build && npx prisma generate && npx prisma db push && npm run seed
```

### Start Command

```bash
npm start
```

### Environment Variables Required on Render

1. `DATABASE_URL` - PostgreSQL connection string
2. `JWT_SECRET` - Secret key for JWT tokens (min 32 chars)
3. `JWT_EXPIRES_IN` - Optional, default: "7d"
4. `SUPABASE_URL` - Supabase project URL
5. `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
6. `SUPABASE_BUCKET` - Supabase bucket name (default: "product-images")

### Verification Steps

1. **Check seed script syntax**:
   ```bash
   cd backend
   npx ts-node prisma/seed.ts --help
   ```

2. **Test locally** (with DATABASE_URL set):
   ```bash
   npm run seed
   ```

3. **Verify admin user created**:
   ```sql
   SELECT username, role FROM "AdminUser" WHERE username = 'admin';
   ```

### Troubleshooting

#### Issue: "ts-node not found"
**Solution**: Already installed as dev dependency. If missing:
```bash
npm install -D ts-node
```

#### Issue: "Prisma seed not running"
**Solution**: Ensure `package.json` has:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

#### Issue: "Admin user already exists"
**Solution**: Seed script is idempotent - it will update the password if admin exists.

### Next Steps

1. ✅ Seed script created
2. ✅ Package.json updated
3. ✅ Prisma seed config added
4. ⏭️ Deploy to Render
5. ⏭️ Verify admin login works

---

**Status**: ✅ Ready for Render Deployment

