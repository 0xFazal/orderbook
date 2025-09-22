# Orderbook REST API

A simple **multi-symbol orderbook API** built with **Node.js + TypeScript + Postgres**, supporting **limit and market orders** with automatic trade matching.

---

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd orderbook
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Postgres

```bash
./pg_setup.sh
```

### 4. Environment variables

Create `.env` in the project root:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/orderbook
PORT=3000
```

### 5. Run migrations

```bash
npm run migrate
```

### 6. Start server

```bash
npm run dev
```

Server will run at `http://localhost:3000`.

---

## API Endpoints

### 1. Place an Order

**POST** `/orders/buy` or `/orders/sell`

**Request body (JSON):**

- **Limit order:**

```json
{
  "symbol": "BTC-USD",
  "side": "buy",
  "type": "limit",
  "price": "100.00",
  "quantity": "5"
}
```

- **Market order:**

```json
{
  "symbol": "BTC-USD",
  "side": "sell",
  "type": "market",
  "quantity": "2"
}
```

**Response:**

```json
{
  "order": {
    "id": "uuid",
    "symbol": "BTC-USD",
    "side": "buy",
    "type": "limit",
    "price": "100.00",
    "quantity": "5",
    "remaining": "5",
    "status": "open",
    "created_at": "timestamp"
  },
  "trades": [
    {
      "id": "uuid",
      "symbol": "BTC-USD",
      "buy_order_id": "uuid",
      "sell_order_id": "uuid",
      "price": "99.50",
      "quantity": "2",
      "created_at": "timestamp"
    }
  ]
}
```

---

### 2. Get Orderbook Snapshot

**GET** `/orders?symbol=BTC-USD`

**Response:**

```json
{
  "symbol": "BTC-USD",
  "buys": [
    { "price": "100", "quantity": "5" },
    { "price": "99", "quantity": "3" }
  ],
  "sells": [
    { "price": "105", "quantity": "2" },
    { "price": "110", "quantity": "4" }
  ]
}
```

> Only **limit orders** appear in the snapshot; market orders are executed immediately.

---

### 3. Get Trade History

**GET** `/orders/trades?symbol=BTC-USD&limit=50`

**Response:**

```json
{
  "symbol": "BTC-USD",
  "trades": [
    {
      "id": "uuid",
      "buy_order_id": "uuid",
      "sell_order_id": "uuid",
      "price": "100",
      "quantity": "2",
      "created_at": "timestamp"
    }
  ]
}
```

- `symbol` is required.  
- `limit` is optional, default `100`.

---

## Matching Engine Logic

- **Symbol-level separation:** orders only match within the same `symbol`.
- **Price-time priority algorithm**:

  1. **Limit Buy**: matches **lowest-price** sell orders where `sellPrice <= buyPrice`.  
  2. **Limit Sell**: matches **highest-price** buy orders where `buyPrice >= sellPrice`.  
  3. **Market orders**: execute immediately against the top-of-book, ignoring price.  

- Partial fills allowed.  
- Transactions and row locks prevent double matching.  
- Trades persist in `trades` table, orders updated with remaining quantity and status (`open`, `partial`, `filled`).  

---

## Database Migrations

- SQL migrations are in `migrations/` (e.g., `001_init.sql`).  
- Run:

```bash
npm run migrate
```

- Tracks applied migrations in `schema_migrations` to prevent duplicates.

---

## Testing

1. Start Postgres and API server.  
2. Use `curl` to:

```bash
# Place limit buy
curl -X POST http://localhost:3000/orders/buy   -H "Content-Type: application/json"   -d '{"symbol":"BTC-USD","side":"buy","type":"limit","price":"100","quantity":"5"}'

# Place market sell
curl -X POST http://localhost:3000/orders/sell   -H "Content-Type: application/json"   -d '{"symbol":"BTC-USD","side":"sell","type":"market","quantity":"2"}'

# Get orderbook
curl http://localhost:3000/orders?symbol=BTC-USD

# Get trades
curl http://localhost:3000/orders/trades?symbol=BTC-USD&limit=50
```