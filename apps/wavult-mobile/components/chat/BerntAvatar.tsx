import { View, Text, StyleSheet } from 'react-native'

export function BerntAvatar() {
  return (
    <View style={styles.container}>
      <Text style={styles.letter}>B</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // Lila gradient simulerad med en solid midpoint-färg
    // (LinearGradient kräver expo-linear-gradient — använder solid tills vidare)
    backgroundColor: '#6D3AEE',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
    flexShrink: 0,
  },
  letter: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
})
