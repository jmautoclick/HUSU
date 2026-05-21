# Husu Habits — Build iOS

## Requisitos (en tu Mac)

- macOS 12+ (Monterey o superior)
- Xcode 15+ (Mac App Store, ~10 GB)
- CocoaPods (`sudo gem install cocoapods`)
- Cuenta Apple Developer ($99/año si querés publicar en App Store; gratis para testear en tu iPhone)

## Setup inicial

```bash
# 1. Cloná o copiá el proyecto a tu Mac
git clone <repo>   # o copiá la carpeta C:\Users\JuanMa\Projects\MisHabitosAndroid

cd MisHabitosAndroid

# 2. Instalá dependencias
npm install

# 3. Build de los assets web (genera /dist)
npm run build

# 4. Sync a iOS (copia /dist → ios/App/App/public + actualiza pods)
npx cap sync ios

# 5. Abrí en Xcode
npx cap open ios
```

Xcode abre `ios/App/App.xcworkspace` (workspace, NO el .xcodeproj).

## Configurar Bundle ID + Signing

En Xcode:
1. Click en `App` (top de Navigator) → Target `App`
2. Tab **Signing & Capabilities**
3. **Team**: seleccioná tu Apple ID (agregalo si no aparece: Xcode → Settings → Accounts)
4. **Bundle Identifier**: `com.husu.habits` (debería estar ya)
5. **Automatically manage signing**: activá

Si publicás en App Store, también:
- App Store Connect → My Apps → New App con bundle id `com.husu.habits`
- Crear App ID en developer.apple.com → Certificates, IDs & Profiles

## Probar en iPhone real

1. Conectá iPhone por USB
2. Trust el Mac
3. En Xcode, seleccioná tu iPhone como target (top bar, al lado del play button)
4. Click ▶ Run

Primera vez: iOS te pedirá ir a Settings → General → VPN & Device Management → Trust developer

## Probar en simulator

1. En Xcode top bar, seleccioná un simulator (ej. iPhone 15 Pro)
2. ▶ Run

## Build para App Store

```bash
# 1. Build assets
npm run build && npx cap sync ios

# 2. Abrir Xcode
npx cap open ios
```

En Xcode:
3. Top bar → seleccioná **Any iOS Device** (no simulator)
4. Menu: **Product → Archive**
5. Cuando termine: **Window → Organizer → Distribute App → App Store Connect → Upload**

Después en App Store Connect:
- Llenar listing (usá `PLAY_STORE_LISTING.md` adaptado)
- Adjuntar screenshots (los de `docs/screenshots/` están en 390×844 que iOS quiere — perfectos para iPhone 14/15/16)
- TestFlight para beta antes del review
- Submit for Review (1-3 días típicamente)

## Workflow cuando hagas cambios en el código

```bash
npm run build && npx cap sync ios
```

Después en Xcode: ⌘R para correr de nuevo. Capacitor hace hot-reload si dejás el dev server corriendo y configurás `server.url` en `capacitor.config.ts` apuntando a tu IP local. Para producción: comentá `server.url`.

## Tips iOS-específicos

- **Notificaciones locales**: el OS te va a pedir permiso la primera vez que se activa un recordatorio. El copy del prompt sale de `NSUserNotificationsUsageDescription` en Info.plist (ya configurado).
- **Haptics**: funcionan en iPhone 7+ (Taptic Engine). En simulator no se sienten pero el código corre OK.
- **Status bar**: configurada como `LightContent` para que se vea contra el fondo dark `husu-ink #2A2823`.
- **App Icon**: reemplazá `ios/App/App/Assets.xcassets/AppIcon.appiconset/` con tu set generado (cuando Claude Design lo entregue).
- **Launch Screen**: editá `ios/App/App/Base.lproj/LaunchScreen.storyboard` desde Xcode — actualmente es el default de Capacitor.

## Diferencias clave Android vs iOS en Husu Habits

| Feature | Android | iOS | Nota |
|---|---|---|---|
| Notif. locales | ✅ | ✅ | Misma API Capacitor, OS distintos prompts |
| Haptics | ✅ | ✅ | Taptic Engine en iOS, vibración estándar Android |
| Share API | ✅ | ✅ | `@capacitor/share` usa share sheet nativo cada uno |
| Filesystem (backup) | ✅ | ✅ | iOS usa Files app / iCloud Drive si configurado |
| Widget home | ❌ pendiente | ❌ pendiente | Ambos requieren código nativo extra (WidgetKit en iOS) |
| One-tap check desde notif | ✅ funciona | ⚠️ requiere `UNNotificationCategory` adicional | El plugin lo hace pero verificar |
| Theme dark/light | ✅ | ✅ | iOS respeta el toggle in-app |

## Si querés también auto-detectar dark/light según el sistema

Editá `src/styles.css` para añadir `prefers-color-scheme: dark` query además del `data-theme='dark'` actual. Decisión a discutir.
