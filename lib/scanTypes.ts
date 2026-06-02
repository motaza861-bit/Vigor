export type ScanResult = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

export class ScanError extends Error {
  constructor(public code: 'parse_failed' | 'api_error' | 'not_found' | 'network_error') {
    super(code)
    this.name = 'ScanError'
  }
}
