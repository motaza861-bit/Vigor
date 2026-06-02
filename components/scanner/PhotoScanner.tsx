import React, { useRef, useState } from 'react'
import {
  View, Text, Modal, Pressable,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useTheme } from '../../contexts/ThemeContext'
import { spacing, fontSize, radius } from '../../theme/tokens'
import { claudeVision } from '../../lib/claudeVision'
import { ScanResult, ScanError } from '../../lib/scanTypes'

type Props = {
  visible: boolean
  apiKey: string
  onResult: (result: ScanResult) => void
  onClose: () => void
}

type State = 'idle' | 'processing' | 'error'

export function PhotoScanner({ visible, apiKey, onResult, onClose }: Props) {
  const { theme } = useTheme()
  const [permission, requestPermission] = useCameraPermissions()
  const [state, setState] = useState<State>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const cameraRef = useRef<CameraView>(null)

  if (!apiKey) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.fullscreen, { backgroundColor: theme.bg }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: theme.text, fontSize: fontSize.lg }}>✕</Text>
          </Pressable>
          <View style={styles.centeredMessage}>
            <Text
              style={{ color: theme.textMuted, fontSize: fontSize.md, textAlign: 'center' }}
            >
              Add your Anthropic API key in Settings to use photo scanning.
            </Text>
          </View>
        </View>
      </Modal>
    )
  }

  if (!permission?.granted) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={[styles.fullscreen, { backgroundColor: theme.bg }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={{ color: theme.text, fontSize: fontSize.lg }}>✕</Text>
          </Pressable>
          <View style={styles.centeredMessage}>
            <Text
              style={{
                color: theme.textMuted, fontSize: fontSize.md,
                textAlign: 'center', marginBottom: spacing.lg,
              }}
            >
              Camera access is required for photo scanning.
            </Text>
            <Pressable
              onPress={requestPermission}
              style={{
                backgroundColor: theme.accent,
                borderRadius: radius.md,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.md }}>
                Allow Camera
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    )
  }

  const capture = async () => {
    if (!cameraRef.current || state === 'processing') return
    setState('processing')
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 })
      const result = await claudeVision(photo.base64!, apiKey)
      onResult(result)
      setState('idle')
    } catch (e) {
      const code = e instanceof ScanError ? e.code : 'api_error'
      setErrorMsg(
        code === 'network_error'
          ? 'No internet connection.'
          : "Couldn't identify this food. Try again."
      )
      setState('error')
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.fullscreen}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={{ color: '#fff', fontSize: fontSize.lg }}>✕</Text>
        </Pressable>
        {state === 'error' && (
          <View style={styles.errorBanner}>
            <Text style={{ color: '#fff', fontSize: fontSize.sm, textAlign: 'center' }}>
              {errorMsg}
            </Text>
            <Pressable onPress={() => setState('idle')} style={{ marginTop: 6 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.sm }}>
                Try Again
              </Text>
            </Pressable>
          </View>
        )}
        <View style={styles.bottomBar}>
          {state === 'processing' ? (
            <>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={{ color: '#fff', fontSize: fontSize.sm, marginTop: 8 }}>
                Identifying food…
              </Text>
            </>
          ) : (
            <Pressable onPress={capture} style={styles.captureButton} />
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  fullscreen: { flex: 1, backgroundColor: '#000' },
  closeButton: { position: 'absolute', top: 56, left: 20, zIndex: 10, padding: 8 },
  centeredMessage: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  errorBanner: {
    position: 'absolute', bottom: 140, left: 20, right: 20,
    backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 8,
    padding: 12, alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute', bottom: 48, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  captureButton: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#fff', borderWidth: 4, borderColor: 'rgba(255,255,255,0.5)',
  },
})
