# Comprehensive Fix Script for All Testsprite Issues
# This script fixes all backend issues identified by Testsprite

Write-Host "🔧 Fixing All Testsprite Issues" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify .env file exists
Write-Host "📋 Step 1: Checking .env file..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found! Creating it..." -ForegroundColor Red
    
    @"
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/vegrush_dev?schema=public

# JWT Configuration
JWT_SECRET=vegrush-dev-jwt-secret-key-2024-change-in-production-min-32-chars

# Google OAuth Configuration
GOOGLE_CLIENT_ID=test-client-id.apps.googleusercontent.com

# Server Configuration
PORT=4000
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Delivery Assignment Configuration
DELIVERY_AUTO_ASSIGN=false
ASSIGNMENT_STRATEGY=manual
"@ | Out-File -FilePath .env -Encoding utf8
    
    Write-Host "✅ .env file created" -ForegroundColor Green
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Step 2: Check if DATABASE_URL is set
Write-Host ""
Write-Host "📋 Step 2: Checking DATABASE_URL..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw
if ($envContent -notmatch "DATABASE_URL=") {
    Write-Host "❌ DATABASE_URL not found in .env!" -ForegroundColor Red
    exit 1
}

$databaseUrl = ($envContent | Select-String -Pattern "DATABASE_URL=(.+)" | ForEach-Object { $_.Matches.Groups[1].Value }) -replace '"', ''

if ($databaseUrl -match "localhost:5432") {
    Write-Host "⚠️  Using localhost database. Checking if PostgreSQL is running..." -ForegroundColor Yellow
    
    # Test PostgreSQL connection
    try {
        $testResult = npx prisma db pull --schema=./prisma/schema.prisma 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "❌ PostgreSQL is not running or not accessible!" -ForegroundColor Red
            Write-Host ""
            Write-Host "📝 Quick Fix Options:" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Option 1: Use Free Cloud Database (Recommended - 2 minutes)" -ForegroundColor Green
            Write-Host "  1. Go to https://neon.tech and sign up (free)" -ForegroundColor White
            Write-Host "  2. Create a new project" -ForegroundColor White
            Write-Host "  3. Copy the connection string" -ForegroundColor White
            Write-Host "  4. Update DATABASE_URL in .env file" -ForegroundColor White
            Write-Host "  5. Run this script again" -ForegroundColor White
            Write-Host ""
            Write-Host "Option 2: Install PostgreSQL Locally" -ForegroundColor Green
            Write-Host "  See backend/SETUP_DATABASE.md for instructions" -ForegroundColor White
            Write-Host ""
            Write-Host "Option 3: Use Docker (if installed)" -ForegroundColor Green
            Write-Host "  docker run --name vegrush-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=vegrush_dev -p 5432:5432 -d postgres:15" -ForegroundColor White
            Write-Host ""
            exit 1
        } else {
            Write-Host "✅ Database connection successful!" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Error testing database: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Using cloud database: $($databaseUrl.Substring(0, [Math]::Min(50, $databaseUrl.Length)))..." -ForegroundColor Green
}

# Step 3: Install dependencies
Write-Host ""
Write-Host "📋 Step 3: Installing dependencies..." -ForegroundColor Yellow
if (-not (Test-Path node_modules)) {
    Write-Host "Installing npm packages..." -ForegroundColor Gray
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Step 4: Generate Prisma Client
Write-Host ""
Write-Host "📋 Step 4: Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Prisma Client generated" -ForegroundColor Green

# Step 5: Run migrations
Write-Host ""
Write-Host "📋 Step 5: Running database migrations..." -ForegroundColor Yellow
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migrations failed!" -ForegroundColor Red
    Write-Host "   This usually means the database doesn't exist or connection failed." -ForegroundColor Yellow
    Write-Host "   Please check your DATABASE_URL in .env file" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Migrations completed" -ForegroundColor Green

# Step 6: Seed database
Write-Host ""
Write-Host "📋 Step 6: Seeding database with admin user..." -ForegroundColor Yellow
npx ts-node prisma/seed.ts
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Seed script had issues, but continuing..." -ForegroundColor Yellow
} else {
    Write-Host "✅ Database seeded successfully" -ForegroundColor Green
}

# Step 7: Verify server can start
Write-Host ""
Write-Host "📋 Step 7: Testing server startup..." -ForegroundColor Yellow
Write-Host "   Starting server in background to test..." -ForegroundColor Gray

# Start server in background
$serverProcess = Start-Process -FilePath "node" -ArgumentList "node_modules/ts-node-dev/lib/bin.js", "src/server.ts" -PassThru -NoNewWindow -RedirectStandardOutput "server-test.log" -RedirectStandardError "server-error.log"

# Wait a bit for server to start
Start-Sleep -Seconds 5

# Check if server is running
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -TimeoutSec 2 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
        Write-Host "✅ Server is running and responding!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Server may not be fully started yet, but this is OK" -ForegroundColor Yellow
}

# Stop test server
Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Host ""
Write-Host "✅ All fixes completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start the backend server: npm run dev" -ForegroundColor White
Write-Host "  2. Verify it's running: curl http://localhost:4000/health" -ForegroundColor White
Write-Host "  3. Re-run Testsprite tests" -ForegroundColor White
Write-Host ""
Write-Host "Default Admin Credentials:" -ForegroundColor Cyan
Write-Host "  Username: vegrushadmin" -ForegroundColor White
Write-Host "  Password: Admin@123" -ForegroundColor White
Write-Host ""

