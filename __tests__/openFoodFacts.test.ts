import { openFoodFacts } from '../lib/openFoodFacts'
import { ScanError } from '../lib/scanTypes'

describe('openFoodFacts', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  it('returns macros scaled to serving_quantity', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Banana',
          serving_quantity: '120',
          nutriments: {
            'energy-kcal_100g': 89,
            'proteins_100g': 1.1,
            'carbohydrates_100g': 23,
            'fat_100g': 0.3,
          },
        },
      }),
    })
    const result = await openFoodFacts('1234567890')
    expect(result.name).toBe('Banana')
    expect(result.calories).toBe(107) // Math.round(89 * 1.2)
    expect(result.carbs).toBe(28)     // Math.round(23 * 1.2)
    expect(result.protein).toBe(1)    // Math.round(1.1 * 1.2)
  })

  it('defaults to 100g when serving_quantity is absent', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Apple',
          nutriments: {
            'energy-kcal_100g': 52,
            'proteins_100g': 0.3,
            'carbohydrates_100g': 14,
            'fat_100g': 0.2,
          },
        },
      }),
    })
    const result = await openFoodFacts('9876543210')
    expect(result.calories).toBe(52)
    expect(result.carbs).toBe(14)
  })

  it('falls back to generic_name when product_name is empty', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: '',
          generic_name: 'Whole Milk',
          nutriments: { 'energy-kcal_100g': 61, 'proteins_100g': 3.2, 'carbohydrates_100g': 4.8, 'fat_100g': 3.2 },
        },
      }),
    })
    const result = await openFoodFacts('9999999999')
    expect(result.name).toBe('Whole Milk')
  })

  it('throws ScanError not_found when product is missing', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 0 }),
    })
    await expect(openFoodFacts('0000000000')).rejects.toMatchObject({ code: 'not_found' })
  })

  it('throws ScanError network_error when fetch rejects', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('network'))
    await expect(openFoodFacts('1234567890')).rejects.toMatchObject({ code: 'network_error' })
  })

  it('throws ScanError api_error when response.ok is false', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    })
    await expect(openFoodFacts('1234567890')).rejects.toMatchObject({ code: 'api_error' })
  })

  it('defaults to 0 calories when nutriments is missing', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 1,
        product: {
          product_name: 'Mystery Product',
          serving_quantity: '100',
        },
      }),
    })
    const result = await openFoodFacts('5555555555')
    expect(result.calories).toBe(0)
    expect(result.protein).toBe(0)
    expect(result.carbs).toBe(0)
    expect(result.fat).toBe(0)
  })
})
