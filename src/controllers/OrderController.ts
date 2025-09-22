import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { DB } from '../db';
import { OrderModel } from '../models/OrderModel';
import { MatchingEngine } from '../services/MatchingEngine';
import { Side, OrderType } from '../types';

export class OrderController {
  static validateBody(body: any) {
    if (!body) return 'Missing body';

    if (!body.symbol || typeof body.symbol !== 'string') {
      return 'Missing or invalid symbol';
    }

    if (typeof body.quantity === 'undefined') return 'Missing quantity';
    const quantity = Number(body.quantity);
    if (!isFinite(quantity) || quantity <= 0) return 'Invalid quantity';

    const type: OrderType = body.type || 'limit';
    if (!['limit', 'market'].includes(type)) return 'Invalid order type';

    if (type === 'limit') {
      if (typeof body.price === 'undefined') return 'Missing price for limit order';
      const price = Number(body.price);
      if (!isFinite(price) || price <= 0) return 'Invalid price';
    }

    return null;
  }

  static async place(side: Side, req: Request, res: Response) {
    const validation = OrderController.validateBody(req.body);
    if (validation) return res.status(400).json({ error: validation });

    const id = uuidv4();
    const symbol: string = req.body.symbol;
    const type: OrderType = req.body.type || 'limit';
    const price = type === 'limit' ? Number(req.body.price).toString() : undefined;
    const quantity = Number(req.body.quantity).toString();

    try {
      await DB.withClient(async (client) => {
        await client.query('BEGIN');
        try {
          await OrderModel.insert({ id, symbol, side, type, price, quantity });
          const trades = await MatchingEngine.match(client, { id, symbol, side, type, price, quantity });
          const order = await OrderModel.findById(id);
          await client.query('COMMIT');
          return res.status(201).json({ order, trades });
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

  static async getOrderbook(req: Request, res: Response) {
    try {
      const symbol = req.query.symbol as string;
      if (!symbol) return res.status(400).json({ error: 'Missing symbol' });

      const snapshot = await OrderModel.getOrderbookSnapshot(symbol);
      return res.json({ symbol, ...snapshot });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }

}
