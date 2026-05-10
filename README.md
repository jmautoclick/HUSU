# MisHábitos Android

App Android de tracker de hábitos basada en [mis-habitos-eight.vercel.app](https://mis-habitos-eight.vercel.app/).

Stack: Vite + React + TypeScript + Capacitor (target Android).

## Comandos

```bash
npm install                 # instalar deps
npm run dev                 # dev server (puerto 5175)
npm run build               # build producción a /dist
npx cap sync android        # copiar dist al proyecto Android
```

## Generar APK

Requisitos: Android Studio + JDK (ya viene incluido).

PowerShell (una vez por sesión):
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "C:\Users\JuanMa\AppData\Local\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

Build APK debug:
```powershell
cd android
.\gradlew.bat assembleDebug
```

APK queda en: `android/app/build/outputs/apk/debug/app-debug.apk`

Para instalar en un teléfono Android:
1. Activar "Orígenes desconocidos" en ajustes del teléfono.
2. Pasar el .apk al teléfono (USB, email, Google Drive).
3. Tocar el archivo y aceptar instalar.

## Para publicar en Play Store

1. **Crear keystore de release** (una sola vez):
   ```powershell
   & "$env:JAVA_HOME\bin\keytool.exe" -genkey -v -keystore mishabitos-release.keystore -alias mishabitos -keyalg RSA -keysize 2048 -validity 10000
   ```
   Guardar el keystore y el password en un lugar seguro — sin él no se puede actualizar la app.

2. **Configurar firma** en `android/app/build.gradle` (sección `signingConfigs`).

3. **Build release**:
   ```powershell
   cd android
   .\gradlew.bat bundleRelease     # genera .aab para Play Store
   ```

4. **Subir a Play Console**:
   - Crear cuenta de developer ($25 USD pago único): https://play.google.com/console
   - Crear app, subir el `.aab` (`android/app/build/outputs/bundle/release/app-release.aab`)
   - Completar listing: ícono 512x512, screenshots, descripción, política de privacidad
   - Esperar review (1-3 días)

## IA Coach (Gemini)

El usuario configura su propia API key gratis:
1. Ir a https://aistudio.google.com/apikey
2. Crear key
3. En la app, tab IA Coach → "Configurar API key" → pegar

La key se guarda solo en `localStorage` del dispositivo.

## Datos

Todo en `localStorage` clave `mishabitos-data-v1`. Estructura:
```json
{
  "habits": [{ "id", "name", "colorIdx", "createdAt", "monthlyGoal" }],
  "completions": { "YYYY-MM-DD": { "habitId": true } },
  "geminiKey": "..."
}
```
