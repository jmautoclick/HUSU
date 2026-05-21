# Codemagic + Husu Habits — Setup paso a paso

> Build iOS sin Mac propio + builds Android automáticos en CI. Free tier alcanza para uso normal.

## Cuesta cuánto

- **Codemagic free tier**: 500 minutos/mes gratis. Un build iOS típico tarda ~10-12 min → ~40 builds/mes free.
- **Apple Developer Program**: USD 99/año (obligatorio para App Store y TestFlight).
- **Google Play Developer**: USD 25 pago único (obligatorio para Play Store).

**Total año 1**: USD 99 + USD 25 = USD 124. Después año 2+: USD 99/año.

## Antes de arrancar — checklist

- [ ] Cuenta GitHub (ya tenés)
- [ ] Repo de Husu Habits pusheado a GitHub (pasos abajo)
- [ ] Cuenta Apple Developer ([developer.apple.com/enroll](https://developer.apple.com/enroll/)) — pago USD 99 con tarjeta
- [ ] Cuenta Google Play Console ([play.google.com/console](https://play.google.com/console)) — pago USD 25

## Paso 1 — Subir el proyecto a GitHub

Desde la carpeta del proyecto en PowerShell:

```powershell
cd C:\Users\JuanMa\Projects\MisHabitosAndroid
git init
git add .
git commit -m "Initial commit — Husu Habits with all features"
```

Crear el repo vacío en GitHub:
1. github.com → New Repository
2. Nombre: `husu-habits` (o el que prefieras)
3. **Private** recomendado (Codemagic igual lo lee si das acceso)
4. NO marcar "Initialize with README"
5. Create

Después conectar local con remoto:
```powershell
git remote add origin https://github.com/<tu-usuario>/husu-habits.git
git branch -M main
git push -u origin main
```

## Paso 2 — Cuenta Codemagic

1. Ir a [codemagic.io](https://codemagic.io/signup)
2. **Sign up with GitHub** (usa tu cuenta GitHub directo, simplifica permisos)
3. Aceptar el free tier (500 min/mes)
4. **Add application** → seleccionar el repo `husu-habits` de la lista
5. Codemagic detecta automáticamente el `codemagic.yaml` que ya pusheamos

## Paso 3 — Apple Developer Program

1. Ir a [developer.apple.com/enroll](https://developer.apple.com/enroll)
2. Sign in con tu Apple ID (creá uno si no tenés)
3. Como individuo (no organización — más simple si sos solista)
4. Pagar USD 99 con tarjeta crédito/débito internacional
5. Esperar 24-48 hs para activación

Mientras esperás:
- Anotar tu **Team ID** (vas a verlo en account.apple.com/account → Membership)

## Paso 4 — App Store Connect

Después de activado el dev account:

1. Ir a [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **My Apps** → **+** → **New App**
   - Platforms: iOS
   - Name: `Husu Habits`
   - Primary Language: Spanish (Argentina)
   - Bundle ID: `com.husu.habits` (registralo previamente en developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → + → App IDs → App)
   - SKU: `husu-habits-001`
3. Anotar el **Apple ID numérico** que te asigna (10 dígitos) — actualizar en `codemagic.yaml` línea `APP_STORE_APPLE_ID: 1234567890`

## Paso 5 — App Store Connect API Key (para Codemagic)

1. App Store Connect → **Users and Access** → **Keys** (tab Integrations)
2. **Generate API Key**
   - Name: `Codemagic CI`
   - Access: **App Manager**
3. Descargar el `.p8` (¡SOLO una vez! guardalo a buen recaudo)
4. Anotar: **Issuer ID** + **Key ID**

En Codemagic:
1. Project Settings → **Team integrations** → **App Store Connect** → **Add**
2. **Integration name**: `husu-habits-key` (debe coincidir con lo que escribimos en el yaml)
3. Pegar el `.p8` + Issuer ID + Key ID
4. Save

## Paso 6 — Configurar Android signing en Codemagic

Generar keystore en local (una sola vez):
```powershell
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" `
  -genkeypair -v `
  -keystore husu-habits-release.jks `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -alias husuhabits
```

Te pide:
- Password del keystore (anotalo y guardalo seguro)
- Password del key (puede ser el mismo)
- Tus datos (CN, OU, O, etc.)

**IMPORTANTE**: backup del `.jks` y los passwords en un lugar seguro. Si lo perdés no podés actualizar la app en Play Store nunca más.

Subirlo a Codemagic:
1. Codemagic → tu app → **Code signing identities** → **Android keystores** → **Add keystore**
2. Reference name: `husu-habits-keystore`
3. Upload `.jks` + key alias `husuhabits` + ambos passwords
4. Save

## Paso 7 — Google Play Console (Android)

1. Ir a [play.google.com/console](https://play.google.com/console) → Crear cuenta dev USD 25
2. Crear app: **Husu Habits**, paquete `com.husu.habits`
3. Para que Codemagic suba builds automáticamente:
   - Google Cloud Console → Service Accounts → crear cuenta service
   - Descargar `.json` credentials
   - En Play Console: Settings → API access → vincular el service account → dar permisos "Release manager"
4. Subir el JSON a Codemagic: Environment variables → variable `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` con el contenido del JSON

## Paso 8 — Primer build

Una vez configurado todo, cualquier push a `main` triggerea ambos builds (iOS y Android) automáticamente.

Para correr manualmente desde Codemagic:
1. Open app → **Start new build**
2. Workflow: `Husu Habits iOS` o `Husu Habits Android`
3. Branch: `main`
4. **Start build**

A los 10-15 min recibís email con el `.ipa` (iOS) o `.aab` (Android), subido automáticamente a TestFlight / Play internal track.

## Workflow típico día a día

Cuando hagas un cambio:
```powershell
git add .
git commit -m "fix: lo que sea"
git push
```

Codemagic detecta el push, builda, sube a TestFlight + Play internal. Tu amigo (y vos) reciben la actualización en sus celulares dentro de ~15-30 min.

## Si querés probar sin gastar Apple Dev USD 99 todavía

Usá el workflow **`ios-debug-workflow`** definido en el yaml: no firma, no sube a TestFlight, solo te genera un `.app` para simulator. Útil para validar que el build funciona antes de pagar.

```yaml
# Codemagic UI → Start new build → workflow: "Husu Habits iOS (debug, sin firma)"
```

## Problemas comunes

- **"App not eligible for upload"**: faltó crear el App ID + App en App Store Connect (paso 4)
- **"Provisioning profile doesn't include device"**: solo importa para builds Ad Hoc, no para App Store
- **Tarda más de 60 min**: aumentar `max_build_duration` en el yaml o optimizar el build
- **Free tier agotado a fin de mes**: pagás por minuto extra (USD 0.038-0.095) o esperás al 1ro del mes que viene

## Costo estimado realista para Husu Habits

| Mes | Builds estimados | Min consumidos | Costo extra |
|---|---|---|---|
| Mes 1 (setup) | 8-10 builds (debugging) | ~100 min | USD 0 (free tier) |
| Mes 2-3 (iteración) | 4-6 builds/mes | ~60 min | USD 0 |
| Steady state | 2-3 builds/mes | ~30 min | USD 0 |

En el 99% de los casos no vas a pagar nada extra a Codemagic.

## Recursos

- [Codemagic Capacitor guide](https://docs.codemagic.io/yaml-quick-start/building-a-capacitor-app/)
- [Codemagic iOS code signing](https://docs.codemagic.io/yaml-code-signing/signing-ios/)
- [App Store Connect API](https://developer.apple.com/documentation/appstoreconnectapi)
