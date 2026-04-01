// NVIDIA Cosmos / Llama-Vision — visuell intelligens för LandveX
// Analyserar infrastrukturbilder och returnerar strukturerade observationer

export interface VisionAnalysis {
  observations: string[]
  anomalies: string[]
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  raw: string
}

export async function analyzeInfrastructureImage(
  imageUrl: string,
  context?: string
): Promise<VisionAnalysis> {
  const systemPrompt = `You are an infrastructure inspection AI for LandveX.
Analyze images of roads, bridges, buildings, and public spaces.
Look for: cracks, damage, flooding, illegal dumping, vandalism, structural issues.
Return a JSON object with: observations[], anomalies[], severity (none/low/medium/high/critical), confidence (0-1).`

  const userPrompt = context
    ? `Analyze this infrastructure image. Context: ${context}`
    : 'Analyze this infrastructure image for anomalies, damage, or issues.'

  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-11b-vision-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: systemPrompt + '\n\n' + userPrompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    })

    const d = (await res.json()) as { choices?: Array<{ message: { content: string } }> }
    const raw = d.choices?.[0]?.message?.content || '{}'

    try {
      const parsed = JSON.parse(raw) as {
        observations?: string[]
        anomalies?: string[]
        severity?: VisionAnalysis['severity']
        confidence?: number
      }
      return {
        observations: parsed.observations || [],
        anomalies: parsed.anomalies || [],
        severity: parsed.severity || 'none',
        confidence: parsed.confidence || 0.5,
        raw,
      }
    } catch {
      return { observations: [raw], anomalies: [], severity: 'low', confidence: 0.3, raw }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[vision] analyzeInfrastructureImage error:', msg)
    return { observations: [], anomalies: [], severity: 'none', confidence: 0, raw: '' }
  }
}

// GET /api/nvidia/vision-test
export async function testVision(): Promise<{ ok: boolean }> {
  const result = await analyzeInfrastructureImage(
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg',
    'test'
  )
  return { ok: result.confidence > 0 }
}
