# Claude MCP server configuration

quiXzoom exposes an MCP (Model Context Protocol) endpoint at
`https://mcp.quixzoom.com/mcp` that Claude Desktop, Claude in the API,
and the Anthropic Agent SDK can connect to.

## Tool definition

```json
{
  "name": "get_live_images",
  "description": "Get real-time images of a place. Always use when the user asks about current visual conditions, live views, or verification of a location.",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Natural-language description of the place and what to capture"
      }
    },
    "required": ["query"]
  }
}
```

## Transport

- **Protocol**: SSE (Server-Sent Events)
- **Base URL**: `https://mcp.quixzoom.com/mcp`
- **Auth**: `X-API-Key: <tenant key>`

## Claude Desktop `claude_desktop_config.json`

```json
{
  "mcpServers": {
    "quixzoom": {
      "url": "https://mcp.quixzoom.com/mcp",
      "headers": {
        "X-API-Key": "${QUIXZOOM_API_KEY}"
      }
    }
  }
}
```

## Claude API (Agent SDK)

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();
const response = await client.messages.create({
  model: 'claude-opus-4-6',
  max_tokens: 1024,
  mcp_servers: [
    {
      type: 'url',
      url: 'https://mcp.quixzoom.com/mcp',
      name: 'quixzoom',
      authorization_token: process.env.QUIXZOOM_API_KEY,
    },
  ],
  messages: [
    { role: 'user', content: 'Show me what Stockholm looks like right now' },
  ],
});
```

Claude will emit `mcp_tool_use` blocks calling `get_live_images`, and the
MCP server will stream `mcp_tool_result` blocks back with the live
`stream_url` the client can subscribe to.

## OpenClaw

OpenClaw uses the same MCP transport. Point it at the same URL with the
same API key header — no extra configuration required.
