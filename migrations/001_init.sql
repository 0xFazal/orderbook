-- migrations history table for idempotence
CREATE TABLE IF NOT EXISTS schema_migrations (
  id VARCHAR(255) PRIMARY KEY,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  symbol VARCHAR(32) NOT NULL, -- NEW: market symbol, e.g., BTC-USD
  side VARCHAR(4) NOT NULL CHECK (side IN ('buy','sell')),
  type VARCHAR(10) NOT NULL DEFAULT 'limit' CHECK (type IN ('limit','market')), 
  price NUMERIC CHECK (price > 0),  
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  remaining NUMERIC NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- trades table
CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY,
  symbol VARCHAR(32) NOT NULL, -- NEW: same as matched orders
  buy_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  sell_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  quantity NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- index to help matching queries (partition by symbol!)
CREATE INDEX IF NOT EXISTS idx_orders_symbol_side_price_created 
  ON orders(symbol, side, price, created_at) 
  WHERE status != 'filled';
