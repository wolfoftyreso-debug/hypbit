// NVIDIA NV-EmbedQA — semantisk sökning
// Används för: Bernt söker i kunskapsbasen, dokumentsök, RAG

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nvidia/nv-embedqa-e5-v5',
      input: [text],
      input_type: 'query',
      truncate: 'END',
    }),
  })
  const d = (await res.json()) as { data?: Array<{ embedding: number[] }> }
  return d.data?.[0]?.embedding || []
}

export async function embedDocument(text: string): Promise<number[]> {
  const res = await fetch('https://integrate.api.nvidia.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'nvidia/nv-embedqa-e5-v5',
      input: [text],
      input_type: 'passage',
      truncate: 'END',
    }),
  })
  const d = (await res.json()) as { data?: Array<{ embedding: number[] }> }
  return d.data?.[0]?.embedding || []
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0))
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0))
  return dot / (magA * magB)
}

// GET /api/nvidia/embed-test
export async function testEmbedding(): Promise<{ ok: boolean; dims: number }> {
  const emb = await embedText('test query')
  return { ok: emb.length > 0, dims: emb.length }
}
