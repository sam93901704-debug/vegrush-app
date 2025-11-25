# Quick Fix for All Testsprite Issues

## The Problem
All tests are failing because the backend server can't connect to PostgreSQL database.

## The Solution (Choose One)

### ✅ Option 1: Use Free Cloud Database (FASTEST - 2 minutes)

1. **Get a free PostgreSQL database:**
   - Go to: https://neon.tech
   - Click "Sign Up" (free, no credit card)
   - Click "Create Project"
   - Name it "vegrush-dev"
   - Copy the connection string (starts with `postgresql://`)

2. **Update .env file:**
   ```powershell
   cd backend
   # Open .env in notepad or your editor
   notepad .env
   # Replace the DATABASE_URL line with your Neon connection string
   ```

3. **Run setup:**
   ```powershell
   cd backend
   npx prisma migrate deploy
   npx ts-node prisma/seed.ts
   ```

4. **Start server:**
   ```powershell
   npm run dev
   ```

5. **Test it:**
   ```powershell
   curl http://localhost:4000/health
   ```

### Option 2: Install PostgreSQL Locally

1. **Download PostgreSQL:**
   - https://www.postgresql.org/download/windows/
   - Install with default settings
   - Remember the password you set

2. **Create database:**
   ```sql
   -- Open pgAdmin or psql
   CREATE DATABASE vegrush_dev;
   ```

3. **Update .env:**
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/vegrush_dev?schema=public"
   ```

4. **Run setup:**
   ```powershell
   cd backend
   npx prisma migrate deploy
   npx ts-node prisma/seed.ts
   npm run dev
   ```

### Option 3: Use Docker (if you have Docker)

```powershell
docker run --name vegrush-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=vegrush_dev -p 5432:5432 -d postgres:15
```

Then:
```powershell
cd backend
npx prisma migrate deploy
npx ts-node prisma/seed.ts
npm run dev
```

## After Database is Set Up

1. **Verify server runs:**
   ```powershell
   cd backend
   npm run dev
   ```
   Should see: `🚀 Server running on port 4000`

2. **Test health endpoint:**
   ```powershell
   curl http://localhost:4000/health
   ```
   Should return: `{"status":"ok"}`

3. **Re-run Testsprite tests:**
   The tests should now pass!

## Default Admin Login

After seeding:
- **Username:** `vegrushadmin`
- **Password:** `Admin@123`

## Troubleshooting

**If migrations fail:**
- Check DATABASE_URL in .env is correct
- Verify database exists
- Check database server is running

**If server won't start:**
- Check .env file has all required variables
- Verify DATABASE_URL is correct
- Check port 4000 is not in use

**If tests still fail:**
- Make sure backend is running on port 4000
- Check server logs for errors
- Verify database connection works

