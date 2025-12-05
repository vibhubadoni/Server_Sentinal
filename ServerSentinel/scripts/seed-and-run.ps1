# ServerSentinel - Seed and Run Script (PowerShell)
# This script seeds the database and starts the application stack

$ErrorActionPreference = "Stop"

Write-Host "🚀 ServerSentinel - Seed and Run" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ docker-compose is not installed. Please install it and try again." -ForegroundColor Red
    exit 1
}

# Stop any running containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Start database services
Write-Host "🗄️  Starting database services..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
Write-Host "⏳ Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 1
    $pgReady = docker-compose exec -T postgres pg_isready -U sentinel 2>$null
} while ($LASTEXITCODE -ne 0)

Write-Host "✅ PostgreSQL is ready" -ForegroundColor Green

# Wait for Redis to be ready
Write-Host "⏳ Waiting for Redis to be ready..." -ForegroundColor Yellow
do {
    Start-Sleep -Seconds 1
    $redisReady = docker-compose exec -T redis redis-cli ping 2>$null
} while ($LASTEXITCODE -ne 0)

Write-Host "✅ Redis is ready" -ForegroundColor Green

# Run database migrations and seed
Write-Host "📊 Running database migrations and seeding..." -ForegroundColor Yellow
Get-Content db/schema.sql | docker-compose exec -T postgres psql -U sentinel -d serversentinel
Get-Content db/triggers.sql | docker-compose exec -T postgres psql -U sentinel -d serversentinel
Get-Content db/seed.sql | docker-compose exec -T postgres psql -U sentinel -d serversentinel

Write-Host "✅ Database seeded successfully" -ForegroundColor Green

# Start all services
Write-Host "🚀 Starting all services..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services to be healthy
Write-Host "⏳ Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service health
Write-Host "🏥 Checking service health..." -ForegroundColor Yellow

# Check API
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing
    Write-Host "✅ API is healthy" -ForegroundColor Green
} catch {
    Write-Host "❌ API health check failed" -ForegroundColor Red
}

# Check Client
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing
    Write-Host "✅ Client is healthy" -ForegroundColor Green
} catch {
    Write-Host "❌ Client health check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "✨ ServerSentinel is running!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host "📱 Web UI: http://localhost:5173" -ForegroundColor White
Write-Host "🔌 API: http://localhost:3000" -ForegroundColor White
Write-Host "📊 Grafana: http://localhost:3001 (admin/admin)" -ForegroundColor White
Write-Host "📈 Prometheus: http://localhost:9091" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Test Credentials:" -ForegroundColor Yellow
Write-Host "   Email: admin@serversentinel.io" -ForegroundColor White
Write-Host "   Password: password123" -ForegroundColor White
Write-Host ""
Write-Host "📝 View logs: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "🛑 Stop services: docker-compose down" -ForegroundColor Cyan
Write-Host ""
