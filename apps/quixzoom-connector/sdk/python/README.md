# quixzoom-connector-client (Python)

Official Python 3.10+ client for the quiXzoom AI Connector. Zero
runtime dependencies — uses only the standard library.

## Install

```bash
pip install quixzoom-connector-client
```

## Quick start

```python
import os
from quixzoom import QuixzoomClient

client = QuixzoomClient(
    base_url="https://mcp.quixzoom.com",
    api_key=os.environ["QUIXZOOM_API_KEY"],
)

result = client.query(
    "Show me Stureplan right now",
    tier="silver",
    priority="high",
    tenant_id="enterprise-acme",
)
print(result["task_id"], result["price"]["total"], "SEK")

for event in client.stream(result["task_id"]):
    if event["event"] == "IMAGE_ADDED":
        print("new image:", event["data"]["url"])
    elif event["event"] == "COMPLETE":
        break
```

## Features

- Type-hinted dataclass-based client (Python 3.10+)
- Automatic `Idempotency-Key` UUID per call
- Optional HMAC signing
- Optional JWT bearer for per-user quotas
- SSE stream reader with optional `Last-Event-ID` resume
- Native stdlib `urllib` — works in environments without pip packages
