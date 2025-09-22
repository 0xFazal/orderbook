import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import orderRoutes from './routes/orderRoutes';
import tradeRoutes from './routes/tradeRoutes';

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.use('/orders', orderRoutes);
app.use('/trades', tradeRoutes);

app.get('/', (_req, res) => res.send('Orderbook Service running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));