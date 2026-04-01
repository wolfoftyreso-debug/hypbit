// ─── Kafka Client — Wavult Event Backbone ────────────────────────────────────
// Singleton Kafka connection. All producers/consumers import from here.

import { Kafka, logLevel } from 'kafkajs'

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'kafka.wavult.local:9092').split(',')
const CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'wavult-api-core'

export const kafka = new Kafka({
  clientId: CLIENT_ID,
  brokers: KAFKA_BROKERS,
  logLevel: process.env.NODE_ENV === 'production' ? logLevel.ERROR : logLevel.WARN,
  retry: {
    initialRetryTime: 300,
    retries: 5,
  },
})
