import { v4 as uuidv4 } from 'uuid';
import { OrderModel } from '../models/OrderModel';
import { TradeModel } from '../models/TradeModel';
import { IncomingOrder } from '../types';

export class MatchingEngine {
  static async match(client: any, order: IncomingOrder) {
    const opposite = order.side === 'buy' ? 'sell' : 'buy';

    let candidatesSql: string;
    let params: any[];

    if (order.type === 'limit') {
      if (order.side === 'buy') {
        candidatesSql = `
          SELECT * FROM orders 
          WHERE symbol = $1 AND side = $2 AND status != 'filled' AND price <= $3 
          ORDER BY price::numeric ASC, created_at ASC
          FOR UPDATE
        `;
        params = [order.symbol, opposite, order.price];
      } else {
        candidatesSql = `
          SELECT * FROM orders 
          WHERE symbol = $1 AND side = $2 AND status != 'filled' AND price >= $3 
          ORDER BY price::numeric DESC, created_at ASC
          FOR UPDATE
        `;
        params = [order.symbol, opposite, order.price];
      }
    } else { 
      if (order.side === 'buy') {
        candidatesSql = `
          SELECT * FROM orders
          WHERE symbol = $1 AND side = $2 AND status != 'filled'
          ORDER BY price::numeric ASC, created_at ASC
          FOR UPDATE
        `;
        params = [order.symbol, opposite];
      } else {
        candidatesSql = `
          SELECT * FROM orders
          WHERE symbol = $1 AND side = $2 AND status != 'filled'
          ORDER BY price::numeric DESC, created_at ASC
          FOR UPDATE
        `;
        params = [order.symbol, opposite];
      }
    }

    const candidates = (await client.query(candidatesSql, params)).rows;

    let ordersRemaining = Number(order.quantity);
    const tradesCreated: any[] = [];

    for (const m of candidates) {
      if (ordersRemaining <= 0) break;
      const makerRemaining = Number(m.remaining);
      if (makerRemaining <= 0) continue;

      const tradeQty = Math.min(makerRemaining, ordersRemaining);
      const tradePrice = Number(m.price); // maker price

      const tradeId = uuidv4();
      const buyOrderId = order.side === 'buy' ? order.id : m.id;
      const sellOrderId = order.side === 'sell' ? order.id : m.id;

      await TradeModel.insert(client, {
        id: tradeId,
        symbol: order.symbol,
        buy_order_id: buyOrderId,
        sell_order_id: sellOrderId,
        price: tradePrice.toString(),
        quantity: tradeQty.toString()
      });

      const newMakerRemaining = (makerRemaining - tradeQty).toString();
      const makerStatus = Number(newMakerRemaining) === 0 ? 'filled' : 'partial';
      await OrderModel.updateRemainingAndStatus(client, m.id, newMakerRemaining, makerStatus);

      ordersRemaining -= tradeQty;
      tradesCreated.push({
        id: tradeId,
        symbol: order.symbol,
        buy_order_id: buyOrderId,
        sell_order_id: sellOrderId,
        price: tradePrice.toString(),
        quantity: tradeQty.toString()
      });
    }

    const newTakerRemaining = ordersRemaining.toString();
    const takerStatus = Number(newTakerRemaining) === 0
      ? 'filled'
      : (Number(newTakerRemaining) === Number(order.quantity) ? 'open' : 'partial');
    await OrderModel.updateRemainingAndStatus(client, order.id, newTakerRemaining, takerStatus);

    return tradesCreated;
  }
}
