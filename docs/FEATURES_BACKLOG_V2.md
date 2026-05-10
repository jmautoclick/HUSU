# Husu Habits — Backlog post-research

> Features que emergen de los 6 dossiers de research. Priorizadas por impacto/esfuerzo + brand-defining vs incremental.

## Tier S — implementar ANTES del diseño

Estos cambian pantallas que el diseñador necesita ver. Si el diseñador no los ve, va a tener que rediseñar.

### S1 · Identity-based onboarding step

**Por qué crítico:** 2.7x retención a 6 meses (research Atoms). Brand-defining.
**Esfuerzo:** S (~1.5h)
**Cambios:**
- Agregar 3er step en Onboarding entre welcome y templates: "¿Quién querés ser?" con 6-8 opciones tipo chips ("Alguien que se cuida", "Alguien constante", "Alguien presente", "Alguien curioso", "Alguien fuerte", "Alguien en paz", + custom).
- Guardar en `AppData.identity?: string`
- AI Coach usa esa identity en system context.
- Templates picker filtra "recomendados para vos" basado en identity.

### S2 · Streak Freeze automático y gratis

**Por qué crítico:** Duolingo (Penn/UCLA): -21% churn. Resuelve queja #1 del rubro ("me castiga por un día malo").
**Esfuerzo:** S-M (~2h)
**Cambios:**
- Cada usuario empieza con 2 freezes/mes que se restauran el día 1.
- Si no marca un hábito esperado y tiene racha ≥ 3 días → se consume 1 freeze automático (visible en streak badge: 🛡️ en vez de 🔥 ese día).
- Modal "Te queda 1 escudo este mes" sin tono regañón.
- NUNCA paywall, NUNCA "comprar más freezes".
- Lógica en `src/lib/streaks.ts`, storage agrega `freezesRemaining: number; freezesResetMonth: string`.

### S3 · Library expandida 104 templates con difficulty + keystone + recommended

**Por qué crítico:** la biblioteca de 15 actual no cubre el espectro. Diseñador necesita ver picker con esta densidad.
**Esfuerzo:** M (~2h)
**Cambios:**
- Extender `HabitTemplate` interface: agregar `difficulty: 'easy' | 'medium' | 'hard'`, `keystone: boolean`, `description: string`, `recommendedFor: string[]`, mantener `category` como string libre (12 categorías ahora).
- Migrar `src/lib/templates.ts` desde `docs/HABIT_LIBRARY.json` (104 entries).
- TemplatesModal + Onboarding: filtros por categoría + badge "⭐ Recomendado" en top 20 + badge "🪨 Keystone" sutil.
- Onboarding limita visualmente a "elegí hasta 5 para empezar" (con warning si selecciona más).

### S4 · Correcciones médicas en templates existentes

**Por qué crítico:** evitar mensajes anticientíficos. WHO 2023 retiró "safe levels" de alcohol; "10k pasos" es marketing.
**Esfuerzo:** S (~30 min)
**Cambios:**
- Template "Tomar 2L de agua" → "Hidratarme bien" con descripción "EFSA: ~2L mujeres / 2.5L hombres incluyendo agua de alimentos".
- Cualquier futuro template de pasos: default 7.500, no 10.000.
- Sistema prompt del AI Coach (gemini.ts): agregar instrucción explícita "NUNCA digas que cantidades moderadas de alcohol son saludables. WHO 2023: ningún nivel es seguro."
- Disclaimer médico en una pantalla de info (link en Hábitos tab).

### S5 · Paleta + tipografía nuevas (CSS tokens swap)

**Por qué crítico:** locked decisions del branding. El diseñador trabaja sobre estos tokens.
**Esfuerzo:** S-M (~1.5h)
**Cambios:**
- Reemplazar variables CSS de `:root` con la paleta Husu (clay/cream/ink/sage/sand/dusk/ember/mist).
- Reemplazar gradiente naranja-rojo `--accent` con algo basado en clay+ember.
- Self-hostear Fraunces y Nunito (Google Fonts) — agregar a index.html o como WOFF2 en /public.
- Aplicar Fraunces a `h1`, `h2`, gradient title del header. Nunito a body/UI.
- Validar contraste WCAG AA en todos los pares.

**Total Tier S: ~7-8 horas.** Después del Tier S, mandar a diseño.

---

## Tier A — implementar DESPUÉS del diseño (Wave 6)

### A1 · Sunday Recap shareable

**Por qué importante:** Spotify Wrapped pattern, alta viralidad, AI Coach value-add.
**Esfuerzo:** M-L (~4h)
**Cambios:**
- Cada domingo a la noche, generar tarjeta visual con stats de la semana (rachas, hábito top, día perfect, % cumplimiento).
- Botón "Compartir" usa `@capacitor/share`.
- AI Coach genera 1 párrafo personalizado basado en patrones de la semana.

### A2 · One-tap check desde notificación

**Por qué importante:** fricción <5s = retención. Pillar 1 según UX research.
**Esfuerzo:** M (~3h)
**Cambios:**
- Notificación con action button "Hecho ✓" (Android NotificationCompat.Action).
- Capacitor: necesita listener custom o plugin custom, ya que LocalNotifications básico no expone action handling completo. Investigar `@capacitor-community/notification-actions` o similar.

### A3 · Pattern detection del AI Coach

**Por qué importante:** value-add real del AI Coach (vs chatbot motivacional vacío).
**Esfuerzo:** M (~3h)
**Cambios:**
- Pre-procesar data antes de mandar al LLM: detectar "fallás más los lunes", "cumplís X cuando dormís 7+ hs", correlaciones simples entre hábitos.
- Inyectar findings en system context.
- AI Coach puede sugerir habit chains basados en patterns reales.

### A4 · Habit grouping por momento del día

**Por qué importante:** Habitify hace esto bien. Reduce cognitive load.
**Esfuerzo:** M (~2.5h)
**Cambios:**
- Agregar `habit.timeSlot?: 'morning' | 'afternoon' | 'evening' | 'anytime'`
- Registro tab agrupa hábitos por slot.
- Modal hábito: nuevo selector tipo chips.

### A5 · Implementation intentions ("cuándo / dónde")

**Por qué importante:** d=0.65 effect size (Gollwitzer). El single mejor predictor de adherencia.
**Esfuerzo:** S (~1h)
**Cambios:**
- Agregar `habit.intention?: { trigger: string; location?: string }`
- Modal: "Voy a hacer este hábito cuando: [campo libre]" + "Dónde: [campo libre opcional]"
- AI Coach lo usa: "Te recordamos que este hábito lo hacés cuando termine de cenar."

### A6 · Achievement día 66

**Por qué importante:** premiar el hito real (Lally) en vez del folk 21.
**Esfuerzo:** XS (~15 min)
**Cambios:**
- Sumar a `ACHIEVEMENTS`: `{ id: 'streak_66', emoji: '🌱', title: 'Hábito formado', description: '66 días — la ciencia dice que ya es parte de vos.' }`
- Sumar regla en achievements.evaluate.

---

## Tier B — nice to have, post-launch

### B1 · Widget Android home screen

**Esfuerzo:** XL (1-2 semanas, módulo nativo Java/Kotlin)
**Por qué B:** valioso pero efforte alto y se puede vivir sin él al MVP.

### B2 · Wearable companion (Wear OS)

**Esfuerzo:** XL
**Por qué B:** súper feature pero LATAM tiene baja penetración Wear OS.

### B3 · Year in pixels view

**Esfuerzo:** M
**Por qué B:** ya tenemos heatmap anual GitHub-style. Variant similar.

### B4 · Mood tracking adicional al hábito

**Esfuerzo:** M-L
**Por qué B:** scope creep — Husu es habit tracker, mood es otro mercado.

### B5 · Stagger automático de notificaciones

**Esfuerzo:** S
**Por qué B:** evita que sonen 4 notifs a la misma hora. Importante pero post-launch.

### B6 · Streak repair / "make-up day"

**Esfuerzo:** M
**Por qué B:** complement a streak freeze. Probar primero si freeze solo alcanza.

---

## Resumen visual

```
┌─────────────────────────────────────────────────────────┐
│ HOY: 13 features implementadas (Wave 1-4)               │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ TIER S: Wave 5 — pre-diseño (~7-8 hs)                   │
│ S1 Identity onboarding · S2 Streak freeze ·             │
│ S3 Library 104 · S4 Fixes médicos · S5 Paleta+fonts     │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ DISEÑO: Claude Design con prompt actualizado            │
│ Output: mockups + tokens + mascota + animaciones        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ TIER A: Wave 6 — post-diseño (~12-15 hs)                │
│ A1-A6: recap, one-tap notif, pattern AI, grouping,      │
│        intentions, día 66                               │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ TIER B: backlog post-launch                             │
│ Widget · Wear OS · pixels view · mood · stagger · repair│
└─────────────────────────────────────────────────────────┘
```

**Total para llegar a Play Store top-tier:** ~20-25 hs adicionales de implementación + tiempo de diseño con Claude Design.
