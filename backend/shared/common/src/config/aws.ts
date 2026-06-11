import AWS from 'aws-sdk';
import config from './secrets';

AWS.config.update({
  region: config.aws.region,
});

export const s3 = new AWS.S3();
export const kms = new AWS.KMS();

export const generatePresignedUploadUrl = (
  key: string,
  contentType: string,
  expiresIn: number = 3600
): string => {
  const params = {
    Bucket: config.aws.s3Bucket,
    Key: key,
    Expires: expiresIn,
    ContentType: contentType,
  };
  return s3.getSignedUrl('putObject', params);
};

export const generatePresignedDownloadUrl = (
  key: string,
  expiresIn: number = 3600
): string => {
  const params = {
    Bucket: config.aws.s3Bucket,
    Key: key,
    Expires: expiresIn,
  };
  return s3.getSignedUrl('getObject', params);
};

export const uploadToS3 = async (
  buffer: Buffer,
  key: string,
  mimeType: string
): Promise<string> => {
  const params: AWS.S3.PutObjectRequest = {
    Bucket: config.aws.s3Bucket,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  };

  // Only apply KMS encryption when a key is actually configured
  if (config.aws.kmsKeyId) {
    params.ServerSideEncryption = 'aws:kms';
    params.SSEKMSKeyId = config.aws.kmsKeyId;
  }

  const result = await s3.upload(params).promise();
  return result.Key;
};

export const deleteFromS3 = async (key: string): Promise<void> => {
  const params = {
    Bucket: config.aws.s3Bucket,
    Key: key,
  };
  await s3.deleteObject(params).promise();
};

export const encryptField = async (plaintext: string): Promise<string> => {
  if (!config.aws.kmsKeyId) {
    return Buffer.from(plaintext).toString('base64');
  }
  const params = {
    KeyId: config.aws.kmsKeyId,
    Plaintext: plaintext,
  };
  const result = await kms.encrypt(params).promise();
  return result.CiphertextBlob!.toString('base64');
};

export const decryptField = async (ciphertext: string): Promise<string> => {
  if (!config.aws.kmsKeyId) {
    return Buffer.from(ciphertext, 'base64').toString();
  }
  const params = {
    CiphertextBlob: Buffer.from(ciphertext, 'base64'),
  };
  const result = await kms.decrypt(params).promise();
  return result.Plaintext!.toString();
};
