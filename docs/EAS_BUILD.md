# Husu Habits — Build con EAS

> Mismo workflow que YESNO. Cloud build sin Mac, single command, auto-submit a TestFlight + Play.

## Cuesta cuánto

- **EAS Free**: 30 builds/mes (iOS + Android combinados), queue baja prioridad (~10-30 min de espera)
- **EAS Production**: USD 19/mes — 100 builds + queue prioritaria — solo si iterás mucho
- **Apple Dev**: USD 99/año (ya pagaste)
- **Google Play**: USD 25 una vez

Para Husu Habits con 2-5 builds/mes, **free tier suficiente**.

## Setup primera vez (≈10 min)

### 1. Verificá que tenés eas-cli

```powershell
eas --version
```

Si no la tenés:
```powershell
npm install -g eas-cli
```

### 2. Login (si no estás logueado ya)

```powershell
cd C:\Users\JuanMa\Projects\MisHabitosAndroid
eas login
```

Usa tu cuenta de Expo (la misma que YESNO).

### 3. Init project

```powershell
eas init
```

Te pregunta:
- **What account to use?** → tu cuenta Expo
- **Existing or new project?** → New
- **Project name** → `husu-habits` (o el que prefieras dentro de tu Expo)

Esto crea/actualiza el `extra.eas.projectId` en `app.json` o genera uno nuevo si no existe.

> ⚠️ **Husu no tiene `app.json`** (no es Expo). Si `eas init` te lo pide, decí "skip" o creá uno mínimo. Si no te lo pide, todo OK.

### 4. Completar datos en `eas.json`

Editá `eas.json` y reemplazá los 2 placeholders:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "jm@jmautoclick.com",
      "ascAppId": "1234567890",          ← Apple ID numérico de la app (10 dígitos)
      "appleTeamId": "ABC123XYZ9"        ← Team ID (10 chars, en developer.apple.com → Membership)
    },
    ...
  }
}
```

Dónde sacarlos:
- **ascAppId**: appstoreconnect.apple.com → My Apps → Husu Habits → App Information → arriba derecha "Apple ID: ##########"
- **appleTeamId**: developer.apple.com → click tu nombre arriba derecha → Membership → "Team ID"

### 5. Configurar credenciales iOS

```powershell
eas credentials -p ios
```

Te pregunta:
- **Build profile** → production
- **What do you want to do?** → "Set up a new build credentials configuration"
- **App Store Connect API Key** → "Set up a new one" → te pide los 3 datos:
  - **Key ID** (de la API Key que generaste antes)
  - **Issuer ID** (UUID arriba en la página de App Store Connect API)
  - **Path al .p8** → ej `C:\Users\JuanMa\Downloads\AuthKey_2X9R4HXF34.p8`
- **Distribution certificate** → "Generate a new one" (EAS lo crea automáticamente en tu cuenta Apple)
- **Provisioning profile** → "Generate a new one"

Esto se hace UNA SOLA VEZ. Después queda guardado encriptado en tu cuenta Expo.

### 6. Configurar credenciales Android (cuando quieras lanzar Android desde EAS)

```powershell
eas credentials -p android
```

- **Build profile** → production
- **Generate a new keystore** → sí (EAS lo crea y guarda)
- O si ya tenés keystore tuyo del .aab que subiste antes a Play Console, **Upload existing keystore**

⚠️ Si ya tenés un keystore con el que firmaste el v1.0.2 en Play Console, **TENÉS que subir ese mismo** (el `*.jks` original + passwords). Si EAS genera uno nuevo, Play Console rechazará la firma porque no coincide con el que ya está registrado.

### 7. Para auto-submit a Play, agregás service account de Google Play

```powershell
eas credentials -p android
```
→ Set up Google Service Account Key
→ Te pide el JSON de la service account (mismo que para Codemagic — Google Cloud Console → Service Accounts → Create → Download JSON, después vincularlo en Play Console → Settings → API access)

## Workflow día a día

Cuando hagas un cambio en el código:

**iOS, sube directo a TestFlight:**
```powershell
npm run eas:ios
```

**Android, sube directo a Play Internal track:**
```powershell
npm run eas:android
```

**Ambos en paralelo:**
```powershell
eas build -p all --profile production --auto-submit --non-interactive
```

**Build de prueba sin auto-submit** (te genera el .ipa/.apk y te lo descarga):
```powershell
npm run eas:preview:ios
npm run eas:preview:android
```

Después del build (10-25 min según queue):
- Email de confirmación
- iOS: app aparece en TestFlight a los ~5-10 min después del submit
- Android: app aparece en Play Console → Internal testing a los ~5 min después del submit

## Cómo funciona el `eas-build-post-install`

EAS Build no sabe nada de Capacitor. Por eso definimos esto en `package.json`:

```json
"eas-build-post-install": "npm run build && npx cap sync $EAS_BUILD_PLATFORM ..."
```

EAS ejecuta este script automáticamente después de `npm install`. Hace:
1. `npm run build` → genera `dist/` con tu app web
2. `npx cap sync <platform>` → copia `dist/` a `ios/App/App/public/` (o `android/...`) + actualiza plugins nativos

Después EAS corre `xcodebuild archive` (iOS) o `gradle bundleRelease` (Android) sobre los proyectos nativos con los assets ya listos. ✨

## Setup ya hecho en este repo

Ya está committeado:
- ✅ `eas.json` con perfiles `development`, `preview`, `production`
- ✅ Scripts `npm run eas:ios`, `eas:android`, `eas:preview:*` en `package.json`
- ✅ Hook `eas-build-post-install` que hace build web + cap sync automático
- ✅ `Info.plist` con `ITSAppUsesNonExemptEncryption: false` (no preguntan más sobre crypto)

Lo que falta hacer **vos**:
1. `eas init` (1 vez — link al project en tu cuenta Expo)
2. Reemplazar `PLACEHOLDER_APP_STORE_APPLE_ID` y `PLACEHOLDER_APPLE_TEAM_ID` en `eas.json`
3. `eas credentials -p ios` → cargar la API Key (.p8 + IDs)
4. `npm run eas:ios` → primer build

## Troubleshooting

**"This build configuration only works for managed projects"**: tu eas.json o app.json tiene config Expo que no aplica. Quitar campos Expo y asegurarte que `cli.appVersionSource` sea `"remote"` (ya está así).

**Build falla en `eas-build-post-install`**: probablemente falla `npx cap sync` porque la plataforma no está bien. Verificá que `ios/` y `android/` existan en el repo (ya están commiteados).

**Build sube pero TestFlight no la procesa**: chequear que `ascAppId` en eas.json sea el Apple ID numérico CORRECTO de la app (no tu Apple ID personal).

**Auto-increment no funciona**: con `appVersionSource: "remote"`, EAS lee la última versión del backend y la incrementa. Si es tu primer build, el backend no tiene nada, así que toma del Info.plist (`CFBundleVersion`) o build.gradle (`versionCode`).

## ¿Conservar Codemagic o no?

Tenés dos sistemas CI configurados:
- **EAS** (nuevo, recomendado para vos porque ya sabés)
- **Codemagic** (`codemagic.yaml` en el repo, también funcionaría)

No se molestan entre sí (cada uno usa configuración propia). Pero si querés simplificar, podés borrar `codemagic.yaml` y `docs/CODEMAGIC_SETUP.md`. Decime y los borro.
