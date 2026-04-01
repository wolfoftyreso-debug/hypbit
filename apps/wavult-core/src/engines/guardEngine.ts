// NVIDIA NemoGuard — skyddar Bernt mot manipulation och jailbreak

export async function checkSafety(userMessage: string): Promise<{
  safe: boolean
  reason?: string
}> {
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'nvidia/llama-3.1-nemotron-safety-guard-8b-v3',
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: 50,
      }),
    })
    const d = (await res.json()) as { choices?: Array<{ message: { content: string } }> }
    const result = d.choices?.[0]?.message?.content?.toLowerCase() || ''
    const safe = !result.includes('unsafe') && !result.includes('blocked')
    return { safe, reason: safe ? undefined : result }
  } catch {
    return { safe: true } // fail open i fallback
  }
}
