# Database Setup Guide

## Quick Setup Options

### Option 1: Use Free Cloud PostgreSQL (Recommended for Quick Testing)

1. **Sign up for a free PostgreSQL database:**
   - **Neon** (Recommended): https://neon.tech (Free tier available)
   - **Supabase**: https://supabase.com (Free tier available)
   - **Railway**: https://railway.app (Free tier available)

2. **Get your connection string** from the service dashboard

3. **Update `.env` file:**
   ```env
   DATABASE_URL="your-cloud-database-connection-string"
   ```

4. **Run migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

5. **Seed the database:**
   ```bash
   npx ts-node prisma/seed.ts
   ```

### Option 2: Install PostgreSQL Locally

#### Windows (Using Chocolatey):
```powershell
choco install postgresql
```

#### Windows (Manual Install):
1. Download from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the `postgres` user
4. Update `.env` with your password:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/vegrush_dev?schema=public"
   ```

#### Create Database:
```sql
CREATE DATABASE vegrush_dev;
```

#### Run Setup:
```bash
cd backend
npx prisma migrate deploy
npx ts-node prisma/seed.ts
```

### Option 3: Use Docker (If Docker is installed)

```bash
docker run --name vegrush-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=vegrush_dev -p 5432:5432 -d postgres:15
```

Then update `.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vegrush_dev?schema=public"
```

Run migrations:
```bash
cd backend
npx prisma migrate deploy
npx ts-node prisma/seed.ts
```

## Current Configuration

The `.env` file is configured for:
- **Database**: `vegrush_dev`
- **User**: `postgres`
- **Password**: `postgres`
- **Host**: `localhost`
- **Port**: `5432`

Update the `DATABASE_URL` in `.env` to match your setup.

## Verify Setup

After setting up the database, verify it works:

```bash
cd backend
npx prisma db pull  # This will test the connection
```

If successful, you should see the schema information.

## Default Admin Credentials

After seeding, you can login with:
- **Username**: `vegrushadmin`
- **Password**: `Admin@123`

⚠️ **Change these credentials in production!**


