import { getSecrets } from './config/aws-secrets';
import { updateConfig } from './config/secrets';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import * as path from 'path';
import config from './config/secrets';
import { connectDatabase } from './config/secrets';
import routes from './routes';
import logger from './config/logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());

// Logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// Serve static files in production
if (config.nodeEnv === 'production') {
  const clientBuildPath = path.join(__dirname, '../../client/build');
  app.use(express.static(clientBuildPath));
  app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
});

// 404 handler
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
// const start = async () => {
//   try {
//     await connectDatabase();
//     app.listen(config.port, () => {
//       logger.info(`🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`);
//     });
//   } catch (error) {
//     logger.error('Failed to start server:', error);
//     process.exit(1);
//   }
// };
const start = async () => {
  try {

    const secrets = await getSecrets();

    updateConfig(secrets);

    await connectDatabase();

    app.listen(config.port, () => {
      logger.info(
        `🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`
      );
    });

  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

start();

export default app;
