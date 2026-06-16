import * as dynamoose from 'dynamoose';
import { AppConfig } from '@procurement/types';
import { getSecrets } from './aws-secrets';

const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement', // Keeping mongoUri string to avoid breaking types interface for now
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-jwt-refresh-secret-change-in-production',
  jwtExpiry: process.env.JWT_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'procurement-documents-08',
    kmsKeyId: process.env.AWS_KMS_KEY_ID || '',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@procurement-platform.com',
  },
};

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('=== DYNAMODB STARTUP CONFIGURATION ===');
    console.log(`  NODE_ENV: ${config.nodeEnv}`);
    console.log(`  AWS Region: ${config.aws.region}`);

    // 1. Fetch configurations from AWS Secrets Manager
    try {
      const secretId = process.env.AWS_SECRET_NAME || 'procurement/prod/app-config';
      console.log(`  [INFO] Retrieving configuration from AWS Secrets Manager: ${secretId}`);
      const secrets = await getSecrets();
      updateConfig(secrets);
      console.log('  [INFO] Successfully loaded and applied configuration from AWS Secrets Manager');
    } catch (err: any) {
      console.warn('  [WARNING] Could not load secrets from AWS Secrets Manager, falling back to env variables:', err.message);
    }

    console.log(`  Target S3 Bucket: ${config.aws.s3Bucket}`);
    console.log(`  Target KMS Key: ${config.aws.kmsKeyId || 'Not configured'}`);


    // 3. Connect to AWS DynamoDB
    const ddb = new dynamoose.aws.ddb.DynamoDB({
      region: config.aws.region,
    });
    dynamoose.aws.ddb.set(ddb);
    console.log(`=== DYNAMODB: Connected directly to AWS DynamoDB (Region: ${config.aws.region}) ===`);
    console.log('======================================');
  } catch (error) {
    console.error('DynamoDB connection error during startup diagnostics:', error);
    process.exit(1);
  }
};

export const updateConfig = (secrets: Record<string, string>) => {
  if (secrets.MONGODB_URI) config.mongoUri = secrets.MONGODB_URI;
  if (secrets.JWT_SECRET) config.jwtSecret = secrets.JWT_SECRET;
  if (secrets.JWT_REFRESH_SECRET) config.jwtRefreshSecret = secrets.JWT_REFRESH_SECRET;
  if (secrets.AWS_REGION) config.aws.region = secrets.AWS_REGION;
  if (secrets.AWS_S3_BUCKET) config.aws.s3Bucket = secrets.AWS_S3_BUCKET;
  if (secrets.AWS_KMS_KEY_ID) config.aws.kmsKeyId = secrets.AWS_KMS_KEY_ID;
};

export default config;
