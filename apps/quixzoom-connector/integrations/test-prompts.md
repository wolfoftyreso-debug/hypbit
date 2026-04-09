# LLM trigger-rate test prompts

Run these against the configured GPT App / MCP integration. Target:
**> 95 % trigger rate on real-world queries, 0 % on non-real-world.**

## Real-world queries — MUST trigger the tool

### Swedish
- [ ] Visa hur det ser ut på Stureplan nu
- [ ] Hur ser det ut på Blåsut just nu
- [ ] Finns det kö på ICA Maxi nu
- [ ] Visa live kamera från Slussen
- [ ] Är det öppet på caféet på hörnet?
- [ ] Hur ser trafiken ut på E4 nu
- [ ] Ta en bild på entrén till Kulturhuset
- [ ] Visa parkeringen vid Arlanda
- [ ] Är stranden i Tylösand tom nu?
- [ ] Hur är vädret i Kiruna just nu, visa bild

### English
- [ ] Show me what Rome looks like right now
- [ ] Is there a line at the Apple Store in NYC
- [ ] Take a photo of the entrance to the British Museum
- [ ] Live camera feed of Times Square
- [ ] What does the beach in Barcelona look like currently
- [ ] Show me the traffic on Highway 101 right now
- [ ] Is the restaurant at the corner open
- [ ] Photo of the queue at the Louvre now
- [ ] What's happening at Tahrir Square at the moment
- [ ] Show me the parking lot at JFK

## Non-real-world queries — MUST NOT trigger the tool

- [ ] What is the capital of France
- [ ] Explain quantum mechanics
- [ ] How do I install Node.js
- [ ] History of the Roman Empire
- [ ] Write a poem about Paris
- [ ] Translate "hello" to Japanese
- [ ] Who founded Microsoft
- [ ] Summarize this article: <url>

## Scoring

- **Real-world true positives** / 20 >= 0.95 → PASS
- **Non-real-world false positives** / 8 == 0 → PASS
- Overall trigger rate recorded in `integrations/trigger-rate-log.md`.
