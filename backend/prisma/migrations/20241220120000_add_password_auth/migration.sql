-- AlterTable: Add password fields and make Google OAuth fields optional
-- Migration: add_password_auth

-- User table: Make googleId optional, add password field, add role field
ALTER TABLE "User" 
  ALTER COLUMN "googleId" DROP NOT NULL,
  ALTER COLUMN "email" DROP NOT NULL,
  ADD COLUMN "password" TEXT,
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'customer';

-- AdminUser table: Add username, password, make googleId and email optional
ALTER TABLE "AdminUser"
  ADD COLUMN "username" TEXT UNIQUE,
  ADD COLUMN "password" TEXT,
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "googleId" DROP NOT NULL,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DeliveryBoy table: Add password field
ALTER TABLE "DeliveryBoy"
  ADD COLUMN "password" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_phone_idx" ON "User"("phone");
CREATE INDEX IF NOT EXISTS "AdminUser_username_idx" ON "AdminUser"("username");

