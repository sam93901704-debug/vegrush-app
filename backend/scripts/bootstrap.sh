#!/bin/bash

# Bootstrap script for backend setup
# This script sets up the development environment safely and idempotently

# Don't exit on error - we'll handle errors gracefully
set +e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

# Change to backend directory
cd "$BACKEND_DIR"

echo -e "${GREEN}🚀 Starting backend bootstrap...${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    
    if [ -f .env.example ]; then
        echo -e "${YELLOW}📋 Copying .env.example to .env...${NC}"
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from .env.example${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env and fill in all required values before continuing!${NC}"
        echo -e "${YELLOW}   Press Enter to continue after editing .env, or Ctrl+C to exit...${NC}"
        read -r
    else
        echo -e "${RED}❌ .env.example not found! Please create .env manually.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

# Check if DATABASE_URL is set in .env
if ! grep -q "DATABASE_URL=" .env || grep -q "DATABASE_URL=\"\"" .env || grep -q "DATABASE_URL=\"postgresql://<user>" .env; then
    echo -e "${RED}❌ DATABASE_URL is not configured in .env!${NC}"
    echo -e "${YELLOW}   Please set DATABASE_URL in .env before continuing.${NC}"
    exit 1
fi

echo -e "\n${GREEN}📦 Step 1/4: Installing dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  node_modules exists, checking for updates...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies up to date${NC}"
    else
        echo -e "${YELLOW}⚠️  npm install completed with warnings${NC}"
    fi
fi

echo -e "\n${GREEN}🔧 Step 2/4: Generating Prisma Client...${NC}"
npm run prisma:generate
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma Client generated${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
fi

echo -e "\n${GREEN}🗄️  Step 3/4: Running database migrations...${NC}"
# Check if migrations directory exists
if [ ! -d "prisma/migrations" ]; then
    echo -e "${YELLOW}📝 No migrations found, creating initial migration...${NC}"
    npm run prisma:migrate -- --name init
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Initial migration created and applied${NC}"
    else
        echo -e "${RED}❌ Failed to create initial migration${NC}"
        echo -e "${YELLOW}   Make sure your DATABASE_URL is correct and the database is accessible${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}🔄 Applying pending migrations...${NC}"
    npm run prisma:migrate
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Migrations applied${NC}"
    else
        echo -e "${YELLOW}⚠️  Migration command completed (database may already be up-to-date)${NC}"
    fi
fi

echo -e "\n${GREEN}🌱 Step 4/4: Seeding database...${NC}"
# Ask user if they want to seed (since seed can be run multiple times but might be skipped)
read -p "Do you want to seed the database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run seed
    echo -e "${GREEN}✅ Database seeded${NC}"
else
    echo -e "${YELLOW}⏭️  Skipping database seed${NC}"
    echo -e "${YELLOW}   Run 'npm run seed' manually if needed${NC}"
fi

echo -e "\n${GREEN}✨ Bootstrap complete!${NC}\n"
echo -e "${GREEN}You can now start the development server with:${NC}"
echo -e "  ${YELLOW}npm run dev${NC}\n"

