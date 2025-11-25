# Database Setup Script for Windows
# This script helps set up the database for the VegRush backend

Write-Host "🚀 VegRush Database Setup" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file first with DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Load .env file
$envContent = Get-Content .env
$databaseUrl = $envContent | Where-Object { $_ -match "^DATABASE_URL=" } | ForEach-Object { $_ -replace "DATABASE_URL=", "" } -replace '"', ''

if (-not $databaseUrl) {
    Write-Host "❌ DATABASE_URL not found in .env file!" -ForegroundColor Red
    exit 1
}

Write-Host "📋 Database URL: $databaseUrl" -ForegroundColor Gray
Write-Host ""

# Test database connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Yellow
try {
    npx prisma db pull --schema=./prisma/schema.prisma 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database connection successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database connection failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please check:" -ForegroundColor Yellow
        Write-Host "  1. Database server is running" -ForegroundColor Yellow
        Write-Host "  2. DATABASE_URL in .env is correct" -ForegroundColor Yellow
        Write-Host "  3. Database exists and is accessible" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Error testing connection: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Running database migrations..." -ForegroundColor Yellow
try {
    npx prisma migrate deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Migrations failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running migrations: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🌱 Seeding database with admin user..." -ForegroundColor Yellow
try {
    npx ts-node prisma/seed.ts
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database seeded successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Seed script had issues, but continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Error seeding database: $_" -ForegroundColor Yellow
    Write-Host "   You can run the seed manually later: npx ts-node prisma/seed.ts" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Default admin credentials:" -ForegroundColor Cyan
Write-Host "  Username: vegrushadmin" -ForegroundColor White
Write-Host "  Password: Admin@123" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Remember to change these credentials in production!" -ForegroundColor Yellow


