const mockGet = jest.fn()
const mockSet = jest.fn()

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({ getString: mockGet, set: mockSet })),
}))

import { loadApiKey, saveApiKey } from '../stores/apiKeyStore'

describe('apiKeyStore', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGet.mockReturnValue(undefined)
  })

  it('returns empty string when key is not set', () => {
    expect(loadApiKey()).toBe('')
  })

  it('saves and loads the API key', () => {
    mockGet.mockReturnValue('sk-ant-test-key')
    saveApiKey('sk-ant-test-key')
    expect(mockSet).toHaveBeenCalledWith('anthropic', 'sk-ant-test-key')
    expect(loadApiKey()).toBe('sk-ant-test-key')
  })
})
