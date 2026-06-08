import AWS from 'aws-sdk';

const secretsManager = new AWS.SecretsManager({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function getSecrets(): Promise<Record<string, string>> {
  const secret = await secretsManager
    .getSecretValue({
      SecretId: process.env.SECRET_NAME || 'procureflow/prod',
    })
    .promise();

  if (!secret.SecretString) {
    throw new Error('SecretString is empty');
  }

  return JSON.parse(secret.SecretString);
}
