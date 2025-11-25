#!/bin/bash
# Seed script to run after database migrations
# This script runs the Prisma seed to create the default admin user

echo "🌱 Running admin seed script..."
npx ts-node prisma/seed.ts
echo "✅ Seed script completed"

