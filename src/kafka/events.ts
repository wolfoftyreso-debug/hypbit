// ─── Kafka Event Schema — Wavult ─────────────────────────────────────────────
// All events MUST have: eventId, eventType, tenantId, organizationId, userId, timestamp

export interface BaseEvent {
  eventId: string          // UUID v4
  eventType: string        // matches topic name
  tenantId: string         // top-level tenant
  organizationId: string   // org within tenant
  userId: string           // actor
  timestamp: string        // ISO-8601
  schemaVersion: '1.0'
}

// ── Missions ─────────────────────────────────────────────────────────────────

export interface MissionCreatedEvent extends BaseEvent {
  eventType: 'wavult.missions.created'
  payload: {
    missionId: string
    title: string
    latitude: number
    longitude: number
    deadline: string
    rewardAmount: number
    currency: string
    requiredCaptures: number
  }
}

export interface MissionUpdatedEvent extends BaseEvent {
  eventType: 'wavult.missions.updated'
  payload: {
    missionId: string
    changes: Record<string, unknown>
  }
}

export interface MissionCompletedEvent extends BaseEvent {
  eventType: 'wavult.missions.completed'
  payload: {
    missionId: string
    completedBy: string
    captureCount: number
    totalPayout: number
    currency: string
  }
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export interface AlertTriggeredEvent extends BaseEvent {
  eventType: 'wavult.alerts.triggered'
  payload: {
    alertId: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    category: string
    locationId: string
    latitude: number
    longitude: number
    description: string
    sourceImageIds: string[]
  }
}

// ── Communications ────────────────────────────────────────────────────────────

export interface CommsSendEvent extends BaseEvent {
  eventType: 'wavult.comms.send'
  payload: {
    channel: 'email' | 'sms' | 'telegram' | 'push'
    to: string | string[]
    subject?: string
    body: string
    templateId?: string
    templateData?: Record<string, unknown>
    priority: 'low' | 'normal' | 'high'
    bcc?: string[]
  }
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserOnboardedEvent extends BaseEvent {
  eventType: 'wavult.users.onboarded'
  payload: {
    profileId: string
    email: string
    role: string
    verificationStatus: 'pending' | 'verified'
  }
}

// ── Payments ──────────────────────────────────────────────────────────────────

export interface PaymentProcessedEvent extends BaseEvent {
  eventType: 'wavult.payments.processed'
  payload: {
    paymentId: string
    amount: number
    currency: string
    provider: string
    reference: string
    recipientId: string
  }
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export interface SystemAuditEvent extends BaseEvent {
  eventType: 'wavult.system.audit'
  payload: {
    action: string
    resource: string
    resourceId: string
    ip?: string
    userAgent?: string
    result: 'success' | 'failure'
    metadata?: Record<string, unknown>
  }
}

export type WavultEvent =
  | MissionCreatedEvent
  | MissionUpdatedEvent
  | MissionCompletedEvent
  | AlertTriggeredEvent
  | CommsSendEvent
  | UserOnboardedEvent
  | PaymentProcessedEvent
  | SystemAuditEvent
