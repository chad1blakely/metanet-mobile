import React, { useEffect } from 'react'
import { Stack, SplashScreen } from 'expo-router'
import { observer } from 'mobx-react-lite'
import { View, ActivityIndicator } from 'react-native'
import { UserContextProvider, NativeHandlers } from '../context/UserContext'
import packageJson from '../package.json'
import { WalletContextProvider } from '@/context/WalletContext'
import { ExchangeRateContextProvider } from '@/context/ExchangeRateContext'
import { ThemeProvider } from '@/context/theme/ThemeContext'
import PasswordHandler from '@/components/PasswordHandler'
import RecoveryKeySaver from '@/components/RecoveryKeySaver'
import LocalStorageProvider from '@/context/LocalStorageProvider'
import ProtocolAccessModal from '@/components/ProtocolAccessModal'
import BasketAccessModal from '@/components/BasketAccessModal'
import CertificateAccessModal from '@/components/CertificateAccessModal'
import SpendingAuthorizationModal from '@/components/SpendingAuthorizationModal'
import { useDeepLinking } from '@/hooks/useDeepLinking'
import DefaultBrowserPrompt from '@/components/DefaultBrowserPrompt'
import * as Notifications from 'expo-notifications'
import { initializeFirebase } from '@/utils/firebase'
import { LanguageProvider } from '@/utils/translations'
import { BrowserModeProvider } from '@/context/BrowserModeContext'
import Web3BenefitsModalHandler from '@/components/Web3BenefitsModalHandler'
import tabStore from '@/stores/TabStore'
import '@/utils/translations'

const nativeHandlers: NativeHandlers = {
  isFocused: async () => false,
  onFocusRequested: async () => {},
  onFocusRelinquished: async () => {},
  onDownloadFile: async (fileData: Blob, fileName: string) => {
    try {
      const url = window.URL.createObjectURL(fileData)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('Download failed:', error)
      return false
    }
  }
}

// Configure global notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  })
})

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

// Deep link handler component
function DeepLinkHandler() {
  useDeepLinking()
  return null
}

function RootLayout() {
  useEffect(() => {
    const initializeApp = async () => {
      await initializeFirebase()
      // Initialize the store when the component mounts
      await tabStore.initializeTabs()
      // Hide the splash screen once the store is ready
      SplashScreen.hideAsync()
    }
    initializeApp()
  }, [])

  // Show a loading indicator while the store is initializing
  if (!tabStore.isInitialized) {
    // You can return a loading spinner or a blank view.
    // Returning null might cause issues, so a View is safer.
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <LanguageProvider>
      <LocalStorageProvider>
        <UserContextProvider nativeHandlers={nativeHandlers} appVersion={packageJson.version} appName="Metanet">
          <ExchangeRateContextProvider>
            <WalletContextProvider>
              <BrowserModeProvider>
                <ThemeProvider>
                  <DeepLinkHandler />
                  <Web3BenefitsModalHandler />
                  {/* <TranslationTester /> */}
                  <DefaultBrowserPrompt />
                  <PasswordHandler />
                  <RecoveryKeySaver />
                  <ProtocolAccessModal />
                  <BasketAccessModal />
                  <CertificateAccessModal />
                  <SpendingAuthorizationModal />
                  <Stack
                    screenOptions={{
                      animation: 'slide_from_right',
                      headerShown: false
                    }}
                  >
                    <Stack.Screen name="browser" options={{ headerShown: false }} />
                    <Stack.Screen name="index" options={{ headerShown: false }} />
                    <Stack.Screen name="auth/otp" options={{ headerShown: false }} />
                    <Stack.Screen name="settings" options={{ headerShown: false }} />
                    <Stack.Screen name="identity" options={{ headerShown: false }} />
                    <Stack.Screen name="security" options={{ headerShown: false }} />
                    <Stack.Screen name="trust" options={{ headerShown: false }} />
                  </Stack>
                </ThemeProvider>
              </BrowserModeProvider>
            </WalletContextProvider>
          </ExchangeRateContextProvider>
        </UserContextProvider>
      </LocalStorageProvider>
    </LanguageProvider>
  )
}

// Wrap your layout with observer to react to store changes
export default observer(RootLayout)
