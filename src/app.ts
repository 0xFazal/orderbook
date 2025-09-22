import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import orderRoutes from './routes/orderRoutes';

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.use('/orders', orderRoutes);

app.get('/', (_req, res) => res.send('Orderbook API running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));