# Simple Setup Script - Fixes All Issues
param(
    [string]$DatabaseUrl = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VegRush Backend Setup & Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    $envContent = @"
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vegrush_dev?schema=public
JWT_SECRET=vegrush-dev-jwt-secret-key-2024-change-in-production-min-32-chars
GOOGLE_CLIENT_ID=test-client-id.apps.googleusercontent.com
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
DELIVERY_AUTO_ASSIGN=false
ASSIGNMENT_STRATEGY=manual
"@
    $envContent | Out-File -FilePath .env -Encoding utf8
    Write-Host "Created .env file" -ForegroundColor Green
}

# Update DATABASE_URL if provided
if ($DatabaseUrl -ne "") {
    Write-Host "Updating DATABASE_URL..." -ForegroundColor Yellow
    $envContent = Get-Content .env
    $newContent = $envContent | ForEach-Object {
        if ($_ -match "^DATABASE_URL=") {
            "DATABASE_URL=$DatabaseUrl"
        } else {
            $_
        }
    }
    $newContent | Out-File -FilePath .env -Encoding utf8
    Write-Host "Updated DATABASE_URL" -ForegroundColor Green
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
if (-not (Test-Path node_modules)) {
    npm install
}

# Generate Prisma Client
Write-Host ""
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Test database connection
Write-Host ""
Write-Host "Testing database connection..." -ForegroundColor Yellow
$dbTest = npx prisma db pull 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Cannot connect to database!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Get a free database from https://neon.tech" -ForegroundColor White
    Write-Host "2. Copy the connection string" -ForegroundColor White
    Write-Host "3. Run: .\simple-setup.ps1 -DatabaseUrl 'your-connection-string'" -ForegroundColor White
    Write-Host ""
    Write-Host "Or see QUICK_FIX.md for other options" -ForegroundColor Yellow
    exit 1
}

# Run migrations
Write-Host ""
Write-Host "Running migrations..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migrations failed!" -ForegroundColor Red
    exit 1
}

# Seed database
Write-Host ""
Write-Host "Seeding database..." -ForegroundColor Yellow
npx ts-node prisma/seed.ts

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start server: npm run dev" -ForegroundColor White
Write-Host "2. Test: curl http://localhost:4000/health" -ForegroundColor White
Write-Host "3. Re-run Testsprite tests" -ForegroundColor White
Write-Host ""
Write-Host "Admin login:" -ForegroundColor Cyan
Write-Host "  Username: vegrushadmin" -ForegroundColor White
Write-Host "  Password: Admin@123" -ForegroundColor White
Write-Host ""

