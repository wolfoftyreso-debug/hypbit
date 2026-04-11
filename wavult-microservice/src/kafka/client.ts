import { Kafka, logLevel, SASLOptions } from 'kafkajs';
import { config } from '../config';
import { logger } from '../logger';

function buildSasl(): SASLOptions | undefined {
  if (
    !config.KAFKA_SASL_MECHANISM ||
    config.KAFKA_SASL_MECHANISM === '' ||
    !config.KAFKA_SASL_USERNAME ||
    !config.KAFKA_SASL_PASSWORD
  ) {
    return undefined;
  }
  return {
    mechanism: config.KAFKA_SASL_MECHANISM,
    username: config.KAFKA_SASL_USERNAME,
    password: config.KAFKA_SASL_PASSWORD,
  } as SASLOptions;
}

export const kafka = new Kafka({
  clientId: config.KAFKA_CLIENT_ID,
  brokers: config.KAFKA_BROKERS,
  ssl: config.KAFKA_SSL,
  sasl: buildSasl(),
  connectionTimeout: 5_000,
  requestTimeout: 30_000,
  retry: {
    initialRetryTime: 300,
    retries: 8,
  },
  logLevel: logLevel.WARN,
  logCreator:
    () =>
    ({ log }) => {
      logger.debug({ ...log }, 'kafka');
    },
});
