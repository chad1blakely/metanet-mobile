// components/WebViewTab.tsx
import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import { observer } from 'mobx-react-lite'
import tabStore from '@/stores/TabStore'
import type { WebViewNavigation, WebViewMessageEvent } from 'react-native-webview'
import { kNEW_TAB_URL } from '@/shared/constants'

interface WebViewTabProps {
  route: {
    params: {
      tabId: number
    }
  }
  onMessage?: (event: WebViewMessageEvent) => void
  injectedJavaScript?: string
  userAgent?: string
  [key: string]: any // Allow other WebView props to be passed through
}

export interface WebViewTabRef {
  webViewRef: React.RefObject<WebView | null>
  tabId: number
}

const WebViewTab = observer(
  forwardRef<WebViewTabRef, WebViewTabProps>(({ route, onMessage, injectedJavaScript, userAgent, ...otherProps }, ref) => {
    const { tabId } = route.params
    const webViewRef = useRef<WebView>(null)
    const tab = tabStore.tabs.find(t => t.id === tabId)

    // Expose ref and tabId to parent
    useImperativeHandle(ref, () => ({
      webViewRef,
      tabId
    }))

    // Update the tab's webview ref when this component mounts
    useEffect(() => {
      if (tab && webViewRef.current) {
        tab.webviewRef = webViewRef
      }
    }, [tab])

    const handleNavigationStateChange = useCallback(
      (navState: WebViewNavigation) => {
        if (tab) {
          tabStore.handleNavigationStateChange(tabId, navState)
        }
      },
      [tab, tabId]
    )

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        // Forward message to parent if handler provided
        if (onMessage) {
          onMessage(event)
        }
      },
      [onMessage]
    )

    if (!tab) {
      return <View style={styles.container} />
    }

    return (
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          source={{ uri: tab.url || kNEW_TAB_URL }}
          onNavigationStateChange={handleNavigationStateChange}
          onMessage={handleMessage}
          injectedJavaScript={injectedJavaScript}
          userAgent={userAgent}
          style={styles.webview}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsBackForwardNavigationGestures={true}
          decelerationRate="normal"
          startInLoadingState={true}
          scalesPageToFit={true}
          mixedContentMode="compatibility"
          thirdPartyCookiesEnabled={true}
          allowsLinkPreview={false}
          allowsFullscreenVideo={true}
          setSupportMultipleWindows={false}
          {...otherProps} // Allow other WebView props to be passed through
        />
      </View>
    )
  })
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
})

export default WebViewTab
