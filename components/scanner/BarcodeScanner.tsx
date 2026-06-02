import React, { useRef, useState } from 'react'
import {
  View, Text, Modal, Pressable,
  ActivityIndicator, StyleSheet,
} from 'react-native'
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera'
import { useTheme } from '../../contexts/ThemeContext'
import { spacing, fontSize, radius } from '../../theme/tokens'
import { openFoodFacts } from '../../lib/openFoodFacts'
import { ScanResult, ScanError } from '../../lib/scanTypes'

type Props = {
  visible: boolean
  onResult: (result: ScanResult) => void
  onPhotoFallback: () => void
  onClose: () => void
}

type State = 'scanning' | 'fetching' | 'error'

export function BarcodeScanner({ visible, onResult, onPhotoFallback, onClose }: Props) {
  const { theme } = useTheme()
  const [permission, requestPermission] = useCameraPermissions()
  const [state, setState] = useState<State>('scanning')
  const [errorMsg, setErrorMsg] = useState('')
  const isHandlingRef = useRef(false)

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
              Camera access is required for barcode scanning.
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

  const handleBarcode = async ({ data }: BarcodeScanningResult) => {
    if (isHandlingRef.current || state !== 'scanning') return
    isHandlingRef.current = true
    setState('fetching')
    try {
      const result = await openFoodFacts(data)
      onResult(result)
      setState('scanning')
      isHandlingRef.current = false
    } catch (e) {
      const code = e instanceof ScanError ? e.code : 'network_error'
      setErrorMsg(
        code === 'not_found'
          ? 'Product not found — add manually.'
          : 'Could not reach product database.'
      )
      setState('error')
      isHandlingRef.current = false
    }
  }

  const retry = () => {
    setState('scanning')
    isHandlingRef.current = false
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.fullscreen}>
        <CameraView
          style={StyleSheet.absoluteFill}
          onBarcodeScanned={state === 'scanning' ? handleBarcode : undefined}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'],
          }}
        />
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={{ color: '#fff', fontSize: fontSize.lg }}>✕</Text>
        </Pressable>
        <View style={styles.frameContainer}>
          <View style={styles.targetFrame} />
          {state === 'fetching' ? (
            <>
              <ActivityIndicator color="#fff" size="small" style={{ marginTop: 16 }} />
              <Text style={{ color: '#fff', fontSize: fontSize.sm, marginTop: 8 }}>
                Looking up product…
              </Text>
            </>
          ) : state === 'error' ? (
            <View style={styles.errorBox}>
              <Text style={{ color: '#fff', fontSize: fontSize.sm, textAlign: 'center' }}>
                {errorMsg}
              </Text>
              <Pressable onPress={retry} style={{ marginTop: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: fontSize.sm }}>
                  Try Again
                </Text>
              </Pressable>
            </View>
          ) : (
            <Text style={{ color: '#fff', fontSize: fontSize.sm, marginTop: 16 }}>
              Point at a barcode
            </Text>
          )}
        </View>
        <Pressable onPress={onPhotoFallback} style={styles.photoFallback}>
          <Text style={{ color: '#fff', fontSize: fontSize.sm }}>📷 Take Photo instead</Text>
        </Pressable>
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
  frameContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  targetFrame: {
    width: 260, height: 160, borderWidth: 2, borderColor: '#fff', borderRadius: 8,
  },
  errorBox: {
    marginTop: 16, backgroundColor: 'rgba(220,38,38,0.85)', borderRadius: 8,
    padding: 12, alignItems: 'center', marginHorizontal: 32,
  },
  photoFallback: { position: 'absolute', bottom: 48, right: 24, padding: 8 },
})
