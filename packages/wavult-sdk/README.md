# @wavult/sdk

Internal SDK for all Wavult Group applications.

## Rule: ALL apps must use this SDK. Never call APIs directly.

## Install
```bash
npm install @wavult/sdk
```

## Usage
```typescript
import { createWavult } from '@wavult/sdk'

const wavult = createWavult({
  apiUrl: import.meta.env.VITE_API_URL,
  token: userToken,
  project: 'quixzoom',
})

// Auth
const user = await wavult.auth.getUser()

// Database (never direct!)
const orders = await wavult.db.from({ table: 'orders', where: { status: 'active' } })

// Images
const img = await wavult.images.generate({ prompt: 'A zoomer in Stockholm', quality: 'hd' })

// Storage
const { url } = await wavult.storage.upload(file, { path: 'uploads/photo.jpg' })

// Messaging
await wavult.messaging.sendSms('+46709123223', 'Hello from Wavult')
```

## Modules

| Module | Description |
|--------|-------------|
| `auth` | Login, logout, getUser, validatePassword |
| `db` | query, from, insert, update, delete — always via wavult-core API |
| `images` | generate, batch — OpenAI DALL-E via wavult-core |
| `storage` | upload, getUrl — S3 via wavult-core |
| `messaging` | sendSms, sendEmail — 46elks + SMTP via wavult-core |

## Constraints / Guardrails
```typescript
import { WAVULT_CONSTRAINTS } from '@wavult/sdk'

const issues = WAVULT_CONSTRAINTS.scan(sourceCode)
// Returns array of { rule, severity, match }
```

## Design Tokens
```typescript
import { WAVULT_CONSTRAINTS } from '@wavult/sdk'

const { bg, navy, gold, fonts } = WAVULT_CONSTRAINTS.DESIGN_TOKENS
// bg: '#F5F0E8', navy: '#0A3D62', gold: '#E8B84B'
```
