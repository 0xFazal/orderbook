import { DB } from '../db';
import { TradeRow } from '../types';

export class TradeModel {
  static async insert(
    client: any,
    trade: { id: string; symbol: string; buy_order_id: string; sell_order_id: string; price: string; quantity: string }
  ) {
    const sql = `
      INSERT INTO trades (id, symbol, buy_order_id, sell_order_id, price, quantity) 
      VALUES ($1,$2,$3,$4,$5,$6)
    `;
    await client.query(sql, [
      trade.id,
      trade.symbol,
      trade.buy_order_id,
      trade.sell_order_id,
      trade.price,
      trade.quantity
    ]);
  }

  static async recent(symbol: string, limit = 100) {
    return DB.withClient(async (client) => {
      const res = await client.query(
        `SELECT * FROM trades WHERE symbol=$1 ORDER BY created_at DESC LIMIT $2`,
        [symbol, limit]
      );
      return res.rows as TradeRow[];
    });
  }
}
