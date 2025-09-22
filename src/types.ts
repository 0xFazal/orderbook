export type Side = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';

export interface OrderRow {
  id: string;
  symbol: string;
  side: Side;
  type: OrderType;
  price?: string;
  quantity: string;
  remaining: string;
  status: string;
  created_at?: string;
}

export interface TradeRow {
  id: string;
  symbol: string;
  buy_order_id: string;
  sell_order_id: string;
  price: string;
  quantity: string;
  created_at?: string;
}

export interface IncomingOrder {
  id: string;
  symbol: string;
  side: Side;
  type: OrderType;
  price?: string;
  quantity: string;
}
