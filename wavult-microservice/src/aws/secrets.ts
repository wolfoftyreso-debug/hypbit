import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { config } from '../config';
import { logger } from '../logger';

const client = new SecretsManagerClient({ region: config.AWS_REGION });

export async function loadSecret<T = Record<string, string>>(secretId?: string): Promise<T | null> {
  const id = secretId ?? config.AWS_SECRETS_MANAGER_ID;
  if (!id) return null;
  try {
    const resp = await client.send(new GetSecretValueCommand({ SecretId: id }));
    if (!resp.SecretString) return null;
    return JSON.parse(resp.SecretString) as T;
  } catch (err) {
    logger.error({ err, id }, 'Failed to load secret');
    return null;
  }
}
