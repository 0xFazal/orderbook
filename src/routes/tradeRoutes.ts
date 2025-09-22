import { Router } from 'express';
import { TradeController } from '../controllers/TradeController';

const router = Router();

router.get('/', (req, res) => TradeController.getTrades(req, res));

export default router;