// ─── Kafka Admin — Topic provisioning ────────────────────────────────────────
// Run once on startup to ensure all topics exist.

import { kafka } from './client'
import { TOPICS, TOPIC_CONFIG, TopicName } from './topics'

export async function ensureTopics(): Promise<void> {
  const admin = kafka.admin()
  await admin.connect()

  try {
    const existing = await admin.listTopics()
    const toCreate = Object.values(TOPICS).filter(
      (topic) => !existing.includes(topic)
    )

    if (toCreate.length === 0) {
      console.log('[kafka] All topics exist')
      return
    }

    await admin.createTopics({
      waitForLeaders: true,
      topics: toCreate.map((topic) => ({
        topic,
        ...TOPIC_CONFIG[topic as TopicName],
        configEntries: [
          { name: 'retention.ms', value: String(7 * 24 * 60 * 60 * 1000) }, // 7 days
          { name: 'compression.type', value: 'lz4' },
        ],
      })),
    })

    console.log(`[kafka] Created topics: ${toCreate.join(', ')}`)
  } finally {
    await admin.disconnect()
  }
}
