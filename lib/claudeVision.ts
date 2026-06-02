import { ScanResult, ScanError } from './scanTypes'

export async function claudeVision(base64Jpeg: string, apiKey: string): Promise<ScanResult> {
  let response: Response
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system:
          'You are a nutrition analysis assistant. Respond with only a JSON object: { "name": string, "calories": number, "protein": number, "carbs": number, "fat": number }. Estimate for a single typical serving. Use integers only.',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Jpeg,
                },
              },
              { type: 'text', text: 'What food is this and what are its macros?' },
            ],
          },
        ],
      }),
    })
  } catch {
    throw new ScanError('network_error')
  }

  if (!response.ok) {
    throw new ScanError('api_error')
  }

  const data = await response.json()
  const text: string = data?.content?.[0]?.text ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new ScanError('parse_failed')

  let parsed: unknown
  try {
    parsed = JSON.parse(match[0])
  } catch {
    throw new ScanError('parse_failed')
  }

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).name !== 'string' ||
    typeof (parsed as Record<string, unknown>).calories !== 'number'
  ) {
    throw new ScanError('parse_failed')
  }

  const p = parsed as Record<string, unknown>
  return {
    name: p.name as string,
    calories: p.calories as number,
    protein: typeof p.protein === 'number' ? p.protein : 0,
    carbs: typeof p.carbs === 'number' ? p.carbs : 0,
    fat: typeof p.fat === 'number' ? p.fat : 0,
  }
}
