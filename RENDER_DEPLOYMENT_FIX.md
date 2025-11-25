# Render Deployment Fix - Complete Solution

## 🔴 Problem

Render build is failing with:
```
bash: line 1: cd: backend: No such file or directory
```

**Current Build Command** (Incorrect):
```bash
cd backend && npm install && npx prisma generate && npx prisma db push --accept-data-loss && npm run build
```

## ✅ Solution - Two Options

### Option 1: Use render.yaml (RECOMMENDED - Automatic)

I've created `render.yaml` in the root of your repository. This will automatically configure Render.

**Steps:**
1. ✅ `render.yaml` is already created in your repo root
2. In Render Dashboard:
   - Go to your service → Settings
   - Make sure "Auto-Deploy" is enabled
   - Render will automatically use `render.yaml` configuration
3. **OR** create a new service and Render will detect `render.yaml` automatically

**What render.yaml does:**
- Sets Root Directory to `backend`
- Configures build command (no `cd backend` needed)
- Configures start command
- Sets environment variables

---

### Option 2: Manual Configuration in Render Dashboard

If you prefer manual setup or render.yaml doesn't work:

#### Step 1: Set Root Directory

1. Go to Render Dashboard
2. Navigate to your service → **Settings**
3. Find **"Root Directory"** field
4. Set it to: `backend`
5. Click **Save**

#### Step 2: Update Build Command

In Render Dashboard → Settings → Build Command, use:

```bash
npm install && npx prisma generate && npm run build
```

**Remove** `cd backend &&` from the beginning!

#### Step 3: Update Start Command

In Render Dashboard → Settings → Start Command, use:

```bash
npm start
```

**Remove** `cd backend &&` if it's there!

#### Step 4: Optional - Pre-Deploy Command (for migrations)

If you want to run migrations automatically:

In Render Dashboard → Settings → Pre-Deploy Command:

```bash
npx prisma migrate deploy
```

**OR** if you need to seed admin user:

```bash
npx prisma migrate deploy && npm run seed
```

---

## 📋 Complete Render Configuration

### Settings Tab:
- **Root Directory**: `backend` ✅
- **Environment**: `Node`
- **Node Version**: `22.x` (or auto-detect)

### Build Command:
```bash
npm install && npx prisma generate && npm run build
```

### Start Command:
```bash
npm start
```

### Pre-Deploy Command (Optional):
```bash
npx prisma migrate deploy
```

---

## 🔧 Environment Variables Required

Set these in Render Dashboard → Environment Variables:

### Required:
```
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
JWT_SECRET=your-very-secret-jwt-key-minimum-32-characters-long
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
PORT=4000
NODE_ENV=production
```

### Optional (for image uploads):
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=product-images
```

### Optional (for notifications):
```
FCM_SERVER_KEY=your-fcm-server-key
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## ✅ Verification Checklist

Before deploying:

- [ ] `backend/` folder exists in your GitHub repository
- [ ] `backend/package.json` exists
- [ ] `backend/src/server.ts` exists
- [ ] `backend/prisma/schema.prisma` exists
- [ ] Root Directory is set to `backend` in Render
- [ ] Build Command doesn't have `cd backend &&`
- [ ] Start Command doesn't have `cd backend &&`
- [ ] All environment variables are set
- [ ] DATABASE_URL points to a valid PostgreSQL database

---

## 🚨 Important Notes

### Don't Use `prisma db push --accept-data-loss` in Production!

❌ **DON'T USE:**
```bash
npx prisma db push --accept-data-loss
```

This can cause data loss. Use migrations instead:

✅ **USE:**
```bash
npx prisma migrate deploy
```

### If You Don't Have Migrations Yet

1. **Create migrations locally:**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   git add prisma/migrations/
   git commit -m "Add initial database migrations"
   git push origin main
   ```

2. **Then use in Render:**
   ```bash
   npx prisma migrate deploy
   ```

---

## 🔍 Troubleshooting

### Issue: "backend: No such file or directory"

**Solution:**
- Set Root Directory to `backend` in Render Dashboard
- Remove `cd backend &&` from build/start commands

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
- Make sure `npm install` runs before `npx prisma generate`
- Build command should be: `npm install && npx prisma generate && npm run build`

### Issue: "Database connection failed"

**Solution:**
- Check DATABASE_URL environment variable is set correctly
- Verify PostgreSQL database is running and accessible
- Check database credentials are correct

### Issue: "Port already in use"

**Solution:**
- Make sure PORT environment variable is set to 4000
- Render automatically assigns a port, but you can override with PORT env var

---

## 📝 Quick Reference

**Root Directory**: `backend`

**Build Command**:
```bash
npm install && npx prisma generate && npm run build
```

**Start Command**:
```bash
npm start
```

**Pre-Deploy Command** (Optional):
```bash
npx prisma migrate deploy
```

---

## 🎯 After Fix

Once you've updated the configuration:

1. **Save settings** in Render Dashboard
2. **Trigger a new deployment** (or push to main if auto-deploy is enabled)
3. **Check build logs** - should see:
   - ✅ Installing dependencies
   - ✅ Generating Prisma Client
   - ✅ Building TypeScript
   - ✅ Starting server

4. **Verify deployment**:
   - Check service URL: `https://your-service.onrender.com/health`
   - Should return: `{"status":"ok"}`

---

## ✅ Summary

The fix is simple:
1. Set **Root Directory** to `backend` in Render Dashboard
2. Remove `cd backend &&` from build and start commands
3. Use the commands provided above

This will fix the deployment issue! 🚀

