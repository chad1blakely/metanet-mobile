// components/BrowserWebView.tsx
import React, { useRef, useEffect, useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import { observer } from 'mobx-react-lite'
import tabStore from '@/stores/TabStore'
import type { WebViewNavigation, WebViewMessageEvent } from 'react-native-webview'
import { kNEW_TAB_URL } from '@/shared/constants'

interface BrowserWebViewProps {
  onMessage?: (event: WebViewMessageEvent) => void
  injectedJavaScript?: string
  userAgent?: string
  style?: any
  [key: string]: any // Allow other WebView props to be passed through
}

// This component renders multiple WebViews, one for each tab
// but only shows the active one. This keeps all tabs mounted in memory.
const BrowserWebView = observer(
  ({ onMessage, injectedJavaScript, userAgent, style, ...otherProps }: BrowserWebViewProps) => {
    const webViewRefs = useRef<{ [tabId: number]: React.RefObject<WebView> }>({})

    // Initialize refs for all tabs
    useEffect(() => {
      tabStore.tabs.forEach(tab => {
        if (!webViewRefs.current[tab.id]) {
          webViewRefs.current[tab.id] = React.createRef<WebView>()
          // Update the tab's webview ref
          tab.webviewRef = webViewRefs.current[tab.id]
        }
      })
    }, [tabStore.tabs])

    const handleNavigationStateChange = useCallback(
      (tabId: number) => (navState: WebViewNavigation) => {
        tabStore.handleNavigationStateChange(tabId, navState)
      },
      []
    )

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        if (onMessage) {
          onMessage(event)
        }
      },
      [onMessage]
    )

    return (
      <View style={[styles.container, style]}>
        {tabStore.tabs.map(tab => (
          <View
            key={`webview-${tab.id}`}
            style={[
              styles.webviewContainer,
              {
                display: tab.id === tabStore.activeTabId ? 'flex' : 'none'
              }
            ]}
          >
            <WebView
              ref={webViewRefs.current[tab.id]}
              source={{ uri: tab.url || kNEW_TAB_URL }}
              onNavigationStateChange={handleNavigationStateChange(tab.id)}
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
              {...otherProps}
            />
          </View>
        ))}
      </View>
    )
  }
)

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  webviewContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  webview: {
    flex: 1
  }
})

export default BrowserWebView
