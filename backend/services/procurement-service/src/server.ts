import express from 'express';
import cors from 'cors';
import { logger, connectDatabase, getSecrets, updateConfig, config } from '@procurement/common';
import routes from './index';

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

    app.use(express.json());
    app.use(cors());

    app.use('/api', routes);

    app.get('/api/health', (req, res) => {
      res.status(200).json({ status: 'ok', service: 'procurement-service', timestamp: new Date() });
    });

    return app;
  } catch (error) {
    logger.error('Failed to bootstrap procurement service', error);
    throw error;
  }
};

if (require.main === module) {
  bootstrapApp().then(initializedApp => {
    const port = process.env.PORT || 5003;
    initializedApp.listen(port, () => {
      logger.info(`🚀 Procurement Service running on port ${port} in ${config.nodeEnv} mode`);
    });
  }).catch(() => process.exit(1));
}
