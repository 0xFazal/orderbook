import { Request, Response } from 'express';
import { TradeModel } from '../models/TradeModel';


export class TradeController {
  static async getTrades(req: Request, res: Response) {
    try {
      const symbol = req.query.symbol as string;
      if (!symbol) return res.status(400).json({ error: 'Missing symbol' });

      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const trades = await TradeModel.recent(symbol, limit);
      return res.json({ symbol, trades });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'internal error' });
    }
  }
}
