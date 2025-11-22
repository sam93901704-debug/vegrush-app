import dotenv from 'dotenv';
import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pino from 'pino';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import adminOrderRoutes from './routes/adminOrders';
import adminDeliveryRoutes from './routes/adminDelivery';
import deliveryRoutes from './routes/delivery';
import deliveryOrderRoutes from './routes/deliveryOrders';
import deliverySummaryRoutes from './routes/deliverySummary';
import adminUploadRoutes from './routes/adminUploads';
import userRoutes from './routes/userRoutes';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
});

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  // Vercel preview and production domains
  /^https:\/\/.*\.vercel\.app$/,
  // Add your production domain here
  // 'https://yourdomain.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin matches allowed origins
      const isAllowed = allowedOrigins.some((allowedOrigin) => {
        if (typeof allowedOrigin === 'string') {
          return origin === allowedOrigin;
        }
        // Handle regex patterns
        return allowedOrigin.test(origin);
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// HTTP request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    }, 'HTTP request');
  });
  
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all routes
app.use(limiter);

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/delivery-boys', adminDeliveryRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/delivery/summary', deliverySummaryRoutes); // Delivery summary routes (before orders to avoid route conflicts)
app.use('/api/delivery/orders', deliveryOrderRoutes); // Delivery order routes
app.use('/api/admin/uploads', adminUploadRoutes);
// Also mount admin upload routes at /api/admin for /api/admin/upload-product-image
app.use('/api/admin', adminUploadRoutes);
app.use('/api/user', userRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found.',
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;

// Only start server if this file is run directly (not when imported for tests)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
}

// Export app for testing
export default app;
