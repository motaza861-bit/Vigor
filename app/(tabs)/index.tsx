import { View, Text } from 'react-native'
import { useTheme } from '../../contexts/ThemeContext'

export default function HomeScreen() {
  const { theme } = useTheme()
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: theme.text, fontSize: 24, fontWeight: '700' }}>Home</Text>
    </View>
  )
}
