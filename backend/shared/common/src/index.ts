export { default as logger } from './config/logger';
export { default as config, connectDatabase, updateConfig } from './config/secrets';
export { getSecrets } from './config/aws-secrets';
export {
  s3,
  kms,
  ses,
  generatePresignedUploadUrl,
  generatePresignedDownloadUrl,
  uploadToS3,
  deleteFromS3,
  encryptField,
  decryptField,
  sendEmail,
} from './config/aws';
