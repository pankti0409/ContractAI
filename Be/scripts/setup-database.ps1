# ContractAI Database Setup Script for Windows
# This script automates the database creation and schema setup

Write-Host "🚀 ContractAI Database Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if PostgreSQL is accessible
Write-Host "🔍 Checking PostgreSQL connection..." -ForegroundColor Yellow

try {
    # Try to connect to PostgreSQL using psql
    $env:PGPASSWORD = "1234"  # Default password from .env
    $testConnection = & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d postgres -c "SELECT version();" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is accessible" -ForegroundColor Green
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "❌ Cannot connect to PostgreSQL" -ForegroundColor Red
    Write-Host "💡 Please ensure:" -ForegroundColor Yellow
    Write-Host "   • PostgreSQL is installed and running" -ForegroundColor Yellow
    Write-Host "   • PostgreSQL service is started" -ForegroundColor Yellow
    Write-Host "   • Password in .env file matches your PostgreSQL setup" -ForegroundColor Yellow
    Write-Host "   • PostgreSQL is accessible on localhost:5432" -ForegroundColor Yellow
    exit 1
}

# Navigate to backend directory
$backendPath = Split-Path -Parent $PSScriptRoot
Set-Location $backendPath

Write-Host "📂 Working directory: $backendPath" -ForegroundColor Cyan

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    Write-Host "Please create .env file with database configuration" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
}

# Run the database setup script
Write-Host "🔧 Setting up database..." -ForegroundColor Yellow
node scripts/setup-database.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "\n🎉 Database setup completed successfully!" -ForegroundColor Green
    Write-Host "\n📋 You can now:" -ForegroundColor Cyan
    Write-Host "   • Run 'npm run dev' to start the backend server" -ForegroundColor White
    Write-Host "   • Use admin@contractai.com / admin123 for initial login" -ForegroundColor White
    Write-Host "   • Run 'npm run db:reset' to reset the database if needed" -ForegroundColor White
} else {
    Write-Host "\n❌ Database setup failed" -ForegroundColor Red
    Write-Host "Please check the error messages above" -ForegroundColor Yellow
    exit 1
}

# Clean up environment variable
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue