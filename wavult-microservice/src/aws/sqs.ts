import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { config } from '../config';
import { logger } from '../logger';

export const sqs = new SQSClient({ region: config.AWS_REGION });

export async function sendSqsMessage(body: unknown, attributes?: Record<string, string>): Promise<string | undefined> {
  if (!config.AWS_SQS_QUEUE_URL) {
    logger.warn('AWS_SQS_QUEUE_URL not configured, skipping send');
    return undefined;
  }
  const resp = await sqs.send(
    new SendMessageCommand({
      QueueUrl: config.AWS_SQS_QUEUE_URL,
      MessageBody: JSON.stringify(body),
      MessageAttributes: attributes
        ? Object.fromEntries(
            Object.entries(attributes).map(([k, v]) => [k, { DataType: 'String', StringValue: v }]),
          )
        : undefined,
    }),
  );
  return resp.MessageId;
}
