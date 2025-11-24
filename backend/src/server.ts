import express from 'express';
import cors from 'cors';
import { json, urlencoded } from 'body-parser';

// import your routes
import productRoutes from './routes/productRoutes';
import adminUploads from './routes/adminUploads';
import adminOrders from './routes/adminOrders';
import adminDelivery from './routes/adminDelivery';
import deliveryRoutes from './routes/delivery';
import deliveryOrders from './routes/deliveryOrders';
import userRoutes from './routes/userRoutes';
import orderRoutes from './routes/orders';

// init
const app = express();

app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use(json());
app.use(urlencoded({ extended: true }));

// routes
app.use('/api/products', productRoutes);
app.use('/api/admin/upload-product-image', adminUploads);
app.use('/api/admin/orders', adminOrders);
app.use('/api/admin/delivery', adminDelivery);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/delivery/orders', deliveryOrders);
app.use('/api/user', userRoutes);
app.use('/api/orders', orderRoutes);

// health check
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// PORT FIX FOR RENDER
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
