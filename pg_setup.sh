#!/bin/bash

# Setup PostgreSQL container for orderbook application
echo "Starting PostgreSQL container for orderbook..."

docker run -d \
  --name orderbook_postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=orderbook \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:15

# Check if container started successfully
if [ $? -eq 0 ]; then
    echo "PostgreSQL container 'orderbook_postgres' started successfully!"
    echo "Database: orderbook"
    echo "Port: 5432"
    echo "Username: postgres"
    echo "Password: postgres"
    echo ""
    echo "To connect: psql -h localhost -p 5432 -U postgres -d orderbook"
else
    echo "Failed to start PostgreSQL container"
    exit 1
fi