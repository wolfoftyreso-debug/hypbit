import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { config } from '../config';
import { logger } from '../logger';

export const s3 = new S3Client({ region: config.AWS_REGION });

export async function putObject(key: string, body: Buffer | string, contentType = 'application/json'): Promise<void> {
  if (!config.AWS_S3_BUCKET) {
    logger.warn('AWS_S3_BUCKET not configured, skipping putObject');
    return;
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: config.AWS_S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ServerSideEncryption: 'AES256',
    }),
  );
}

export async function getObject(key: string): Promise<string | null> {
  if (!config.AWS_S3_BUCKET) return null;
  const resp = await s3.send(new GetObjectCommand({ Bucket: config.AWS_S3_BUCKET, Key: key }));
  return (await resp.Body?.transformToString()) ?? null;
}
