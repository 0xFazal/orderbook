import { DB } from '../db';
import { OrderRow, Side, OrderType } from '../types';

export class OrderModel {
  static async insert(order: { id: string; side: Side; type: OrderType; price?: string; quantity: string; }) {
    const sql = `INSERT INTO orders (id, side, type, price, quantity, remaining, status) 
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`;
    const params = [order.id, order.side, order.type, order.price ?? null, order.quantity, order.quantity, 'open'];
    await DB.withClient(async (client) => client.query(sql, params));
    return this.findById(order.id);
  }

  static async findById(id: string): Promise<OrderRow | null> {
    return DB.withClient(async (client) => {
      const res = await client.query('SELECT * FROM orders WHERE id=$1', [id]);
      return res.rows[0] || null;
    }) as Promise<OrderRow | null>;
  }

  static async updateRemainingAndStatus(client: any, id: string, remaining: string, status: string) {
    await client.query('UPDATE orders SET remaining=$1, status=$2 WHERE id=$3', [remaining, status, id]);
  }

  static async getOrderbookSnapshot() {
    return DB.withClient(async (client) => {
      const buys = (await client.query(`
        SELECT price, SUM(remaining::numeric) as quantity 
        FROM orders 
        WHERE side='buy' AND remaining::numeric>0 AND type='limit'
        GROUP BY price 
        ORDER BY price::numeric DESC
      `)).rows;

      const sells = (await client.query(`
        SELECT price, SUM(remaining::numeric) as quantity 
        FROM orders 
        WHERE side='sell' AND remaining::numeric>0 AND type='limit'
        GROUP BY price 
        ORDER BY price::numeric ASC
      `)).rows;

      return { buys, sells };
    });
  }
}
