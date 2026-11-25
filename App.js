import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  BackHandler,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

const TOZRA_URL = 'https://ircai.vercel.app/';
const BG = '#0B0E17';
const TEXT = '#F4F6FB';
const MUTED = '#9AA4C7';
const ACCENT = '#7C6BFF';
const ACCENT2 = '#4DA6FF';

function LoadingScreen() {
  const spin = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const rotation = Animated.loop(Animated.timing(spin, {
      toValue: 1, duration: 18000, easing: Easing.linear, useNativeDriver: true,
    }));
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 1800, useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ]));
    rotation.start(); pulse.start();
    return () => { rotation.stop(); pulse.stop(); };
  }, [spin, breathe]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.055] });
  const glowOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.58] });
  return (
    <View style={styles.loading}>
      <Animated.View style={[styles.orbit, { transform: [{ rotate }] }]} />
      <Animated.View style={[styles.orbitInner, { transform: [{ rotate }] }]} />
      <Animated.View style={[styles.logoGlow, { opacity: glowOpacity, transform: [{ scale }] }]} />
      <Animated.View style={[styles.logo, { transform: [{ scale }] }]}>
        <Text style={styles.logoLetter}>T</Text>
      </Animated.View>
      <Text style={styles.brand}>TOZRA</Text>
      <Text style={styles.tagline}>CREATIVE INTELLIGENCE</Text>
      <View style={styles.loadingTrack}><View style={styles.loadingFill} /></View>
      <Text style={styles.loadingText}>Yaratıcı çalışma alanın hazırlanıyor</Text>
    </View>
  );
}

function ErrorScreen({ onRetry, message }) {
  return (
    <View style={styles.error}>
      <View style={styles.errorMark}>
        <Text style={styles.errorMarkText}>T</Text>
      </View>
      <Text style={styles.errorTitle}>TOZRA’ya bağlanılamadı</Text>
      <Text style={styles.errorCopy}>
        İnternet bağlantını kontrol et. Vercel’deki TOZRA sayfası şu anda
        açılamıyor olabilir.
      </Text>
      {message ? <Text style={styles.errorDetail}>{message}</Text> : null}
      <Pressable onPress={onRetry} style={styles.retry}>
        <Text style={styles.retryText}>Yeniden dene</Text>
      </Pressable>
    </View>
  );
}

function TozraApp() {
  const webRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => {
    setFailed(false);
    setErrorMessage('');
    setLoading(true);
    setReloadKey((value) => value + 1);
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webRef.current) {
        webRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const handleLoadStart = () => {
    setLoading(true);
    setFailed(false);
    setErrorMessage('');
  };

  const handleLoadEnd = () => setLoading(false);

  const handleError = (event) => {
    const description = event?.nativeEvent?.description || 'Bağlantı kurulamadı.';
    setLoading(false);
    setFailed(true);
    setErrorMessage(description);
  };

  const handleHttpError = (event) => {
    const status = event?.nativeEvent?.statusCode;
    if (status >= 500) {
      setLoading(false);
      setFailed(true);
      setErrorMessage(`Sunucu yanıtı: ${status}`);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      {failed ? (
        <ErrorScreen onRetry={retry} message={errorMessage} />
      ) : (
        <View style={styles.webContainer}>
          <WebView
            key={reloadKey}
            ref={webRef}
            source={{ uri: TOZRA_URL }}
            style={styles.web}
            containerStyle={styles.webContainer}
            originWhitelist={['https://*', 'http://*', 'about:*']}
            javaScriptEnabled
            domStorageEnabled
            sharedCookiesEnabled
            thirdPartyCookiesEnabled
            allowsBackForwardNavigationGestures
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            setSupportMultipleWindows={false}
            pullToRefreshEnabled
            cacheEnabled
            incognito={false}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onNavigationStateChange={(state) => setCanGoBack(state.canGoBack)}
            onError={handleError}
            onHttpError={handleHttpError}
            onRenderProcessGone={() => {
              setFailed(true);
              setLoading(false);
              setErrorMessage('Sayfa işlemi durdu. Yeniden yüklemeyi deneyebilirsin.');
            }}
            allowsLinkPreview={false}
            contentMode="mobile"
          />
          {loading ? (
            <View style={styles.loadingOverlay} pointerEvents="none">
              <LoadingScreen />
            </View>
          ) : null}
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <TozraApp />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  webContainer: { flex: 1, backgroundColor: BG },
  web: { flex: 1, backgroundColor: BG },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
  },
  loading: {
    flex: 1, backgroundColor: BG, alignItems: 'center',
    justifyContent: 'center', overflow: 'hidden',
  },
  orbit: {
    position: 'absolute', width: 290, height: 290, borderRadius: 145,
    borderWidth: 1, borderColor: 'rgba(124,107,255,0.34)',
    borderTopColor: ACCENT, borderRightColor: 'rgba(77,166,255,0.28)',
  },
  orbitInner: {
    position: 'absolute', width: 218, height: 218, borderRadius: 109,
    borderWidth: 1, borderColor: 'rgba(77,166,255,0.24)', borderBottomColor: ACCENT2,
  },
  logoGlow: {
    position: 'absolute', width: 132, height: 132, borderRadius: 44,
    backgroundColor: 'rgba(124,107,255,0.26)',
  },
  loadingTrack: {
    width: 170, height: 4, borderRadius: 999, backgroundColor: 'rgba(165,180,252,0.14)',
    overflow: 'hidden', marginTop: 34,
  },
  loadingFill: { width: '74%', height: 4, borderRadius: 999, backgroundColor: ACCENT },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(165,180,252,0.42)',
    backgroundColor: '#7C6BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: { color: '#FFFFFF', fontSize: 40, fontWeight: '800' },
  brand: { color: TEXT, fontSize: 26, fontWeight: '900', letterSpacing: 7, marginTop: 18 },
  tagline: { color: MUTED, fontSize: 9, fontWeight: '700', letterSpacing: 2.6, marginTop: 8 },
  loadingText: { color: MUTED, fontSize: 12, marginTop: 14 },
  error: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  errorMark: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#151B2E',
    borderWidth: 1,
    borderColor: 'rgba(124,107,255,0.42)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorMarkText: { color: '#C4B5FD', fontSize: 34, fontWeight: '800' },
  errorTitle: { color: TEXT, fontSize: 19, fontWeight: '800', textAlign: 'center' },
  errorCopy: { color: MUTED, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 10 },
  errorDetail: { color: '#7D88AE', fontSize: 10, textAlign: 'center', marginTop: 10 },
  retry: {
    marginTop: 22,
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingHorizontal: 26,
    paddingVertical: 14,
  },
  retryText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
