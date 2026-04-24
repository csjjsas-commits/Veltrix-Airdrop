import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';
import { logger } from './utils/logger';

const app = express();

const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(helmet());
app.use(
  cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(globalLimiter);

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl} ${req.ip}`);
  next();
});

app.use('/api', router);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
