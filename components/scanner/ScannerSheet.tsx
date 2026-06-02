import React from 'react'
import { View, Text, Modal, Pressable } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'
import { Button } from '../ui/Button'
import { spacing, fontSize, radius } from '../../theme/tokens'

type Props = {
  visible: boolean
  onPhoto: () => void
  onBarcode: () => void
  onClose: () => void
}

export function ScannerSheet({ visible, onPhoto, onBarcode, onClose }: Props) {
  const { theme } = useTheme()
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }}
        onPress={onClose}
      />
      <View
        style={{
          backgroundColor: theme.surface,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          padding: spacing.lg,
          paddingBottom: spacing.xxl,
        }}
      >
        <Text
          style={{ color: theme.text, fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.lg }}
        >
          Add from Scanner
        </Text>
        <Button label="📷  Take Photo" variant="ghost" fullWidth onPress={onPhoto} />
        <View style={{ height: spacing.sm }} />
        <Button label="⬛  Scan Barcode" variant="ghost" fullWidth onPress={onBarcode} />
        <View style={{ height: spacing.lg }} />
        <Button label="Cancel" variant="ghost" fullWidth onPress={onClose} />
      </View>
    </Modal>
  )
}
