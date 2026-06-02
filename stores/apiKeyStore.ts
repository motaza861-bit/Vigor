import { MMKV } from 'react-native-mmkv'

let _storage: MMKV | undefined

function getStorage(): MMKV {
  if (!_storage) {
    _storage = new MMKV({ id: 'api-keys' })
  }
  return _storage
}

export function loadApiKey(): string {
  return getStorage().getString('anthropic') ?? ''
}

export function saveApiKey(key: string): void {
  getStorage().set('anthropic', key)
}
