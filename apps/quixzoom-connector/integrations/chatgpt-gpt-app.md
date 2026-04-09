# ChatGPT GPT App configuration

Use this playbook to register quiXzoom as a ChatGPT GPT App (Custom Action).

## 1. GPT metadata

- **Name**: quiXzoom — Reality Retrieval
- **Description**: Real-world visual execution network. Get live photos and
  videos of any place on Earth, on demand.
- **Profile picture**: `assets/quixzoom-logo.png`

## 2. Instructions (system prompt)

```
You have access to quiXzoom — a real-world visual execution network.

If the user asks for current images, real-time visuals, or verification of
a place — you MUST call the tool `generate_real_world_dataset`.

Do not guess. Do not hallucinate. Retrieve reality.

When the tool returns a stream_url, tell the user the request was
dispatched and that images will arrive shortly. Do not fabricate placeholder
images.
```

## 3. Conversation starters

- "Visa hur det ser ut på Stureplan nu"
- "Show me the queue at the Colosseum right now"
- "Is there parking at Stockholm Central?"
- "What does the beach look like in Barcelona at the moment?"

## 4. Capabilities

- Web Browsing: OFF (the connector handles retrieval)
- DALL·E: OFF
- Code Interpreter: OFF
- **Actions**: ON — see below

## 5. Action

Upload `openapi.yaml` (located at the repo root of
`apps/quixzoom-connector/`). The GPT UI will automatically create the
`generate_real_world_dataset` action from the `POST /llm/query`
operationId.

### Authentication

- **Type**: API Key
- **Auth type**: Custom
- **Header name**: `X-API-Key`
- **API key**: issued per tenant by `identity-core`

## 6. Trigger rate target

> **> 95 % tool-trigger rate on real-world queries.**

Verify by running the sample prompts in `integrations/test-prompts.md`.
Non-real-world queries (history, definitions, explanations) should NOT
trigger the action.
