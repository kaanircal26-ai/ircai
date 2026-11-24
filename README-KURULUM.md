# TOZRA Mobile — Clean Expo SDK 58 aktarım paketi

Bu paket, kullanıcının yeni oluşturduğu temiz Expo SDK 58 projesine mevcut TOZRA Mobile 1.5.1 uygulama ekranlarını ve eksik kaynak dosyalarını taşımak için hazırlanmıştır.

## 1) Dosyaları aktar

Bu paketteki `App.js`, `src/` ve `assets/` klasörlerini temiz Expo projesinin köküne kopyala. `App.js` üzerine yazılabilir. `App.tsx` varsa silme; adını `App-eski-yedek.tsx` yap ki Expo `App.js` dosyasını kullansın.

## 2) Paketleri SDK 58'e göre kur

Proje kökünde PowerShell:

```powershell
npx.cmd expo install @react-native-async-storage/async-storage @supabase/supabase-js expo-audio expo-constants expo-file-system expo-image-manipulator expo-image-picker expo-status-bar expo-video-thumbnails react-native-safe-area-context @expo/vector-icons
```

Ardından:

```powershell
npx.cmd expo install --fix
npx.cmd expo-doctor
```

`expo install` mevcut SDK 58 sürümüne uygun paket sürümlerini seçer. Bu yüzden SDK 54'ten kalan sabit paket sürümlerini kullanmıyoruz.

## 3) app.json yapılandırması

Temiz Expo projesindeki `app.json` dosyasının `expo` nesnesine şu özellikleri ekle/uyarla. Mevcut `slug`, `scheme` veya diğer proje kimliklerini kontrol etmeden tamamen değiştirme.

```json
{
  "name": "TOZRA",
  "slug": "tozra-mobile",
  "version": "2.0.0",
  "orientation": "portrait",
  "userInterfaceStyle": "dark",
  "scheme": "tozra",
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#111211"
  },
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.tozra.mobile",
    "infoPlist": {
      "NSMicrophoneUsageDescription": "TOZRA sesli giriş için mikrofon erişimi ister.",
      "NSCameraUsageDescription": "TOZRA fotoğraf ve video çekmek için kameraya erişir.",
      "NSPhotoLibraryUsageDescription": "TOZRA sohbet ve analiz için seçtiğin görsellere erişir."
    }
  },
  "android": {
    "package": "com.tozra.mobile",
    "permissions": ["RECORD_AUDIO", "CAMERA", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO"]
  },
  "extra": { "apiBaseUrl": "https://tozra.com.tr" },
  "plugins": [
    ["expo-image-picker", {
      "photosPermission": "TOZRA analiz için seçtiğin görsellere erişir.",
      "cameraPermission": "TOZRA fotoğraf ve video çekmek için kameraya erişir.",
      "microphonePermission": "TOZRA video kaydı için mikrofon erişimi ister."
    }],
    ["expo-audio", {
      "microphonePermission": "TOZRA sesli giriş için mikrofon erişimi ister."
    }]
  ]
}
```

## 4) Başlat

```powershell
npx.cmd expo start -c
```

## Supabase / Connect

- `src/supabase.js`, `https://tozra.com.tr/api/config` üzerinden Supabase URL ve public key alır. Vercel'de `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY` (veya `SUPABASE_ANON_KEY`) tanımlı olmalıdır.
- Supabase secret/service-role anahtarını uygulamaya ekleme.
- `TOZRA_CONNECT_2_PROFILES.sql` dosyasını Supabase SQL Editor'de çalıştırdıysan tekrar çalıştırman gerekmez. Bu SQL RLS ve profil avatar Storage bucket'ını kurar.

## Test durumu ve sınırlar

Bu aktarım paketi kaynak ZIP'teki `App.js` ile uyumlu eksik `src/supabase.js` ve `src/theme.js` dosyalarını tamamlar. SDK 58 paketleri kullanıcının temiz Expo SDK 58 projesinde `expo install` ile çözümlenecek şekilde bırakılmıştır. Bu çalışma ortamında kullanıcının bilgisayarındaki Expo kurulumu, gerçek Supabase projesi veya iPhone erişilebilir olmadığından cihaz testi/Expo Doctor sonucu iddia edilmemektedir.
