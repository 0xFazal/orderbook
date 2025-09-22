import { Router } from 'express';
import { OrderController } from '../controllers/OrderController';

const router = Router();

router.post('/buy', (req, res) => OrderController.place('buy', req, res));
router.post('/sell', (req, res) => OrderController.place('sell', req, res));
router.get('/', (req, res) => OrderController.getOrderbook(req, res));

export default router;