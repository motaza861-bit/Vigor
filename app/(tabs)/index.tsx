import { View, Text, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '../../contexts/ThemeContext'

export default function HomeScreen() {
  const { theme } = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: theme.text, fontSize: 24, fontWeight: '700' }}>Home</Text>
      <Pressable onPress={() => router.push('/settings')} style={{ marginTop: 20 }}>
        <Text style={{ color: theme.accent }}>Open Settings</Text>
      </Pressable>
    </View>
  )
}
