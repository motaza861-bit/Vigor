import { ScanResult, ScanError } from './scanTypes'

export async function openFoodFacts(barcode: string): Promise<ScanResult> {
  let response: Response
  try {
    response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
    )
  } catch {
    throw new ScanError('network_error')
  }

  if (!response.ok) {
    throw new ScanError('api_error')
  }

  const data = await response.json()

  if (data.status === 0) {
    throw new ScanError('not_found')
  }

  const { product } = data
  const n = product.nutriments ?? {}
  const parsedServing = product.serving_quantity ? parseFloat(product.serving_quantity) : 0
  const servingGrams = parsedServing > 0 ? parsedServing : 100
  const scale = servingGrams / 100

  return {
    name: product.product_name || product.generic_name || 'Unknown Product',
    calories: Math.round((n['energy-kcal_100g'] ?? 0) * scale),
    protein: Math.round((n['proteins_100g'] ?? 0) * scale),
    carbs: Math.round((n['carbohydrates_100g'] ?? 0) * scale),
    fat: Math.round((n['fat_100g'] ?? 0) * scale),
  }
}
