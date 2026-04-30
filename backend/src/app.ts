import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes/index';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';
import { env } from './utils/env';

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  ...(env.FRONTEND_URL ? env.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean) : []),
  'http://localhost:5173',
  'https://veltrix-airdrop.vercel.app'
];
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://challenges.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://challenges.cloudflare.com"],
      frameSrc: ["'self'", "https://challenges.cloudflare.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(globalLimiter);

app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.info(`${req.method} ${req.originalUrl} ${req.ip}`);
  }
  next();
});

app.use('/api', router);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
