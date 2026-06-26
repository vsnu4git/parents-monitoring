import React from 'react'
import { LogBox } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { PaperProvider } from 'react-native-paper'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './src/auth/AuthContext'
import { ThemeProvider, useThemeMode } from './src/theme/ThemeContext'
import { RootNavigator } from './src/navigation/RootNavigator'
import { DynamicIslandProvider } from './src/components/DynamicIsland'
import { paperThemeDark, paperThemeLight } from './src/theme'

LogBox.ignoreLogs([
  'Internal React error: Expected static flag was missing',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Non-serializable values were found in the navigation state',
  'Require cycle:',
  'ViewPropTypes will be removed',
  'Animated: `useNativeDriver`',
  'Each child in a list should have a unique',
  'Warning: componentWillReceiveProps',
  'Warning: componentWillMount',
  'new NativeEventEmitter',
  'Animated.event now requires a second argument',
  'Possible unhandled promise rejection',
])

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2,
      refetchOnWindowFocus: false,
    },
  },
})

function ThemedApp() {
  const { isDark } = useThemeMode()

  return (
    <PaperProvider theme={isDark ? paperThemeDark : paperThemeLight}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DynamicIslandProvider>
            <RootNavigator />
          </DynamicIslandProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        </AuthProvider>
      </QueryClientProvider>
    </PaperProvider>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
