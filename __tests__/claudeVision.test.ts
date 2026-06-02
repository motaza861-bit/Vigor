import { claudeVision } from '../lib/claudeVision'
import { ScanError } from '../lib/scanTypes'

describe('claudeVision', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('parses a valid JSON response from Claude', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: '{ "name": "Oatmeal", "calories": 300, "protein": 10, "carbs": 54, "fat": 5 }' }],
      }),
    })
    const result = await claudeVision('base64string', 'sk-ant-test')
    expect(result.name).toBe('Oatmeal')
    expect(result.calories).toBe(300)
    expect(result.protein).toBe(10)
    expect(result.carbs).toBe(54)
    expect(result.fat).toBe(5)
  })

  it('extracts JSON when Claude wraps it in prose', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: 'Here is the nutrition info: { "name": "Banana", "calories": 105, "protein": 1, "carbs": 27, "fat": 0 }' }],
      }),
    })
    const result = await claudeVision('base64string', 'sk-ant-test')
    expect(result.name).toBe('Banana')
    expect(result.calories).toBe(105)
  })

  it('throws ScanError parse_failed when response has no JSON', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: 'I cannot identify this food.' }] }),
    })
    await expect(claudeVision('base64string', 'sk-ant-test')).rejects.toMatchObject({ code: 'parse_failed' })
  })

  it('throws ScanError api_error when response is not ok', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false })
    await expect(claudeVision('base64string', 'sk-ant-test')).rejects.toMatchObject({ code: 'api_error' })
  })

  it('throws ScanError network_error when fetch rejects', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'))
    await expect(claudeVision('base64string', 'sk-ant-test')).rejects.toMatchObject({ code: 'network_error' })
  })
})
