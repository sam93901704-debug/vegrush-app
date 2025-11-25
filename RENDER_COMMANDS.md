# Render Deployment Commands - Complete Guide

## 🔧 Git Commit Command

To ensure backend folder is committed and pushed to GitHub:

```bash
cd D:\your-app

# Check current status
git status

# Add all backend files
git add backend/

# Verify what's staged
git status

# Commit with descriptive message
git commit -m "Add backend Express server for Render deployment"

# Push to GitHub
git push origin main

# Verify push success (check on GitHub)
# https://github.com/sam93901704-debug/vegrush-app
```

**One-liner** (if everything is already staged):
```bash
cd D:\your-app && git add backend/ && git commit -m "Add backend Express server for Render deployment" && git push origin main
```

---

## 🚀 Render Configuration

### Option 1: Root Directory Set to `backend` (RECOMMENDED)

In Render Dashboard → Settings → Root Directory: Set to `backend`

**Build Command**:
```bash
npm install && npx prisma generate && npm run build
```

**Start Command**:
```bash
npm start
```

**Pre-Deploy Command** (Optional - if you want to run migrations):
```bash
npx prisma migrate deploy
```

**OR** (if you need to seed admin user):
```bash
npm run seed
```

---

### Option 2: Root Directory Empty (Uses Repository Root)

If Root Directory is empty or not set:

**Build Command**:
```bash
cd backend && npm install && npx prisma generate && npm run build
```

**Start Command**:
```bash
cd backend && npm start
```

**Pre-Deploy Command** (Optional):
```bash
cd backend && npx prisma migrate deploy
```

---

## 📋 Complete Render Configuration

### Environment Variables (Required)

Set these in Render Dashboard → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
JWT_SECRET=your-very-secret-jwt-key-change-this-in-production
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
```

### Environment Variables (Optional - for Supabase image uploads)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_BUCKET=product-images
LOG_LEVEL=info
```

---

## ✅ Recommended Configuration

### Settings
- **Root Directory**: `backend` ✅
- **Environment**: `Node`
- **Node Version**: `20.x` or `22.x` (auto-detected)

### Build Command
```bash
npm install && npx prisma generate && npm run build
```

### Start Command
```bash
npm start
```

### Pre-Deploy Command (Optional)
Leave empty, OR use if you need migrations:
```bash
npx prisma migrate deploy
```

---

## 🔍 What Each Command Does

### Build Command Breakdown:
1. `npm install` → Installs dependencies
   - Runs `postinstall` → `npx prisma generate` (generates Prisma client)
2. `npx prisma generate` → Ensures Prisma client is generated (redundant but safe)
3. `npm run build` → `tsc` compiles TypeScript → outputs to `dist/`

### Start Command:
- `npm start` → `node dist/server.js` → Starts Express server

### Pre-Deploy Command (Optional):
- `npx prisma migrate deploy` → Applies database migrations
- Use this if you have migrations in `backend/prisma/migrations/`

---

## 🚨 Important Notes

### Don't Use `prisma db push` in Production
❌ **DON'T** use:
```bash
npx prisma db push --accept-data-loss
```

This can cause data loss. Use migrations instead:
```bash
npx prisma migrate deploy
```

### If No Migrations Exist Yet
If you haven't created migrations, either:
1. **Create migrations locally**:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   git add prisma/migrations/
   git commit -m "Add initial database migrations"
   git push origin main
   ```

2. **OR use `db push` for first deployment only** (not recommended):
   ```bash
   npx prisma db push
   ```

---

## ✅ Final Checklist

Before deploying to Render:

- [ ] Backend folder is committed and pushed to GitHub
- [ ] Root Directory is set to `backend` in Render
- [ ] Build Command: `npm install && npx prisma generate && npm run build`
- [ ] Start Command: `npm start`
- [ ] Environment variables are set (DATABASE_URL, JWT_SECRET, etc.)
- [ ] Verify `backend/package.json` has correct scripts
- [ ] Verify `backend/src/server.ts` exists
- [ ] Verify `backend/prisma/schema.prisma` exists

---

## 🎯 Quick Reference

**Git Push**:
```bash
git add backend/ && git commit -m "Deploy backend to Render" && git push origin main
```

**Render Build Command** (Root Directory = `backend`):
```bash
npm install && npx prisma generate && npm run build
```

**Render Start Command**:
```bash
npm start
```

**Render Pre-Deploy** (Optional):
```bash
npx prisma migrate deploy
```

---

## 📝 Example Complete Setup

### 1. Local Git Commands:
```bash
cd D:\your-app
git add backend/
git commit -m "Add backend Express server for Render deployment"
git push origin main
```

### 2. Render Dashboard Configuration:
- **Root Directory**: `backend`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`
- **Pre-Deploy Command**: (Leave empty, OR `npx prisma migrate deploy`)

### 3. Environment Variables in Render:
```
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-frontend.vercel.app
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BUCKET=product-images
```

---

**After setup, Render will:**
1. Clone repository
2. Run build command
3. Start server with start command
4. Your backend API will be live! 🚀

