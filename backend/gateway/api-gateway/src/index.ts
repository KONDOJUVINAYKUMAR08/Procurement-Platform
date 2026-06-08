import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

import { logger, connectDatabase, getSecrets, updateConfig, config } from '@procurement/common';
import identityRoutes from '@procurement/identity-service';
import procurementRoutes from '@procurement/procurement-service';
import financeRoutes from '@procurement/finance-service';
import documentRoutes from '@procurement/document-service';

import dashboardController from './controllers/dashboard.controller';
import reportController from './controllers/report.controller';
import { authenticate, authorize } from '@procurement/middleware';
import { ROLES } from '@procurement/types';

export const app: import('express').Express = express();

export const bootstrapApp = async (): Promise<import('express').Express> => {
  try {
    if (process.env.NODE_ENV === 'production') {
      try {
        const secrets = await getSecrets();
        updateConfig(secrets);
        logger.info('Successfully loaded secrets from AWS Secrets Manager');
      } catch (err) {
        logger.error('Failed to load secrets, falling back to environment variables', err);
      }
    }

    await connectDatabase();

    app.use(helmet());
    app.use(compression());
    app.use(cookieParser());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    app.use(
      cors({
        origin: config.corsOrigin,
        credentials: true,
      })
    );

    app.use(
      morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
      })
    );

    // API Routes
    const apiRouter = express.Router();
    
    // Gateway Aggregation Routes
    apiRouter.get('/dashboard', authenticate, dashboardController.getStats);
    
    apiRouter.get('/reports/vendors', authenticate, authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE, ROLES.AUDITOR), reportController.vendorReport);
    apiRouter.get('/reports/procurement', authenticate, authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE, ROLES.AUDITOR), reportController.procurementReport);
    apiRouter.get('/reports/invoices', authenticate, authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE, ROLES.AUDITOR), reportController.invoiceReport);
    apiRouter.get('/reports/contracts', authenticate, authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER, ROLES.FINANCE, ROLES.AUDITOR), reportController.contractReport);

    // Service Routes
    apiRouter.use(identityRoutes);
    apiRouter.use(procurementRoutes);
    apiRouter.use(financeRoutes);
    apiRouter.use(documentRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'ok', service: 'api-gateway', timestamp: new Date() });
    });

    app.use('/api', apiRouter);

    // Static files in production
    if (process.env.NODE_ENV === 'production') {
      const clientPath = path.join(__dirname, '../../../frontend/build');
      app.use(express.static(clientPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(clientPath, 'index.html'));
      });
    }

    // Error handling
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error(`Error processing request ${req.method} ${req.path}`, err);
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      });
    });

    return app;
  } catch (error) {
    logger.error('Failed to bootstrap API Gateway', error);
    throw error;
  }
}

// If run directly (not via Lambda), start the server
if (require.main === module) {
  bootstrapApp().then(initializedApp => {
    initializedApp.listen(config.port, () => {
      logger.info(`🚀 API Gateway running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  }).catch(() => process.exit(1));
}
