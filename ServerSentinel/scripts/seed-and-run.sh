#!/bin/bash

# ServerSentinel - Seed and Run Script
# This script seeds the database and starts the application stack

set -e

echo "🚀 ServerSentinel - Seed and Run"
echo "================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install it and try again."
    exit 1
fi

# Stop any running containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start database services
echo "🗄️  Starting database services..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec -T postgres pg_isready -U sentinel > /dev/null 2>&1; do
    sleep 1
done

echo "✅ PostgreSQL is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done

echo "✅ Redis is ready"

# Run database migrations and seed
echo "📊 Running database migrations and seeding..."
docker-compose exec -T postgres psql -U sentinel -d serversentinel -f /docker-entrypoint-initdb.d/01-schema.sql
docker-compose exec -T postgres psql -U sentinel -d serversentinel -f /docker-entrypoint-initdb.d/02-triggers.sql
docker-compose exec -T postgres psql -U sentinel -d serversentinel -f /docker-entrypoint-initdb.d/03-seed.sql

echo "✅ Database seeded successfully"

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check service health
echo "🏥 Checking service health..."

# Check API
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
fi

# Check Client
if curl -f http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Client is healthy"
else
    echo "❌ Client health check failed"
fi

echo ""
echo "✨ ServerSentinel is running!"
echo "================================"
echo "📱 Web UI: http://localhost:5173"
echo "🔌 API: http://localhost:3000"
echo "📊 Grafana: http://localhost:3001 (admin/admin)"
echo "📈 Prometheus: http://localhost:9091"
echo ""
echo "🔑 Test Credentials:"
echo "   Email: admin@serversentinel.io"
echo "   Password: password123"
echo ""
echo "📝 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo ""
