-- Fix AdminUser username uniqueness constraint
-- This migration ensures all AdminUser records have a unique username before applying the constraint

-- Step 1: Update any NULL or empty usernames to a default value based on ID
-- This ensures no conflicts when we add the unique constraint
UPDATE "AdminUser" 
SET "username" = COALESCE(
  NULLIF(TRIM("username"), ''),
  'admin_' || SUBSTRING("id"::text, 1, 8)
)
WHERE "username" IS NULL OR TRIM("username") = '';

-- Step 2: Drop existing unique constraint if it exists (in case it was added incorrectly)
ALTER TABLE "AdminUser" DROP CONSTRAINT IF EXISTS "AdminUser_username_key";

-- Step 3: Add the unique constraint (PostgreSQL allows multiple NULLs in UNIQUE columns)
ALTER TABLE "AdminUser"
  ADD CONSTRAINT "AdminUser_username_key" UNIQUE ("username");

